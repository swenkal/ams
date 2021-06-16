const fs = require('fs'),
  path = require('path'),
  router = require('../../../router.js'),
  qs = require('querystring');
  check = require('./common/permission_check.js');
module.exports = {
  path: new RegExp('^/public-upload/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {
    const userAuthed = check.isUserAuthed(sessionContext, sessionToken);
    if (!userAuthed) {
      callback();
      response.statusCode = 403;
      response.statusMessage = 'User not authed!';
      return response.end();
    }
    if (request.method === 'POST') {
      const PATH_TO_PUBLIC = path.join(__dirname, '../../../data/public');
      const randomFileName = generateRandomString();
      const fullFilePath = `${PATH_TO_PUBLIC}/${randomFileName}`;
      request.pipe(fs.createWriteStream(fullFilePath))
        .on('finish', () => {
          callback();
          response.end(randomFileName);
        });
    }
  }
};

function generateRandomString(length) {
  let lengthString = length || 16;
  let resultString = '';
  let randNum;
  while (lengthString--) {
    randNum = Math.floor(Math.random() * 62);
    resultString += String.fromCharCode(randNum + (randNum < 10 ? 48 : randNum < 36 ? 55 : 61));
  }
  return resultString;
}
