const ObjectID = require('mongodb').ObjectID;

module.exports = {
  getRoleForAuthedUser,
  getAllGroups,
  getAllTeachers,
  findDisciplineByAllias,
  findDisciplineFiles,
  addDisciplineToDB,
  editDiscInDB,
  deleteFileFromDB,
  deleteDiscFromDB,
  getAllUserInfo,
  aggregateDisciplinesWithEditorsAndGroups
};


/*COMMON METHODS*/
function getRoleForAuthedUser(userID, db, callback) {
  db.collection('users').findOne(
    { _id: new ObjectID(userID) },
    { _id: 1, securityRole: 1 },
    callback);
}

function getAllGroups(db, callback) {
  db.collection('groups').find().toArray(callback);
}

function getAllTeachers(db, callback) {
  db.collection('users').find({ securityRole: 'teacher' }).toArray(callback);
}

function findDisciplineByAllias(disciplineAllias, db, callback) {
  db.collection('disciplines').findOne(
    { allias: disciplineAllias },
    callback );
}

/*DETAIL METHODS*/
function findDisciplineFiles(files, db, callback) {
  db.collection('files').find(
    { _id: { $in: files } })
    .sort({ dateEdit: -1 })
    .toArray(callback);
}

/*CREATE METHODS*/
function addDisciplineToDB(user, discInfo, db, callback) {
  db.collection('disciplines').insertOne({
    name: discInfo.name,
    mnemo: discInfo.mnemo,
    allias: discInfo.allias,
    description: discInfo.description,
    creator: user._id.toString(),
    dateCreate: new Date(),
    dateUpdate: new Date(),
    lastEditor: user._id.toString(),
    editors: discInfo.editors,
    groups: discInfo.groups,
    files: []
  }, callback);
}
/*EDIT METHODS*/
function editDiscInDB(discAllias, userInfo, discInfo, db, callback) {
  db.collection('disciplines').findOneAndUpdate(
    { allias: discAllias },
    { $set: {
        name: discInfo.name,
        mnemo: discInfo.mnemo,
        allias: discInfo.allias,
        description: discInfo.description,
        groups: discInfo.groups,
        dateUpdate: new Date(),
        lastEditor: userInfo._id,
        editors: discInfo.editors
      }
    },
    callback);
}
/*DELETE METHODS*/
function deleteFileFromDB(fileID, db, callback) {
  db.collection("files").deleteOne(
    { _id: fileID },
    callback);
}

function deleteDiscFromDB(allias, db, callback) {
  db.collection('disciplines').deleteOne(
    { allias: allias },
    callback);
}

/*GET METHODS*/
function getAllUserInfo(userID, db, callback) {
  db.collection('users').findOne(
    { _id: new ObjectID(userID) },
    callback);
}

function aggregateDisciplinesWithEditorsAndGroups(db, callback) {
  db.collection('disciplines').aggregate([
    {
      $lookup: { // like join in SQL
        from: 'groups', // from collection with name 'groups'
        let: { groups: '$groups' }, //declare var from 'disciplines' collection
        pipeline: [
          {
            $match: { // for all matched documents
              $expr: {
                // where _id from 'groups' collection
                // exists in array '$$groups' (from 'disciplines' collection)
                $in: [ {$toString: '$_id'}, '$$groups' ]
              }
            }
          },
          {
            $project: { // what fields needed
              _id: 0, fullname: 1, name: 1, course: 1, typeEducation: 1
            }
          },
        ], // end pipeline
        as: 'groupsInfo'
      } //end $lookup
    },
    {
      $lookup: {
        from: 'users',
        let: { editors: '$editors'},
        pipeline: [
          {
            $match: { // for all matched documents
              $expr: {
                // where _id from 'users' collection
                // exists in array '$$editors' (from 'disciplines' collection)
                $in: [ {$toString: '$_id'}, '$$editors' ]
              }
            }
          },
          {
            $project: { // what fields needed
              _id: 0, lastName: 1, name: 1, fatherName: 1
            }
          },
        ], // end pipeline
            as: 'editorsInfo'
      } //end $lookup
    },
  ]) // end aggregate
  .sort({ name: 1 })
  .toArray(callback);
}
