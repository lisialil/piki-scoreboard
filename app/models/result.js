App.require('AppModel.Competitor', function (Competitor) {
  var model = AppModel.Base.defineSubclass('Result',{
    unscoredHeat: function () {
      return new AppModel.Heat(this.scores.length,
                          this.event.heats[this.category_id]);
    },
  },{saveRpc: true});


  model.defineFields({
    event_id: 'belongs_to',
    climber_id: 'belongs_to',
    category_id: 'belongs_to',
    time: 'number',
    scores: 'number',
  });

  model.remote({
    setScore: function (id, index, score) {
      check([id, score], [String]);
      check(index, Number);

      var user = AppModel.User.findOne(this.userId);
      var result = AppModel.Result.findOne(id);
      var event = result.event;

      AppVal.allowAccessIf(user.isSuperUser() || user.org_id === event.org_id);

      var heat = new AppModel.Heat(index, event.heats[result.category_id]);

      AppVal.allowAccessIf(index >=0 && index <= heat.format.length);


      var changes = {};

      changes['scores.' + index] = heat.scoreToNumber(score);

      model.docs.update(id, {$set: changes});
    },
  });

  Competitor.afterCreate(function (doc) {
    addResults(doc.category_ids || [], doc);
  });

  Competitor.afterUpdate(function (doc) {
    var added = _.difference(doc.changes.category_ids || [], doc.attributes.category_ids || []);

    addResults(added, doc);
    var removed = _.difference(doc.attributes.category_ids || [], doc.changes.category_ids || []);
    removeResults(removed, doc);
  });

  Competitor.afterRemove(function (doc) {
    removeResults(doc.category_ids || [], doc);
  });

  function addResults(ids, doc) {
    ids.forEach(function (catId) {
      var result = model.create({
        category_id: catId, event_id: doc.event_id,
        climber_id: doc.climber_id,
        scores: [Math.random()],
      });
    });
  }

  function removeResults(ids, doc) {
    ids.forEach(function (catId) {
      model.docs.remove({climber_id: doc.climber_id, category_id: catId, event_id: doc.event_id});
    });
  }

  App.loaded('AppModel.Result', model);
});