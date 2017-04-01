define(function (require, exports, module) {
  var test, v;
  const util = require('koru/util');
  const TH   = require('test-helper');
  const Heat = require('./heat');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
    },

    tearDown() {
      v = null;
    },

    "test type"() {
      var heat = new Heat(1, 'LQQF26F26F8');

      assert.same(heat.type, 'L');
    },

    "test rankIndex"() {
      var heat = new Heat(1, 'LQ:8QF26F26F8');
      assert.same(heat.rankIndex, 2);

      var heat = new Heat(1, 'LQQQF8');
      assert.same(heat.rankIndex, 3);
    },

    "test isFinalRound"() {
      var heat = new Heat(1, 'LQQF26F26F8');
      assert.isFalse(heat.isFinalRound());

      heat.number = 5;
      assert.isTrue(heat.isFinalRound());
    },

    "problem count": {
      setUp() {
        v.assert = function (heatNum, expect) {
          v.heat = new Heat(heatNum, v.format);
          assert.same(v.heat.problems, expect);
        };
      },

      "test mixed count"() {
        v.format = 'BQQ:3QF26F26:2F8';

        v.assert(1, 5);
        v.assert(2, 3);
        v.assert(3, 3);
        v.assert(4, 4);
        v.assert(5, 2);
        v.assert(6, 2);
      },

      "test defaults"() {
        v.format = 'BQF';

        v.assert(1, 5);
        v.assert(2, 4);
      },

      "test all set"() {
        v.format = 'BQ:8F6:3';

        v.assert(1, 8);
        v.assert(2, 3);
      },
    },

    "test name"() {
      var heat = new Heat(-1, 'LQQF26F26F8');

      assert.same(heat.name, 'General');

      heat.number = 0;
      assert.same(heat.name, 'Start order');

      heat.number = 1;
      assert.same(heat.name, 'Qual 1');

      heat.number = 2;
      assert.same(heat.name, 'Qual 2');

      heat.number = -2;
      assert.same(heat.name, 'Qual points');

      heat.number = 3;
      assert.same(heat.name, 'Quarter final');

      heat.number = 4;
      assert.same(heat.name, 'Semi final');

      heat.number = 5;
      assert.same(heat.name, 'Final');
    },

    "test lead scoreToNumber"() {
      var heat = new Heat(1, 'LQQF26F26F8');

      assert.same(heat.scoreToNumber(' 23.5+'   ),  235005);
      assert.same(heat.scoreToNumber('123.012+' ), 1230125);
      assert.same(heat.scoreToNumber('10 '      ),  100000);
      assert.same(heat.scoreToNumber('top'      ), 9999999);
      assert.same(heat.scoreToNumber(' ter '    ), 9999999);
      assert.same(heat.scoreToNumber(' dnc '    ),      -1);
      assert.same(heat.scoreToNumber(' 4:33 '   ),   false);
      assert.same(heat.scoreToNumber(' 4:33 ',99),     273);
      assert.same(heat.scoreToNumber(' 1:09 ',99),      69);
    },

    "test lead numberToScore"() {
      var heat = new Heat(1, 'LQQF26F26F8');

      assert.same(heat.numberToScore( 235005   ),  '23.5+');
      assert.same(heat.numberToScore(1230125   ), '123.012+');
      assert.same(heat.numberToScore( 100000   ),  '10');
      assert.same(heat.numberToScore(9999999   ), 'Top');
      assert.same(heat.numberToScore(     -1   ), 'DNC');
      assert.same(heat.numberToScore(          ), '');
      assert.same(heat.numberToScore(1, 0      ), 1);
      assert.same(heat.numberToScore(1.535, -2 ), 1.54);
    },

    "test boulder scoreToNumber"() {
      var heat = new Heat(1, 'BFF');

      assert.same(heat.scoreToNumber(' 3t3 4b6 ' ), 3960493);
      assert.same(heat.scoreToNumber(' 0'        ),       0);
      assert.same(heat.scoreToNumber(' 0t 0b '   ),  990099);
      assert.same(heat.scoreToNumber(' 0t 4b20'  ),  990479);
      assert.same(heat.scoreToNumber(' 2t20 5b99'), 2790500);
      assert.same(heat.scoreToNumber(' dnc '     ),      -1);
    },

    "test boulder numberToScore"() {
      var heat = new Heat(1, 'BFF');

      assert.same(heat.numberToScore(3960493   ), '3t3 4b6');
      assert.same(heat.numberToScore(0         ), '0t 0b');
      assert.same(heat.numberToScore( 990479   ), '0t 4b20');
      assert.same(heat.numberToScore(2790500   ), '2t20 5b99');
      assert.same(heat.numberToScore(     -1   ), 'DNC');
      assert.same(heat.numberToScore(          ), '');
      assert.same(heat.numberToScore(1, 0      ), 1);
      assert.same(heat.numberToScore(1.535, -2 ), 1.54);
    },

    "sortByStartOrder": {
      setUp() {
        v.call = function (number, results) {
          v.heat = new Heat(number, 'LQQF26F8');

          return v.heat.sortByStartOrder(results);
        };
      },

      "test final tie"() {
        v.heat = new Heat(3, 'LQF8F2');
        var results = [v.r1 = {scores: [0.21, 300, 300]}, v.r2 = {scores: [0.42, 400, 300]}, v.r3 = {scores: [0.33, 300, 300]}, v.r4 = {scores: [0.14, 50, 300, 500]}];

        var r2 = v.heat.sortByStartOrder(results.slice(0));

        assert.same(r2.length, 3);
        assert.equals(r2, [v.r1, v.r3, v.r2]);

        v.r1.scores[0] = 0.22;

        r2 = v.heat.sortByStartOrder(results.slice(0));

        assert.equals(r2, [v.r3, v.r1, v.r2]);
      },

      "test final no tie"() {
        v.heat = new Heat(3, 'LQF8F2');
        var results = [v.r1 = {scores: [0.2, 400, 300]}, v.r2 = {scores: [0.4, 400, 100]}, v.r3 = {scores: [0.3, 300, 300]}, v.r4 = {scores: [0.1, 50, 300, 500]}];

        results = v.heat.sortByStartOrder(results);

        assert.same(results.length, 2);
        assert.equals(results, [v.r3, v.r1]);

      },

      "test nulls in scores"() {
        v.heat = new Heat(3, 'LQQF2');
        var results = [v.r0 = {scores: [0.53, 340000, 430000]},
                       v.r1 = {scores: [0.98,  30000, 320000, null]},
                       v.r2 = {scores: [0.52, 340000, 100000, null]},
                       v.r3 = {scores: [0.68, 340000, 100000, null]}];

        results = v.heat.sortByStartOrder(results);

        assert.same(results.length, 3);
        assert.equals(results, [v.r3, v.r2, v.r0]);
      },

      "test odd"() {
        var results = [v.r1 = {scores: [0.2]}, v.r2 = {scores: [0.4]}, v.r3 = {scores: [0.3]}];
        assert.equals(v.call(1, results), [v.r2, v.r3, v.r1]);

        assert.equals(v.call(2, results), [v.r1, v.r2, v.r3]);
      },

      "test even"() {
        var results = [v.r1 = {scores: [0.2]}, v.r2 = {scores: [0.4]}];
        assert.equals(v.call(1, results), [v.r2, v.r1]);

        assert.equals(v.call(2, results), [v.r1, v.r2]);
      },
    },

    "sort": {
      setUp() {
        v.call = function (number, results) {
          v.heat = new Heat(number, 'LQQF26F8');

          return v.heat.sort(results);
        };
      },

      "test empty"() {
        assert.equals(v.call(-1, []), []);
      },



      "test final"() {
        var results = [v.r1 = {time: 30, scores: [0.2, 200, 300, 400, 300]},
                       v.r2 = {time: 123, scores: [0.3, 100, 300, 400, 400]},
                       v.r3 = {time: 100, scores: [0.3, 100, 300, 400, 400]}];

        assert.equals(v.call(4, results), [v.r3, v.r2, v.r1]);
        assert.same(v.r3.sPoints, 100);
        assert.same(v.r2.sPoints, 80);
        assert.same(v.r1.sPoints, 65);

        v.r3.time = 200;

        assert.equals(v.call(4, results), [v.r2, v.r3, v.r1]);
        assert.same(v.r2.sPoints, 100);
        assert.same(v.r3.sPoints, 80);
        assert.same(v.r1.sPoints, 65);
      },

      "test General Result"() {
        var results = [v.r1 = {scores: [0.2]}, v.r2 = {scores: [0.4]}];
        assert.equals(v.call(-1, results), [v.r2, v.r1]);

        var results = [v.r1 = {scores: [0.2, 100]}, v.r2 = {scores: [0.4]}];
        assert.equals(v.call(-1, results), [v.r1, v.r2]);

        var results = [v.r1 = {scores: [0.2, 100]}, v.r2 = {scores: [0.1, 200]}];
        assert.equals(v.call(-1, results), [v.r2, v.r1]);


        var results = [v.r1 = {scores: [0.2, 200, 300]}, v.r2 = {scores: [0.3, 100, 300]}, v.r3 = {scores: [0.1, 50, 400]}];
        assert.equals(v.call(-1, results), [v.r1, v.r3, v.r2]);
      },

      "test points with time split"() {
        var results = [
          v.r1 = {time: 30, scores: [0.2, 100]},
          v.r2 = {time: 123, scores: [0.3, 100]},
        ];

        assert.equals(new Heat(-1, 'LF4').sort(results), [v.r1, v.r2]);
        assert.same(v.r1.sPoints, 100);
        assert.same(v.r2.sPoints, 80);
      },

      "Ranking general result": {
        setUp() {
          v.results =[v.r1 = {scores: v.s1 = [0.2]},
                      v.r2 = {scores: v.s2 = [0.4]},
                      v.r3 = {scores: v.s3 = [0.3]},
                     ];
          v.run = function () {
            return v.call(-1, v.results);
          };
        },

        "test no scores"() {
          v.run();

          assert.same(v.r1.rank1, 2);

          assert.same(v.r1.rankMult, 4);
          assert.same(v.r2.rankMult, 4);
        },

        "test diff length"() {
          v.s1.push(null);
          v.run();

          assert.same(v.r1.rankMult, 4);
        },

        "test semis 2 null"() {
          v.s1.push(500, 10, 999);
          v.s2.push(500, 10, null);
          v.s3.push(500, 10);

          assert.equals(v.run(), [v.r1, v.r3, v.r2]);
        },

        "test semis 3 null"() {
          v.s1.push(500, 10, 999);
          v.s2.push(500, 10);
          v.s3.push(500, 10, null);

          assert.equals(v.run(), [v.r1, v.r3, v.r2]);
        },

        "test quals"() {
          v.s1.push(500, 300);
          v.s2.push(500, 30);
          v.s3.push(50, 400);

          v.run();

          assert.same(v.r1.rank1, 1.5);
          assert.same(v.r2.rank1, 1.5);
          assert.same(v.r3.rank1, 3);

          assert.same(v.r1.rank2, 2);
          assert.same(v.r2.rank2, 3);
          assert.same(v.r3.rank2, 1);

          assert.same(v.r1.rankMult, 3);
          assert.same(v.r2.rankMult, 4.5);
          assert.same(v.r3.rankMult, 3);
        },

        "test finals split by time"() {
          v.s1.push(500, 300, 200);
          v.s2.push(500, 300, 200);
          v.s3.push(500, 300, 200);

          let ans = v.run();
          assert.equals(ans, [v.r1, v.r3, v.r2]);
          assert.same(v.r1.sPoints, 81);
          assert.same(v.r2.sPoints, 81);


          v.r1.time = 123;
          v.r2.time = 122;
          v.r3.time = 224;

          ans = v.run();
          assert.equals(ans, [v.r2, v.r1, v.r3]);
          assert.same(v.r1.sPoints, 80);
          assert.same(v.r2.sPoints, 100);
          assert.same(v.r3.sPoints, 65);

          v.r1.time = 123;
          v.r2.time = 124;
          v.r3.time = 24;

          ans = v.run();
          assert.equals(ans, [v.r3, v.r1, v.r2]);
          assert.same(v.r1.sPoints, 80);
          assert.same(v.r2.sPoints, 65);
          assert.same(v.r3.sPoints, 100);
        },


        "test sPoints noScores"() {
          v.run();

          assert.same(v.r2.sPoints, null);
          assert.same(v.r3.sPoints, null);
          assert.same(v.r1.sPoints, null);
        },

        "test sPoints three scores"() {
          v.results =[v.r1 = {scores: v.s1 = [0.2, 200]},
                      v.r2 = {scores: v.s2 = [0.4, 400]},
                      v.r3 = {scores: v.s3 = [0.3, 300]},
                     ];
          v.run();

          assert.same(v.r2.sPoints, 100);
          assert.same(v.r3.sPoints, 80);
          assert.same(v.r1.sPoints, 65);

          v.r3.scores = util.shallowCopy(v.r1.scores);
          v.run();

          assert.same(v.r3.sPoints, 72);
          assert.same(v.r3.sPoints, 72);
        },

        "test sPoints more than 30"() {
          v.results = [];
          for (let i = 0; i < 31; ++i) {
            v.results.push(v['r'+i] = {scores: [0.1, -100*i]});
          }

          v.run();

          for (let i = 0; i < 30; ++i) {
            assert.same(v['r'+i].sPoints, Heat.pointsTable[i]);
          }
          assert.same(v.r30.sPoints, 0);
        },
      },

      "test sorting methods"() {
        var results = [v.r1 = {scores: [0.2, 500, 300]}, v.r2 = {scores: [0.3, 500, 30]}, v.r3 = {scores: [0.1, 50, 400]}];

        assert.equals(v.call(2, results), [v.r3, v.r1, v.r2]);

        assert.equals(v.call(1, results), [v.r1, v.r2, v.r3]);

        assert.equals(v.call(0, results), [v.r2, v.r1, v.r3]);

      },
    },

    "qual only": {
      setUp() {
        v.call = number => {
          v.heat = new Heat(number, v.format || 'LQQQ');

          v.results = [];

          v.heat.headers((number, name) => {
            v.results.push({number: number, name: name});
          });

          return v.results;
        };
      },

      "test last qual result"() {
        assert.equals(v.call(3), [
          {number: 3, name: 'Result'},
        ]);
      },

      "test genral results"() {
        assert.equals(v.call(-1), [
          {number: -2, name: 'Rank'},
          {number: -2, name: 'Qual points'},
          {number: 3, name: 'Qual 3'},
          {number: 2, name: 'Qual 2'},
          {number: 1, name: 'Qual 1'},
        ]);

        const results = [v.r1 = {scores: [0.2, 200, 300, 400, 300]},
                         v.r2 = {scores: [0.3, 100, 300, 400, 400]},
                         v.r3 = {scores: [0.4, 100, 300, 600, 400]}];

        v.heat.sort(results);

        assert.equals(results, [
          {scores: [0.2, 200, 300, 400, 300], rankMult: 5,
           rank3: 2.5, rank2: 2, rank1: 1, sPoints: 90},
          {scores: [0.4, 100, 300, 600, 400], rankMult: 5,
           rank3: 1, rank2: 2, rank1: 2.5, sPoints: 90},
          {scores: [0.3, 100, 300, 400, 400], rankMult: 12.5,
           rank3: 2.5, rank2: 2, rank1: 2.5, sPoints: 65}]);
      },

    },

    "headers": {
      setUp() {
        v.call = number => {
          v.heat = new Heat(number, v.format || 'LQQF26F8');

          v.results = [];

          v.heat.headers((number, name) => {
            v.results.push({number: number, name: name});
          });

          return v.results;
        };
      },

      "test General"() {
        assert.equals(v.call(-1), [
          {number: -2, name: 'Rank'},
          {number: 4, name: 'Final'},
          {number: 3, name: 'Semi final'},
          {number: -2, name: 'Qual points'},
          {number: 2, name: 'Qual 2'},
          {number: 1, name: 'Qual 1'},
        ]);
      },

      "test Final boulder"() {
        v.format = "BQF6";

        assert.equals(v.call(2), [
          {number: 2, name: 'Result'},
          {number: 2, name: 'Sum'},
          {number: -2, name: 'Previous heat'},
        ]);
      },

      "test Final"() {
        assert.equals(v.call(4), [
          {number: 99, name: 'Time taken'},
          {number: 4, name: 'Result'},
          {number: 3, name: 'Previous heat'},
        ]);
      },

      "test Semi Final"() {
        assert.equals(v.call(3), [
          {number: 3, name: 'Result'},
          {number: -2, name: 'Previous heat'},
        ]);
      },

      "test Qual"() {
        assert.equals(v.call(2), [
          {number: 2, name: 'Result'},
        ]);

        assert.equals(v.call(1), [
          {number: 1, name: 'Result'},
        ]);
      },

      "test Start order"() {
        assert.equals(v.call(0), [
          {number: 0, name: 'Start order'},
        ]);
      },
    },

    "test points table"() {
      assert.equals(Heat.pointsTable,[
        100, 80, 65, 55, 51, 47, 43, 40, 37, 34,
        31,  28, 26, 24, 22, 20, 18, 16, 14, 12,
        10,  9,  8,  7,  6,  5,  4,  3,  2,  1,
      ]);
      assert.same(Heat.pointsTable.length, 30);
    },
  });
});
