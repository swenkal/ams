const qs = require('querystring'),
      router = require('../../../router');

module.exports = {
  path: new RegExp('^\/disciplines\/$'),
  processor(request, response, callback, sessionContext, sessionToken, db){
    if( sessionContext == undefined || sessionContext == null || sessionContext['id'] !== undefined) {
      callback();
      return router.bleed(301, '/login/', response);
    }
    db.collection('disciplines').aggregate([
      {
        $lookup:
        {
          from: 'groups',
          let: { groups: '$groups'},
          pipeline: [
            { $match:
              {$expr:
                { $in: [ {$toString: '$_id'}, '$$groups' ]}
              }
            },
            { $project: {_id: 0, fullname: 1, name: 1, course: 1, typeEducation: 1}},
          ],
          as: 'groupsInfo'
        }
      },
        {
          $lookup:
            {
              from: 'users',
              let: { editors: '$editors'},
              pipeline: [
                { $match:
                   {$expr:
                    { $in: [ {$toString: '$_id'}, '$$editors' ]}
                   }
                },
                { $project: {_id: 0, lastName: 1, name: 1, fatherName: 1}},
              ],
              as: 'editorsInfo'
            }
         },
    ]).sort({name: 1}).toArray((err, result) => {
      if(err) {
        callback();
        router.bleed(500, null, response, err);
      }
      const disciplines = result;
      db.collection('users').findOne(
        { _id: sessionContext.id },
        { securityRole : 1, username : 1, group: 1 },
      (err, result) => {
        if(err) {
          callback();
          return router.bleed(500, null, response, err);
        }
        let userInfo = result;
        if(userInfo.securityRole.length !== 0 && userInfo.securityRole.includes('teacher')) {
          let teacherDisciplines = [],
              otherDisciplines = [];
          for(let disc of disciplines) {
            if(disc.editors !== undefined && disc.editors.includes(userInfo._id.toString())) {
              teacherDisciplines.push(disc);
            } else {
              otherDisciplines.push(disc);
            }
          }
          return callback({
            title: 'Дисциплины',
            urlDiscDetail: '/disciplines/',
            teacherDisciplines: teacherDisciplines,
            otherDisciplines: otherDisciplines,
            userInfo: userInfo
          }, 'disciplines', 0, 0);
        } else if(userInfo.securityRole.length !== 0 && userInfo.securityRole.includes('student') && userInfo.group !== undefined) {
          let studentDisciplines = [],
              otherDisciplines = [];
          for(let disc in disciplines){
            if(disciplines[disc].groups !== undefined && disciplines[disc].groups.includes(userInfo.group.toString())) {
              studentDisciplines.push(disciplines[disc]);
            } else {
              otherDisciplines.push(disciplines[disc]);
            }
          }
          return callback({
            title: 'Дисциплины',
            urlDiscDetail: '/disciplines/',
            studentDisciplines: studentDisciplines,
            otherDisciplines: otherDisciplines,
            userInfo: userInfo
          }, 'disciplines', 0, 0);
        } else {
          return callback({
            title: 'Дисциплины',
            urlDiscDetail: '/disciplines/',
            disciplines: disciplines,
            userInfo: userInfo
          }, 'disciplines', 0, 0);
        }
      });
    });
  }
}
