define(function(require, exports, module) {
  const Val       = require('koru/model/validation');
  const util      = require('koru/util');
  const Event     = require('models/event');
  const ChangeLog = require('./change-log');
  const User      = require('./user');

  const FIELD_SPEC = {
    time: 'integer',
    scores: 'object',
    problems: 'object',
  };

  const NEW_FIELD_SPEC = {
    _id: 'id',
    event_id: 'id',
    climber_id: 'id',
    category_id: 'id',
    competitor_id: 'id',
  };

  return function (Result) {
    ChangeLog.logChanges(Result, {parent: Event});

    util.extend(Result.prototype, {
      authorize(userId) {
        Val.assertDocChanges(this, FIELD_SPEC, NEW_FIELD_SPEC);
        User.fetchAdminister(userId, this);
        Val.allowAccessIf(! this.event.closed);
      },
    });

  };
});
