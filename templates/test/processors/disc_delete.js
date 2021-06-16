const check = require('./common/permission_check.js'),
      bw = require('./common/bleed_wrapper.js'),
      dbMethods = require('./disciplines/dbMethods.js'),
      funcs = require('./disciplines/funcs.js');


module.exports = {
  path: new RegExp('^\/disciplines\/delete\/[^\/]+\/$'),
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

      const disciplineAllias = funcs.getDiscAlliasFromUrl(request.url);

      dbMethods.findDisciplineByAllias(disciplineAllias, db, (err, result) => {

        if (err) return bw.redirectTo500Page(response, err, callback);
        if (!result) return bw.redirectTo404Page(response, request.url, callback);

        const discipline = result;

        const teacherEditor = check.isTeacherDiscEditor(userInfo, discipline);
        if (!teacherEditor) {
          const err = new Error('Teacher is not discipline editor');
          return bw.redirectWithErrorCode(response, 403, err, callback);
        }

        if (request.method !== 'POST') {
          return callback({
            title: 'Удаление дисциплины',
            discipline: discipline
          }, 'disc_delete', 0, 0);
        }

        //get attached files to discipline
        const fileIDs = discipline.files;
        //delete attached files if exists
        if (fileIDs.length > 0) {
          funcs.deleteDisciplineFiles(fileIDs, db, errorCount => {
            if (errorCount > 0) {
              console.log(`${errorCount} delete errors!`);
            } else {
              console.log(`Delete files successful for ${disciplineAllias}`);
            }
          });
        }

        dbMethods.deleteDiscFromDB(disciplineAllias, db, (err, result) => {
          if (err) return bw.redirectTo500Page(response, err, callback);

          console.log(`Discipline '${disciplineAllias}' deleted!`);
          return bw.redirectToDiscPage(response, callback);
        });//deleteDiscFromDB
      }); //findDisciplineByAllias
    }); //getRoleForAuthedUser
  }
}
