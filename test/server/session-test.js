(function (test, v) {
  buster.testCase('server/session:', {
    setUp: function () {
      test = this;

      TH.stubOplog();
      v = {
        org: TH.Factory.createOrg(),
        user: TH.Factory.createUser({_id: 'uid1'}),
        sub: TH.subStub('uid1'),
        pub: TH.getPublish('Session'),
        userSpy: test.spy(AppModel.User, 'observeId'),
      };
    },

    tearDown: function () {
      AppOplog.stopAllObservers();
      v = null;
    },

    "test guest user": function () {
      v.sub.userId = null;

      v.pub.call(v.sub);
      var guestUser = AppModel.User.guestUser();
      assert.called(v.sub.aSpy, 'User', guestUser._id, guestUser.attributes);
    },

    "test init and stop": function () {
      assert.same(v.pub.call(v.sub), undefined);

      assert.called(v.sub.ready);

      var sess = Session.get(v.sub);

      assert('onOrgChange' in sess);
      assert('notifyOrgChange' in sess);

      assert.calledOnceWith(v.userSpy, v.user._id);
      assert.calledWith(v.sub.aSpy, 'User', v.user._id, v.user.attributes);
      assert.attributesEqual(sess.user, v.user);

      assert.same(sess.user.attributes, AppModel.User.memFind('uid1'));

      v.sub.stopFunc();
      assert.equals(AppOplog.observers(),{});

      refute(AppModel.User.memFind('uid1'));
    },

    "with Session": {
      setUp: function () {
        v.pub.call(v.sub);

        v.sess = Session.get(v.sub);
      },

      "test memFind": function () {
        assert.same(v.sess.userId, v.user._id);
        assert.equals(AppModel.Org.memFind(v.org._id), v.org.attributes);
      },

      "test accessDenied": function () {
        v.sub.stopFunc();
        assert.accessDenied(function () {
          Session.get(v.sub);
        });
      },
    },
  });
})();
