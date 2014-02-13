(function (test, v) {
  buster.testCase('models/result:', {
    setUp: function () {
      test = this;
      v = {};
      v.categories = TH.Factory.createList(3, 'createCategory');
      v.catIds = Apputil.mapField(v.categories);

      v.competitor = TH.Factory.buildCompetitor({category_ids: v.catIds});
      v.competitor.$$save();
    },

    tearDown: function () {
      v = null;
    },

    "Result.setScore": {
      setUp: function () {
        v.category = TH.Factory.createCategory({heatFormat: "F8F26QQ"});
        v.event = TH.Factory.createEvent({heats: [v.category._id]});
        v.result = TH.Factory.createResult({scores: [1]});
      },

      "test authorized": function () {
        if (Meteor.isClient) return assert(true);

        v.otherOrg = TH.Factory.createOrg();
        TH.loginAs(v.user = TH.Factory.createUser());

        assert.accessDenied(function () {
          TH.call("Result.setScore", v.result._id, 1, '23.5+');
        });
      },

      "test index out of range": function () {
        if (Meteor.isClient) return assert(true);

        assert.accessDenied(function () {
          TH.call("Result.setScore", v.result._id, -1, '23.5+');
        });

        assert.accessDenied(function () {
          TH.call("Result.setScore", v.result._id, 5, '23.5+');
        });
      },

      "test updates": function () {
        test.spy(Meteor.isServer ? global : window, 'check');

        TH.call("Result.setScore", v.result._id, 1, '23.5+');

        assert.calledWith(check, 1, Number);
        assert.calledWith(check, [v.result._id, '23.5+'], [String]);

        assert.equals(v.result.$reload().scores, [1, 235005]);
      },
    },

    "test unscoredHeat": function () {
      var category = TH.Factory.createCategory({heatFormat: "F8F26QQ"});
      var event = TH.Factory.createEvent({heats: [category._id]});
      var result = TH.Factory.createResult();

      assert.specificAttributesEqual(result.unscoredHeat(),
                                     {number: 1, name: 'Qualification 1'});

      result.scores.push(123);
      assert.specificAttributesEqual(result.unscoredHeat(),
                                     {number: 2, name: 'Qualification 2'});

      result.scores.push(223);
      assert.specificAttributesEqual(result.unscoredHeat(),
                                     {number: 3, name: 'Semi Final'});

      result.scores.push(223);
      assert.specificAttributesEqual(result.unscoredHeat(),
                                     {number: 4, name: 'Final'});

      result.scores.push(1);
      assert.equals(result.unscoredHeat().name, undefined);
    },

    "test associated": function () {
      var result = TH.Factory.createResult();

      assert(result.climber);
      assert(result.category);
      assert(result.event);
    },

    "test created when competitor registered": function () {
      assert(v.r2 = AppModel.Result.findOne({category_id: v.categories[0]._id}));
      v.result = AppModel.Result.findOne({category_id: v.categories[1]._id});
      assert(v.result);

      assert.same(v.result.event_id, v.competitor.event_id);
      assert.same(v.result.climber_id, v.competitor.climber_id);
      assert.between(v.result.scores[0], 0, 1);
      refute.same(v.r2.scores[0], v.result.scores[0]);
    },

    "test deleted when competitor cat removed": function () {
      v.competitor.category_ids = v.catIds.slice(1);
      v.competitor.$$save();

      assert.same(AppModel.Result.find({category_id: v.categories[0]._id}).count(), 0);
      assert.same(AppModel.Result.find({category_id: v.categories[1]._id}).count(), 1);
      assert.same(AppModel.Result.find({category_id: v.categories[2]._id}).count(), 1);
    },

    "test all deleted when competitor deregistered": function () {
      var climber = TH.Factory.createClimber();
      var comp2 = TH.Factory.buildCompetitor({event_id: v.competitor.event_id, category_id: v.competitor.category_id});
      comp2.$$save();


      v.competitor.$remove();

      assert.same(AppModel.Result.find().count(), 1);
    },
  });
})();