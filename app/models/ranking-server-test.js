define(function (require, _, module) {
  var test, v;
  const Val     = require('koru/model/validation');
  const util    = require('koru/util');
  const TH      = require('test-helper');
  const Ranking = require('./ranking');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
      v.rpc = TH.mockRpc();
      v.org = TH.Factory.createOrg();
      v.user = TH.Factory.createUser();
    },

    tearDown() {
      TH.clearDB();
      v = null;
    },

    "test results rpc"() {
      TH.loginAs(v.user);
      const climbers = TH.Factory.createList(3, 'createClimber', (index, options) => options._id = 'cl'+index);
      const cats = TH.Factory.createList(2, 'createCategory', (index, options) => options._id = 'cat'+index);
      const series = TH.Factory.createSeries();
      const ev1 = TH.Factory.createEvent({_id: 'ev1', series_id: series._id, heats: {[cats[0]._id]: 'LF4', [cats[1]._id]: 'BF6'}});
      const ev2 = TH.Factory.createEvent({_id: 'ev2', series_id: series._id, heats: {[cats[1]._id]: 'BF3'}});

      const evOther = TH.Factory.createEvent();
      [{
        scores: [0.4, 100], climber_id: climbers[0]._id,
      }, {
        scores: [0.1, 99], climber_id: climbers[2]._id,
      }, {
        scores: [0.6, 99], climber_id: climbers[1]._id,
      }].forEach(attrs => {
        const competitor_id = TH.Factory.createCompetitor({event_id: ev1._Id, climber_id: attrs.climber_id})._id;
        TH.Factory.createResult(util.extend(attrs, {competitor_id, event_id: ev1._id, category_id: cats[0]._id}));
      });

      [{
        scores: [0.4, 100], climber_id: climbers[1]._id,
      }, {
        scores: [0.1, 99], climber_id: climbers[0]._id,
      }, {
        scores: [0.6, 99], climber_id: climbers[2]._id,
      }].forEach(attrs => {
        const competitor_id = TH.Factory.createCompetitor({event_id: ev1._Id, climber_id: attrs.climber_id})._id;
        TH.Factory.createResult(util.extend(attrs, {competitor_id, event_id: ev1._id, category_id: cats[1]._id}));
      });

      [{
        scores: [0.4, 50], climber_id: climbers[1]._id,
      }, {
        scores: [0.6, 50], climber_id: climbers[2]._id,
      }].forEach(attrs => {
        const competitor_id = TH.Factory.createCompetitor({event_id: ev1._Id, climber_id: attrs.climber_id})._id;
        TH.Factory.createResult(util.extend(attrs, {competitor_id, event_id: ev2._id, category_id: cats[1]._id}));
      });
      test.spy(Val, 'ensureString');

      let ans = v.rpc('Ranking.seriesResult', series._id);

      assert.calledWith(Val.ensureString, series._id);
      assert.equals(ans, [{
        event_id: ev1._id,
        cats: cats.map((cat, index) => {
          return {
            category_id: cat._id,
            fmt: ev1.heats[cat._id],
            results: [[climbers[(0+index) % 3]._id, 100], [climbers[(2+index) % 3]._id, 72], [climbers[(1+index) % 3]._id, 72]]
          };
          }),
      }, {
        event_id: ev2._id,
        cats: [{
          category_id: cats[1]._id,
          fmt: ev2.heats[cats[1]._id],
          results: [[climbers[1]._id, 90], [climbers[2]._id, 90]]
        }],
      }]);
    },

    "test teamResults rpc"() {
      TH.loginAs(v.user);
      const tt1 = TH.Factory.createTeamType({_id: 'tt1'});
      const teams1 = TH.Factory.createList(2, 'createTeam', (index, options) => options._id = 'tm1'+index);
      const tt2 = TH.Factory.createTeamType({_id: 'tt2'});
      const teams2 = TH.Factory.createList(2, 'createTeam', (index, options) => options._id = 'tm2'+index);

      const climbers = TH.Factory.createList(3, 'createClimber', (index, options) => options._id = 'cl'+index);
      const cats = TH.Factory.createList(2, 'createCategory', (index, options) => options._id = 'cat'+index);
      const series = TH.Factory.createSeries();
      const ev1 = TH.Factory.createEvent({_id: 'ev1', series_id: series._id, heats: {[cats[0]._id]: 'LF4', [cats[1]._id]: 'BF6'}});
      const ev2 = TH.Factory.createEvent({_id: 'ev2', series_id: series._id, heats: {[cats[1]._id]: 'BF3'}});

      let cpidx = 0;

      const evOther = TH.Factory.createEvent();
      let team_ids;
      team_ids = [['tm10', 'tm20'], ['tm11'], ['tm10']];
      [{
        scores: [0.4, 100], climber_id: climbers[0]._id,
      }, {
        scores: [0.1, 99], climber_id: climbers[2]._id,
      }, {
        scores: [0.6, 99], climber_id: climbers[1]._id,
      }].forEach((attrs, index) => {
        const competitor_id = TH.Factory.createCompetitor({_id: 'cp'+ ++cpidx, event_id: ev1._id, climber_id: attrs.climber_id,
                                                           team_ids: team_ids[index]})._id;
        TH.Factory.createResult(util.extend(attrs, {competitor_id, event_id: ev1._id, category_id: cats[0]._id}));
      });

      [{
        scores: [0.4, 100], climber_id: climbers[1]._id,
      }, {
        scores: [0.1, 99], climber_id: climbers[0]._id,
      }, {
        scores: [0.6, 99], climber_id: climbers[2]._id,
      }].forEach((attrs, index) => {
        const competitor_id = TH.Factory.createCompetitor({_id: 'cp'+ ++cpidx, event_id: ev1._id, climber_id: attrs.climber_id,
                                                           team_ids: team_ids[index]})._id;
        TH.Factory.createResult(util.extend(attrs, {competitor_id, event_id: ev1._id, category_id: cats[1]._id}));
      });

      team_ids = [['tm11'], ['tm10', 'tm21']];
      [{
        scores: [0.4, 50], climber_id: climbers[1]._id,
      }, {
        scores: [0.6, 50], climber_id: climbers[2]._id,
      }].forEach((attrs, index) => {
        const competitor_id = TH.Factory.createCompetitor({_id: 'cp'+ ++cpidx, event_id: ev2._id, climber_id: attrs.climber_id,
                                                           team_ids: team_ids[index]})._id;
        TH.Factory.createResult(util.extend(attrs, {competitor_id, event_id: ev2._id, category_id: cats[1]._id}));
      });

      test.spy(Val, 'ensureString');

      let ans = v.rpc('Ranking.teamResults', series._id);

      assert.calledWith(Val.ensureString, series._id);
      assert.equals(ans, [{
        event_id: ev1._id,
        scores: {tt1: {tm10: 344, tm11: 144}, tt2: {tm20: 200}},
      }, {
        event_id: ev2._id,
        scores: {tt1: {tm11: 90, tm10: 90}, tt2: {tm21: 90}},
      }]);
    },


  });
});