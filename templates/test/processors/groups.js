const router = require('../../../router');

module.exports = {
  path: new RegExp('^/groups/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {
    if (sessionToken == null || sessionContext == undefined || sessionContext == null) {
      callback();
      return router.bleed(301, '/login/', response);
    }
    db.collection('users').findOne({ _id: sessionContext.id }, { username: 1, securityRole: 1 }, (err, result) => {
      if (err) {
        callback();
        return router.bleed(500, null, response, err);
      }
      const userInfo = result;
      db.collection('groups').aggregate([
        {
          $lookup:
           {
             from: 'users',
             let: { elder: '$elder' },
             pipeline: [
               { $match:
                 { $expr:
                   { $eq: ['$_id', '$$elder'] }
                 }
               },
               { $project: { lastName: 1, name: 1 } },
             ],
             as: 'elderInfo'
           }
        }
      ]).sort({ course: -1 }).toArray((err, result) => {
        if (err) {
          callback();
          return router.bleed(500, null, response, err);
        }
        const groups = result;
        return callback({
          title: 'Группы',
          groups,
          userInfo
        }, 'groups', 0, 0);
      });
    });
  }
}
