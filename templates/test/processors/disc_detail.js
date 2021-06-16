const beautyDate = require('../../../beautyDate'),
  check = require('./common/permission_check.js'),
  bw = require('./common/bleed_wrapper.js'),
  dbMethods = require('./disciplines/dbMethods.js'),
  funcs = require('./disciplines/funcs.js');

module.exports = {
  path: new RegExp('^\/disciplines\/[^\/]+\/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {

    const userAuthed = check.isUserAuthed(sessionContext, sessionToken);
    if (!userAuthed) return bw.redirectToLoginPage(response, callback);

    dbMethods.getRoleForAuthedUser(sessionContext.id, db, (err, result) => {

      if (err) return bw.redirectTo500Page(response, err, callback);
      const userInfo = result;

      const discAllias = funcs.getDiscAlliasFromUrl(request.url);

      dbMethods.findDisciplineByAllias(discAllias, db, (err, result) => {

        if (err) return bw.redirectTo500Page(response, callback, err);
        if (result == null)
            return bw.redirectTo404Page(response, request.url, callback);

        const discipline = result;
        let discFiles = funcs.convertToArray(discipline.files);

        if (discFiles.length == 0) {
          return callback({
            title: 'О дисциплине',
            userInfo: userInfo,
            discipline: discipline,
            files: discFiles
          }, 'disc_detail', 0, 0);
        }

        dbMethods.findDisciplineFiles(discFiles, db, (err, result) => {

          if (err) return bw.redirectTo500Page(response, err, callback);
          discFiles = result;

          discFiles.forEach(file => {
            file.formatedDate = beautyDate(file.dateEdit);
            file.fullName = `${file.name}.${file.ext}`;
            const dirName = file._id.substr(0,2);
            file.fullPath = `/${dirName}/${file._id}`;
          });

          return callback({
            title: 'О дисциплине',
            userInfo: userInfo,
            discipline: discipline,
            files: discFiles
          }, 'disc_detail', 0, 0);
        }); //findDisciplineFiles
      }); //findDisciplineByAllias
    }); //getRoleForAuthedUser
  }
};
