define(function(require, exports, module) {
  var util = require('koru/util');
  var ChangeLog = require('./change-log');
  var User = require('./user');
  var Val = require('koru/model/validation');
  var Event = require('models/event');

  return function (model) {
    ChangeLog.logChanges(model, {parent: Event});

    util.extend(model.prototype, {
      authorize: function (userId) {
        var user = User.findById(userId);
        Val.allowAccessIf(user && user.org_id === this.org_id || user.role.indexOf(User.ROLE.superUser) >= 0);
      },
    });

  };
});
