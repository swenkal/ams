const qs = require('querystring'),
      archiver = require('archiver'),
      router = require('../../../router.js'),
      cookie = require('cookie'),
      http = require('http'),
      path = require('path');

module.exports = {
  path : new RegExp('^\/createZip\/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {
    const userAuthed = isUserAuthed(sessionContext, sessionToken);
    if(!userAuthed) return redirectToLoginPage(response, callback);

    if(request.method == 'POST'){
      router.downloadClientPostData(request, (err, data) => {
        if(err) return redirectTo400Page(response, callback);
        let filesFromClient = [];
        try {
          const STORAGE_DATA_LOCATION = process.env['STORAGE_DATA_LOCATION'] ? `${process.env['STORAGE_DATA_LOCATION']}/private` : '';
          const PATH_TO_FILES = STORAGE_DATA_LOCATION || '/Users/ksndr/Projects/ams/data/private';
          let postData = qs.parse(data);

          filesFromClient = postData.files.map(curFile => {
            curFile = JSON.parse(curFile);
            curFile.fullPath = `${PATH_TO_FILES}${curFile.fullPath}`;
            return curFile;
          });

          response.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-disposition': `attachment; filename=${postData.discUrl}.zip`
          });
          const zip = archiver('zip');

          zip.pipe(response);
          for(let curFile of filesFromClient) {
            zip.file(curFile.fullPath, { name: curFile.fullName });
          }
          zip.finalize();

          zip.on('end', function() {
            console.log('Archive wrote %d bytes', zip.pointer());
          });
        } catch(err) {
          return redirectTo500Page(response,callback, err);
        }
        let fileInfo = {};
        db.collection('users').findOne(
          { _id: sessionContext.id },
          { group: 1, securityRole: 1 },
          (err, user) => {
            if (err) console.log(err);

            let group = user.securityRole[0];
            if (user.group) group = user.group;

            db.collection('groups').findOne(
              { _id: group },
              { url: 1 },
              (err, groupURL) => {
                if (err) console.log(err);
                if (groupURL) group = groupURL.url;

                fileInfo.userGroup = group;

                const fileIDs = filesFromClient.map(curFile => curFile.fullPath.split('/').pop());
                console.log(fileIDs[0]);
                db.collection('disciplines').findOne(
                  { files: fileIDs[0] },
                  { allias: 1 },
                  (err, discipline) => {
                    if (err) console.log(err);

                    fileInfo.discipline = discipline.allias;
                    fileInfo.downloadDate = Date.now();
                    const rawCookies = request.headers.cookie;
                    const cookies = cookie.parse(rawCookies);
                    fileInfo.uniqueID = cookies['uniqueID'];
                    fileInfo.visitID = cookies['visitID'];
                    let [,,domain, ...refererUrl] = request.headers.referer.split('/');
                    fileInfo.isArchive = true;
                    fileInfo.referrer = 'Empty';
                    if (request.headers.referer)
                        fileInfo.referrer = request.headers.referer;
                    let downloadedFiles = [];
                    for (let file of fileIDs) {
                      fileInfo.fileID = file;
                      downloadedFiles.push(fileInfo);
                    }
                    const options = {
                      hostname: 'localhost',
                      port: 5000,
                      path: '/files',
                      method: 'POST',
                    };

                    const req = http.request(options, res => {
                      console.log(`statusCode: ${res.statusCode}`);
                    })

                    req.on('error', error => {
                      console.error(error)
                    });

                    req.write(JSON.stringify(downloadedFiles));
                    req.end();
                  });
                });
          });
      });
    } else {
      return redirectTo404Page(response,callback);
    }
  }
}

function isUserAuthed(sessionContext, sessionToken) {
  return (typeof sessionToken === 'string' &&
    sessionContext instanceof Object &&
    sessionContext['id'] !== undefined);
}

function redirectToLoginPage(response, callback) {
  callback();
  return router.bleed(301, '/login/', response);
}

function redirectTo404Page(response, callback) {
  callback();
  return router.bleed(404, null, response);
}

function redirectTo400Page(response, callback) {
  callback();
  return router.bleed(400, null, response);
}

function redirectTo500Page(response, callback, err) {
  callback();
  return router.bleed(500, null, response, err);
}
