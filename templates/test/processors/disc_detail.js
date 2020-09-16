const qs = require('querystring'),
      router = require("../../../router"),
      security = require("../../../security"),
      beautyDate = require('../../../beautyDate');

module.exports = {
  path: new RegExp("^\/disciplines\/[^\/]+\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    console.log(`sessionContext: ${sessionContext}\n sessionToken: ${sessionToken}\n`);
    const userAuthed = isUserAuthed(sessionContext, sessionToken);
    console.log(`userAuthed : ${userAuthed}`);
    if(!userAuthed) return redirectToLoginPage(response, callback);

    requestedUrl = decodeURI(request.url);
    delimeteredUrl = requestedUrl.split("/");
    disciplineAllias = delimeteredUrl[delimeteredUrl.length-2];
    db.collection("disciplines").findOne({allias : disciplineAllias}, function(err, result){
      if(err){
        callback();
        router.bleed(500, null, response, err);
      }
      if(result == null){
        callback();
        console.log(`Not found discipline "${disciplineAllias}" redirecting on disciplines list...`);
        return router.bleed(301, "/disciplines/", response);
      }
      const disc_detail = result;
      let disc_files = [];
        db.collection("users").findOne({_id : sessionContext.id}, {securityRole : 1, username : 1}, function(err, result){
          if(err){
            callback();
            return router.bleed(500, null, response, err);
          }
          let userInfo = result;
          if(disc_detail.files.length == 0){
            return callback({
              title: "О дисциплине",
              userInfo: userInfo,
              discipline: disc_detail,
              files: disc_files
            }, "disc_detail", 0, 0);
          }
          db.collection("files").find({_id: {$in: disc_detail.files}}).sort({dateEdit: -1}).toArray(function(err, result){
            if(err){
              callback();
              return router.bleed(500, null, response, err)
            }
            disc_files = result;
            for (let file of disc_files){
              file.formatedDate = beautyDate(file.dateEdit);
              file.fullName = `${file.name}.${file.ext}`;
              const dirName = file._id.substr(0,2);
              file.fullPath = `/${dirName}/${file._id}`;
            }
            return callback({
              title: "О дисциплине",
              userInfo: userInfo,
              discipline: disc_detail,
              files: disc_files
            }, "disc_detail", 0, 0);
          });
        });
    });
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
