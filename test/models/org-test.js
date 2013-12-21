(function (test, v) {
  buster.testCase('models/org:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test validation": function () {
      var validators = AppModel.Org._fieldValidators;

      assert.validators(validators.name, {maxLength: [200], required: [true], trim: [true]});
      assert.validators(validators.email, {maxLength: [200], required: [true], trim: [true],
                                           inclusion: [{allowBlank: true, matches: Apputil.EMAIL_RE }], normalize: ['downcase']});
      assert.validators(validators.initials, {maxLength: [4], required: [true], trim: [true]});
    },
  });
})();
