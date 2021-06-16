const fs = require('fs'),
      path = require('path'),
      deleteFileFromDB = require('./dbMethods.js').deleteFileFromDB;

/*CONST VARS*/
const STORAGE_DATA_LOCATION = process.env['STORAGE_DATA_LOCATION'] ?
                        `${process.env['STORAGE_DATA_LOCATION']}/private` : '',
      PATH_TO_FILES_DIR = STORAGE_DATA_LOCATION ||
                          path.join(__dirname, '../../../../', '/data/private');

module.exports = {
  checkDiscAllias,
  checkAndAddEditors,
  convertToArray,
  getDiscAlliasFromUrl,
  deleteDisciplineFiles
}

function checkDiscAllias(allias) {
  const russianRegexp = new RegExp(/[А-яЁё]/gi);
  if (russianRegexp.test(allias)) {
    return 'Имя ссылки(URL) должно быть на английском!';
  }

  const protocolRegexp = new RegExp(/\/|http|@|:|ftp/gi);
  if (protocolRegexp.test(allias)) {
    return 'Неправильное имя ссылки(URL) для дисциплины!';
  }

  return '';
}

function checkAndAddEditors(user, postData) {
  const userID = user._id.toString();
  //if key not exist, this means, what teacher create discipline, add his ID
  if (!postData.editors) return convertToArray(userID);

  //if one editor, he will be with type string. Convert to array.
  return convertToArray(postData.editors);
}

function convertToArray(element) {
  if (Array.isArray(element)) return element;
  if (typeof element === 'string') return [element];
  if (typeof element === 'undefined') return [];
  if (typeof element === 'object') return Object.entries(element);
  return element;
}

function getDiscAlliasFromUrl(clientUrl) {
  let requestedURL = decodeURI(clientUrl);
  const delimeteredURL = requestedURL.split('/');
  return delimeteredURL[delimeteredURL.length - 2];
}

/*DELETE FUNCS*/
function deleteDisciplineFiles(fileIDs, db, callback) {
  let errorCounter = 0;
  for (let fileID of fileIDs) {

    deleteFileFromServer(fileID, err => {

      if (err) {
        console.log(`Error deleting file ${fileID} from server: ${err}`);
        errorCounter++;
      }
      const dirName = fileID.substr(0,2);

      deleteDirIfEmpty(dirName, err => {
        if (err) {
          console.log(`Error deleting dir ${dirName}: ${err}`);
          errorCounter++;
        }
        // required from /disciplines/dbMethods.js
        deleteFileFromDB(fileID, db, err => {
          if (err) {
            console.log(`Error deleting file ${fileID} from DB: ${err}`);
            errorCounter++;
          }
        }); //deleteFileFromDB
      }); //deleteDirIfEmpty
    }); //deleteFileFromServer
  }
  return callback(errorCounter);
}

function deleteFileFromServer(fileID, callback) {
  const dirName = fileID.substr(0, 2);
  const pathToCurrentFile = `${PATH_TO_FILES_DIR}/${dirName}/${fileID}`;
  checkExistPath(pathToCurrentFile, checkedPath => {
    if (checkedPath == null) return callback(null);
    return fs.unlink(checkedPath, callback);
  });
}

function deleteDirIfEmpty(dirName, callback) {
  const pathToCurrentDir = `${PATH_TO_FILES_DIR}/${dirName}`;
  checkExistPath(pathToCurrentDir, checkedPath => {
    if (checkedPath == null) return callback(null);

    fs.readdir(checkedPath, (err, files) => {
      if (err) return callback(err);
      if (files.length) return callback(null);
      fs.rmdir(pathToCurrentDir, (err) => {
        if (err) return callback(err);
        return callback(null);
      }); // fs.rmdir
    }); // fs.readdir
  }); // checkExistPath
}

function checkExistPath(pathForCheck, callback) {
  if( !fs.existsSync(pathForCheck) ) {
    console.log(`${pathForCheck} not existent`);
    return callback(null);
  }
  return callback(pathForCheck);
}
