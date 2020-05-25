const qs = require('querystring'),
      router = require("../../../router"),
      security = require("../../../security"),
      beautyDate = require('../../../beautyDate');

module.exports = {
  path: new RegExp("^\/disciplines\/[^\/]+\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
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
            for (let file in disc_files){
              disc_files[`${file}`].formatedDate = beautyDate(disc_files[file].dateEdit);
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
