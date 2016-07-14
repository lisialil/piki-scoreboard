define(function (require, exports, module) {
  var test, v;
  const koru       = require('koru');
  const Competitor = require('models/competitor');
  const TH         = require('test-helper');
  const Category   = require('./category');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
      v.org = TH.Factory.createOrg();
      v.user = TH.Factory.createUser();
    },

    tearDown() {
      TH.clearDB();
      v = null;
    },

    "authorize": {
      "test denied"() {
        var oOrg = TH.Factory.createOrg();
        var oUser = TH.Factory.createUser();

        var category = TH.Factory.buildCategory();

        test.stub(koru, 'info');
        assert.accessDenied(function () {
          category.authorize(v.user._id);
        });
      },

      "test allowed"() {
        var category = TH.Factory.buildCategory();

        refute.accessDenied(function () {
          category.authorize(v.user._id);
        });
      },

      "test okay to remove"() {
        var category = TH.Factory.createCategory();

        refute.accessDenied(function () {
          category.authorize(v.user._id, {remove: true});
        });

      },

      "test remove in use"() {
        var category = TH.Factory.createCategory();
        var competitor = TH.Factory.createCompetitor();

        TH.noInfo();
        assert.accessDenied(function () {
          category.authorize(v.user._id, {remove: true});
        });

      },
    },
  });
});
