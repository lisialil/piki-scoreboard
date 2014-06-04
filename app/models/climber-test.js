define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var Climber = require('./climber');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    'test creation': function () {
      var climber=TH.Factory.createClimber();

      assert(Climber.exists(climber._id));

      assert.same(climber.number, 1);

      assert(climber.club);
      assert(climber.org);
    },

    'test standard validators': function () {
      var validators = Climber._fieldValidators;

      assert.validators(validators.name, {maxLength: [200], required: [true], trim: [true], unique: [{scope: 'org_id'}]});
      assert.validators(validators.gender, {inclusion: [{allowBlank: true, matches: /^[mf]$/ }]});
      assert.validators(validators.club_id, {required: [true]});
      assert.validators(validators.dateOfBirth, {inclusion: [{matches: /^\d{4}-[01]\d-[0-3]\d$/ }]});
      assert.validators(validators.number, {number: [{integer: true, $gt: 0}]});
    },
  });
});