(function (test, v) {
  var orgChildren = ['Club', 'Climber', 'Event', 'Category'];

  buster.testCase('server/publish-org:', {
    setUp: function () {
      test = this;

      TH.stubOplog();
      v = {};
      v.org = TH.Factory.createOrg();
      v.user = TH.Factory.createUser('su');
      v.otherUser = TH.Factory.createUser();

      v.cm = {};
      orgChildren.forEach(function (modelName) {
        v.cm[modelName] = TH.Factory['create' + modelName]();
      });

      v.sub = TH.subStub(v.user._id);
      v.pub = TH.getPublish('Org');
      v.tsub = TH.subStub(v.user._id, v.sub);

      TH.loginAs(v.user);
    },

    tearDown: function () {
      v.sub.stopFunc && v.sub.stopFunc();
      v = null;
    },

    "test not subscribed": function () {
      assert.accessDenied(function () {
        v.pub.call(v.tsub);
      });
    },


    "with Session": {
      setUp: function () {
        v.sess = new Session(v.sub);
        test.spy(v.sess, 'addObserver');
        test.spy(v.sess, 'removeObserver');
        v.sub.aSpy.reset();
      },

      "test observes org": function () {
        var spyUsers = test.spy(AppModel.User, 'observeOrg_id');

        var spys = orgChildren.map(function (modelName) {
          return test.spy(AppModel[modelName], 'observeOrg_id');
        });

        test.spy(global, 'check');

        v.pub.call(v.tsub, v.org.shortName);

        assert.calledWith(check, v.org.shortName, String);

        assert.calledWith(spyUsers, v.org._id);
        spys.forEach(function (spy) {
          assert.calledWith(spy, v.org._id);
        });
        var usersStopHandle = spyUsers.returnValues[0];
        assert.called(v.sess.addObserver, 'OrgUsers', usersStopHandle);

        assert.called(v.tsub.ready);
        assert(v.tsub.stopFunc);

        assert.calledWith(v.sub.aSpy, 'User', v.otherUser._id);
        refute.calledWith(v.sub.aSpy, 'User', v.user._id);

        orgChildren.forEach(function (modelName) {
          assert.calledWith(v.sub.aSpy, modelName, v.cm[modelName]._id);
        });

        test.spy(usersStopHandle, 'stop');

        v.tsub.stopFunc();

        assert.called(usersStopHandle.stop);

        assert.calledWith(v.sub.rSpy, 'User', v.otherUser._id);
        refute.calledWith(v.sub.rSpy, 'User', v.user._id);

        orgChildren.forEach(function (modelName) {
          assert.calledWith(v.sub.rSpy, modelName, v.cm[modelName]._id);
        });
      },
    },
  });
})();
