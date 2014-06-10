isClient && define(function (require, exports, module) {
  var test, v;
  var TH = require('./test-helper');
  var sut = require('./reset-password');
  var Route = require('koru/ui/route');
  var User = require('models/user');
  var App = require('ui/app');
  var UserAccount = require('koru/user-account');
  var Random = require('koru/random');
  var Home = require('./home');
  var env = require('koru/env');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      v.org =  TH.Factory.createOrg();
      TH.loginAs(v.user = TH.Factory.createUser());
      TH.setOrg(v.org);
      v = {
        key: Random.id(),
      };
      test.stub(UserAccount, 'resetPassword');
      test.stub(Route, 'replacePath');
    },

    tearDown: function () {
      TH.tearDown();
      v = null;
    },

    "test token expired": function () {
      Route.gotoPath('/reset-password/' + v.key);

      TH.input('[name=newPassword]', 'secret');
      TH.input('[name=confirm]', 'secret');
      TH.click('[type=submit]');

      assert.calledWith(UserAccount.resetPassword, v.key, 'secret', TH.match(function (callback) {
        v.callback = callback;
        return typeof callback === 'function';
      }));

      test.stub(env, 'error');

      v.callback({error: 403, reason: 'token expired', message: 'foo'});

      assert.dom('#ResetPassword', function () {
        assert.dom('.error[name=newPassword]+span.errorMsg', 'token expired');
      });

      assert.calledWith(env.error, 'foo');
    },

    "test update": function () {
      Route.gotoPath('/reset-password/' + v.key);

      assert.dom('#ResetPassword', function () {
        assert.dom('form', function () {
          TH.click('[type=submit]');
          refute.called(UserAccount.resetPassword);
          TH.input('[name=newPassword]', 'secret');
          TH.input('[name=confirm]', 'secret');
        });
        TH.click('[type=submit]');
      });

      assert.calledWith(UserAccount.resetPassword, v.key, 'secret', TH.match(function (callback) {
        v.callback = callback;
        return typeof callback === 'function';
      }));

      v.callback(null);

      assert.calledWith(Route.replacePath, Home);
    },

  });
});