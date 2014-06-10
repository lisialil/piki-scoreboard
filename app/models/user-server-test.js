define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var User = require('./user');
  var env = require('koru/env');
  var session = require('koru/session');
  var UserAccount = require('koru/user-account');
  var Val = require('koru/model/validation');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      test.stub(env, 'info');
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    "test guestUser": function () {
      var guest = User.guestUser();
      assert.equals(guest._id, 'guest');
      assert.equals(guest.role, 'g');

      assert.equals(guest.attributes, User.guestUser().attributes);
    },

    "test authorize": function () {
      var subject = TH.Factory.createUser();
      var user = TH.Factory.createUser('su');

      refute.accessDenied(function () {
        subject.authorize(user._id);
      });

      user = TH.Factory.createUser({role: 'j'});

      assert.accessDenied(function () {
        subject.authorize(user._id);
      });
    },

    "test admin deleting superuser": function () {
      var org = TH.Factory.createOrg();
      var subject = TH.Factory.createUser({org_id: org._id, role: User.ROLE.admin});
      var user = TH.Factory.createUser('su', {org_id: org._id});

      assert.accessDenied(function () {
        user.authorize(subject._id);
      });
    },

    "test createUser": function () {
      test.stub(UserAccount, 'sendResetPasswordEmail');
      TH.loginAs(TH.Factory.createUser('su'));
      var user = TH.Factory.buildUser();
      user.$$save();

      var mUser = UserAccount.model.findByField('userId', user._id);

      assert(mUser);

      assert.equals(mUser.email, user.email);

      assert.calledWith(UserAccount.sendResetPasswordEmail, user._id);
    },

    "test change email": function () {
      TH.Factory.createUser('su');
      TH.login();

      var rpc = TH.mockRpc("1");
      rpc('save', 'User', TH.userId(), {email: "foo@bar.com"});

      var user = User.findById(TH.userId());

      assert.same(user.email, "foo@bar.com");
    },

    "forgotPassword": {
      setUp: function () {
        test.stub(Val, 'ensureString');
        test.stub(UserAccount, 'sendResetPasswordEmail');
        v.rpc = TH.mockRpc();
      },

      "test missing email": function () {
        var res = v.rpc('User.forgotPassword', '  ');

        assert.equals(res, {email: 'is_required'});
        refute.called(UserAccount.sendResetPasswordEmail);
      },

      "test invalid email": function () {
        var res = v.rpc('User.forgotPassword', ' xyz ');

        assert.equals(res, {email: 'is_invalid'});
        refute.called(UserAccount.sendResetPasswordEmail);
      },

      "test user without meteor account": function () {
        var user = TH.Factory.createUser({email: 'foo@bar.com'});
        var res = v.rpc('User.forgotPassword', 'foo@bar.com  ');

        assert.equals(res, {success: true});

        refute.calledWith(UserAccount.sendResetPasswordEmail);
      },

      "test success": function () {
        var user = TH.Factory.buildUser({email: 'foo@bar.com'});
        user.$save('force');
        var res = v.rpc('User.forgotPassword', 'foo@bar.com  ');

        assert.equals(res, {success: true});

        assert.calledWith(Val.ensureString, 'foo@bar.com  ');

        assert.calledWith(UserAccount.sendResetPasswordEmail, user._id);
      },
    }


  });
});