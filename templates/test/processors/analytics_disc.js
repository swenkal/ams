const check = require('./common/permission_check.js'),
  bw = require('./common/bleed_wrapper.js'),
  dbMethods = require('./analytics/dbMethods.js'),
  funcs = require('./analytics/funcs.js');

module.exports = {
  path: new RegExp('^\/analytics\/[^\/]+\/$'),
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

      const discAllias = funcs.getDiscAlliasFromUrl(request.url);

      dbMethods.getDiscNameAndEditorsByAllias(discAllias, db, (err, result) => {

        if (err) return bw.redirectTo500Page(response, callback, err);
        if (result == null) return bw.redirectTo404Page(response, request.url, callback);

        const discipline = result;

        const teacherEditorOrAdmin = check.isTeacherDiscEditor(userInfo, discipline);
        if (!teacherEditorOrAdmin) {
          const err = new Error('Teacher is not discipline edirot');
          return bw.redirectWithErrorCode(response, 403, err, callback);
        }

        //vars for default analytics interval
        let end = new Date();
        let start = new Date();
        //from start to end must be 1 week
        start.setDate(start.getDate() - 7);
        //
        end = funcs.convertDateToString(end);
        start = funcs.convertDateToString(start);

        return callback({
          title: 'Аналитика',
          discName: discipline.name,
          start: start,
          end: end
        }, 'analytics_disc', 0, 0);
      });
    });
  }
};