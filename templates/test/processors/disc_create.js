const qs = require('querystring'),
  downloadClientPostData = require('../../../router').downloadClientPostData,
  check = require('./common/permission_check.js'),
  bw = require('./common/bleed_wrapper.js'),
  dbMethods = require('./disciplines/dbMethods.js'),
  funcs = require('./disciplines/funcs.js');

module.exports = {
  path: new RegExp('^\/disciplines\/create\/$'),
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

      dbMethods.getAllGroups(db, (err, result) => {

        if (err) return bw.redirectTo500Page(response, err, callback);
        const groupsInfo = result;

        dbMethods.getAllTeachers(db, (err, result) => {

          if (err) return bw.redirectTo500Page(response, err, callback);
          const teachersList = result;

          if (request.method == 'POST') {
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

                dbMethods.addDisciplineToDB(userInfo, postData, db, err => {

                  if(err) return bw.redirectTo500Page(response, err, callback);

                  console.log(`Discipline ${postData.allias} created!`);
                  return bw.redirectToDiscPage(response, callback);
                });

              } catch(err) {
                console.log(`Processor error disc_create: ${err}`);
                return bw.redirectTo500Page(response, err, callback);
              }
            }); // downloadClientPostData
          //if method not "POST" send page with empty form values
          } else {
            return callback({
              title: 'Новая дисциплина',
              groupsInfo: groupsInfo,
              teachersList: teachersList,
              userInfo: userInfo,
              errorMessage: ''
            }, 'disc_form', 0, 0);
          }
        }); //getAllTeachers
      }); // getAllGroups
    }); //getRoleForAuthedUser
  }
}
