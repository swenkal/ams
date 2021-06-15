const ObjectID = require('mongodb').ObjectID;

module.exports = {
  getRoleForAuthedUser,
  getDiscNameAndEditorsByAllias,
  findDisciplineByAllias,
  getFileNames,
  getCurrentFileName
};


/*COMMON METHODS*/
function getRoleForAuthedUser(userID, db, callback) {
  db.collection('users').findOne(
    { _id: new ObjectID(userID) },
    { _id: 1, securityRole: 1 },
    callback);
}

function getDiscNameAndEditorsByAllias(disciplineAllias, db, callback) {
  db.collection('disciplines').findOne(
    { allias: disciplineAllias },
    { allias: 1, name: 1, editors: 1 },
    callback );
}


/*FILES analytics METHODS*/
function findDisciplineByAllias(disciplineAllias, db, callback) {
  db.collection('disciplines').findOne(
    { allias: disciplineAllias },
    callback );
}

function getFileNames(files, db, callback) {
  db.collection('files').find(
    { _id: { $in: files } },
    { name: 1 })
    .sort({ dateEdit: -1 })
    .toArray(callback);
}

/*ONE FILE analytics METHODS*/
function getCurrentFileName(file, db, callback) {
  db.collection('files').findOne(
    { _id: file },
    { name: 1 },
    callback
  );
}
