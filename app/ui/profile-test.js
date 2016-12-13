isClient && define(function (require, exports, module) {
  var test, v;
  const Dom         = require('koru/dom');
  const session     = require('koru/session');
  const Route       = require('koru/ui/route');
  const UserAccount = require('koru/user-account');
  const ClientLogin = require('koru/user-account/client-login');
  const Event       = require('ui/event');
  const Profile     = require('./profile');
  const TH          = require('./test-helper');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      v.su = TH.Factory.createUser('su');
      TH.setOrg();
    },

    tearDown: function () {
      TH.tearDown();
      v = null;
    },

    "with user": {
      setUp: function () {
        TH.loginAs(v.user = TH.Factory.createUser());

        Route.gotoPage(Profile);
      },

      "test signOut me": function () {
        test.stub(UserAccount, 'logout');

        TH.click('[name=signOut]');

        assert.called(UserAccount.logout);
        test.stub(Route, 'replacePage');

        ClientLogin.wait(session, 'wait');
        refute.called(Route.replacePage);
        ClientLogin.ready(session, 'ready');
        assert.calledWith(Route.replacePage, Event.Index);
      },

      "test signOut other clients": function () {
        test.stub(UserAccount, 'logoutOtherClients');

        TH.click('[name=signOutOthers]');

        assert.dom('#SignOutOthers>p', 'Signing you out of any other sessions...');

        assert.called(UserAccount.logoutOtherClients);

        UserAccount.logoutOtherClients.yield('error');

        assert.dom('#SignOutOthers>p', 'Unexpected error.');

        UserAccount.logoutOtherClients.yield();

        assert.dom('#SignOutOthers', function () {
          assert.dom('>p', 'You have been signed out of any other sessions.');
          TH.click('[name=close]');
        });

        refute.dom('#SignOutOthers');
      },


      "test rendering": function () {
        assert.dom('#Profile', function () {
          assert.dom('h1', v.user.name);
        });
      },

      "test change password": function () {
        var cpwStub = test.stub(UserAccount,'changePassword');

        TH.click('.link', "Change password");
        assert.dom('#Profile .body #ChangePassword', function () {
          TH.input('input[name=oldPassword]', 'oldpw');
          assert.dom('button[type=submit][disabled=disabled]');
          TH.input('input[name=newPassword]', 'newpw');
          TH.input('input[name=confirm]', 'newp');
          assert.dom('button[type=submit][disabled=disabled]');
          TH.input('input[name=confirm]', 'newpw');
          refute.dom('button[type=submit][disabled=disabled]');
          TH.click('button[type=submit]');

          assert.className(this, 'submitting');

          assert.calledWith(cpwStub,v.user.email, 'oldpw', 'newpw', TH.match(function (func) {
            v.func = func;
            return typeof func === 'function';
          }));

          test.stub(Route.history, 'back');

          v.func('fail');

          assert.dom('.errorMsg', 'invalid password.');

          refute.called(Route.history.back);

          v.func();
        });
        assert.called(Route.history.back);
      },
    },

    "test super user has system-setup link": function () {
      TH.loginAs(v.su);

      Route.gotoPage(Profile);

      assert.dom('#Profile>div>nav', function () {
        TH.click('button.link', "System setup");
      });

      assert.dom('#SystemSetup');
    },
  });
});
