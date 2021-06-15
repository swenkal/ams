const url = require('url'),
  check = require('./common/permission_check.js'),
  bw = require('./common/bleed_wrapper.js'),
  dbMethods = require('./analytics/dbMethods.js'),
  funcs = require('./analytics/funcs.js');

module.exports = {
  path: new RegExp('^\/analytics\/[^\/]+\/file\/[^\/]+\/[^\/]*$'),
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

      const discAllias = funcs.getDiscAlliasFromFileUrl(request.url);

      dbMethods.getDiscNameAndEditorsByAllias(discAllias, db, (err, result) => {

        if (err) return bw.redirectTo500Page(response, callback, err);
        if (result == null) return bw.redirectTo404Page(response, request.url, callback);

        const discipline = result;

        const teacherEditorOrAdmin = check.isTeacherDiscEditor(userInfo, discipline);
        if (!teacherEditorOrAdmin) {
          const err = new Error('Teacher is not discipline edirot');
          return bw.redirectWithErrorCode(response, 403, err, callback);
        }

        const query = url.parse(request.url,true).query;
        const checkStart = funcs.checkDateFormat(query['start']);
        const checkEnd = funcs.checkDateFormat(query['end']);
        let end, start;
        if (checkStart && checkEnd) {
          start = query.start;
          end = query.end;
        } else {
          //vars for default analytics interval
          end = new Date();
          start = new Date();
          //from start to end must be 1 week
          start.setDate(start.getDate() - 7);
          //
          end = funcs.convertDateToString(end);
          start = funcs.convertDateToString(start);
        }

        const fileID = funcs.getFileIDFromUrl(request.url);
        console.log(`FILEID \n: ${fileID} \n\n`);
        dbMethods.getCurrentFileName(fileID, db, (err, result) => {
          console.dir(result);
          if (err) return bw.redirectTo500Page(response, err, callback);
          if (result == null) result = { _id: fileID, name: fileID };
          let fileInfo = result;
          console.log(`\n RESULT NAME \n ${fileInfo.name} \n\n`);

          return callback({
            title: 'Аналитика',
            discName: discipline.name,
            fileName: fileInfo.name,
            start: start,
            end: end
          }, 'analytics_file', 0, 0);
        });
      });
    });
  }
};
