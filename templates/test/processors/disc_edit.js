const qs = require('querystring'),
  downloadClientPostData = require('../../../router').downloadClientPostData,
  check = require('./common/permission_check.js'),
  bw = require('./common/bleed_wrapper.js'),
  dbMethods = require('./disciplines/dbMethods.js'),
  funcs = require('./disciplines/funcs.js');

module.exports = {
  path: new RegExp('^\/disciplines\/edit\/[^\/]+\/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {

    const userAuthed = check.isUserAuthed(sessionContext, sessionToken);
    if (!userAuthed) return bw.redirectToLoginPage(response, callback);

    dbMethods.getRoleForAuthedUser(sessionContext.id, db, (err, result) => {

      if (err) return bw.redirectTo500Page(response, err, callback);
      const userInfo = result;

      const userAdminOrTeacher = check.isUserAdminOrTeacher(userInfo);
      if (!userAdminOrTeacher) {
        const err = new Error('User role not admin or teacher');
        return bw.redirectWithErrorCode(response, 403, err, callback);
      }

      let discAllias = funcs.getDiscAlliasFromUrl(request.url);

      dbMethods.findDisciplineByAllias(discAllias, db, (err, result) => {

        if (err) return bw.redirectTo500Page(response, err, callback);
        if (!result) return bw.redirectTo404Page(response, request.url, callback);

        const discipline = result;

        const teacherEditor = check.isTeacherDiscEditor(userInfo, discipline);
        if (!teacherEditor) {
          const err = new Error('Teacher is not discipline editor');
          return bw.redirectWithErrorCode(response, 403, err, callback);
        }

        dbMethods.getAllGroups(db, (err, result) => {

          if (err) return bw.redirectTo500Page(response, err, callback);
          const groupsInfo = result;

          dbMethods.getAllTeachers(db, (err, result) => {

            if (err) return bw.redirectTo500Page(response, err, callback);
            const teachersList = result;

            if (request.method !== 'POST') {
              return callback({
                title: 'Изменение дисциплины',
                discipline: discipline,
                groupsInfo: groupsInfo,
                userInfo: userInfo,
                teachersList: teachersList,
                errorMessage: ''
              }, 'disc_form', 0, 0);
            }
              //required from router.js for download Client Post Data
            return downloadClientPostData(request, (err, data) => {
              if (err) return bw.redirectTo400Page(response, callback);

              try {
                const postData = qs.parse(data);

                const errorMessage = funcs.checkDiscAllias(postData.allias);
                if (errorMessage) {
                  return callback({
                    title: 'Новая дисциплина',
                    discipline: postData,
                    groupsInfo: groupsInfo,
                    teachersList: teachersList,
                    userInfo: userInfo,
                    errorMessage: errorMessage
                  }, 'disc_form', 0, 0 );
                }

                //getting arrays for editors and groups
                postData.editors = funcs.checkAndAddEditors(userInfo, postData);
                postData.groups = funcs.convertToArray(postData.groups);

                //if discipline allias didn't change
                if (discAllias == postData.allias) {
                  return dbMethods.editDiscInDB(discAllias, userInfo, postData, db, err => {
                    if (err) return bw.redirectTo500Page(response, err, callback);
                    console.log(`Discipline ${discAllias} updated!`);

                    return bw.redirectToDiscByAllias(response, discAllias, callback);
                  });//editDiscInDB
                }

                // if disc allias will be changed - check this in db.
                dbMethods.findDisciplineByAllias(postData.allias, db, (err, discFound) => {

                  if (err) return bw.redirectTo500Page(response, err, callback);
                  if (discFound) {
                    return callback({
                      title: 'Новая дисциплина',
                      discipline: postData,
                      groupsInfo: groupsInfo,
                      teachersList: teachersList,
                      userInfo: userInfo,
                      errorMessage: 'Дисциплина с таким URL уже существует!'
                    }, 'disc_form', 0, 0 );
                  }
                  dbMethods.editDiscInDB(discAllias, userInfo, postData, db, err => {
                    if (err) return bw.redirectTo500Page(response, err, callback);

                    discAllias = postData.allias;
                    console.log(`Discipline ${discAllias} updated!`);

                    return bw.redirectToDiscByAllias(response, discAllias, callback);
                  });//editDiscInDB
                });//findDisciplineByAllias

              } catch(err) {
                console.log(`Proccesor error disc_update: ${err}`);
                return bw.redirectTo500Page(response, err, callback);
              }
            }); //downloadClientPostData
          }); //getAllTeachers
        }); //getAllGroups
      }); //findDisciplineByAllias
    }); //getRoleForAuthedUser
  }
};
