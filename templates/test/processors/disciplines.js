const check = require('./common/permission_check.js'),
      bw = require('./common/bleed_wrapper.js'),
      dbMethods = require('./disciplines/dbMethods.js'),
      funcs = require('./disciplines/funcs.js');

module.exports = {
  path: new RegExp('^\/disciplines\/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {

    const userAuthed = check.isUserAuthed(sessionContext, sessionToken);
    if (!userAuthed) return bw.redirectToLoginPage(response, callback);

    dbMethods.aggregateDisciplinesWithEditorsAndGroups(db, (err, result) => {

      if (err) return bw.redirectTo500Page(response, err, callback);

      const disciplines = result;
      dbMethods.getAllUserInfo(sessionContext.id, db, (err, result) => {

        if (err) return bw.redirectTo500Page(response, err, callback);
        const userInfo = result;

        const userTeacher = check.isUserTeacher(userInfo);

        if (userTeacher) {
          let teacherDisciplines = [],
              otherDisciplines = [];
          for (let disc of disciplines) {
            const editors = disc.editors;
            const userID = userInfo._id.toString();

            if (editors !== undefined && editors.includes(userID)) {
              teacherDisciplines.push(disc);
            } else {
              otherDisciplines.push(disc);
            }
          }

          return callback({
            title: 'Дисциплины',
            urlDiscDetail: '/disciplines/',
            teacherDisciplines: teacherDisciplines,
            otherDisciplines: otherDisciplines,
            userInfo: userInfo
          }, 'disciplines', 0, 0);
        }

        const userStudentWithGroup = check.isUserStudentWithGroup(userInfo);

        if (userStudentWithGroup) {

          let studentDisciplines = [],
              otherDisciplines = [];
          for (let disc of disciplines) {
            const groups = disc.groups;
            const userGroup = userInfo.group.toString();

            if (groups !== undefined && groups.includes(userGroup)) {
              studentDisciplines.push(disc);
            } else {
              otherDisciplines.push(disc);
            }
          }

          return callback({
            title: 'Дисциплины',
            urlDiscDetail: '/disciplines/',
            studentDisciplines: studentDisciplines,
            otherDisciplines: otherDisciplines,
            userInfo: userInfo
          }, 'disciplines', 0, 0);
        }

        return callback({
          title: 'Дисциплины',
          urlDiscDetail: '/disciplines/',
          disciplines: disciplines,
          userInfo: userInfo
        }, 'disciplines', 0, 0);
      }); // getRoleForAuthedUser
    }); //aggregateDisciplinesWithEditorsAndGroups
  }
};
