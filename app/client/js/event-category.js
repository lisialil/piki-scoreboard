App.require('Bart.Event', function (Event) {
  var $ = Bart.current;
  var Tpl = Bart.Event.Category;
  var HeatHeader = Tpl.HeatHeader;
  var Score = Tpl.Score;
  var BoulderScore = Tpl.BoulderScore;
  var InvalidInput = Tpl.InvalidInput.$render();
  var focusField;

  Event.route.addTemplate(Tpl, {
    focus: '#Category [name=selectHeat]',
    data: function (page,pageRoute) {
      if (! Event.event) AppRoute.abortPage();
      var showingResults = true;
      return {
        category: AppModel.Category.findOne(pageRoute.append),
        heat: new AppModel.Heat(-1,  Event.event.heats[pageRoute.append]),
        get selectHeat() {return this.heat.number},
        set selectHeat(value) {return this.heat.number = value},
        get showingResults() {return showingResults},
        set showingResults(value) {
          showingResults = value;
          if (showingResults)
            focusField = null;
          this.canInput = ! value && Bart.hasClass(document.body, 'jAccess');
          return value;
        },
        canInput: false,
      };
    }
  });

  Tpl.$helpers({
    classes: function () {
      return (this.showingResults ? "rank " : "start ") + this.heat.className();
    },
    modeSwitchLabel: function () {
      return this.showingResults ? "Show start order" : "Show results";
    },
    mode: function () {
      return this.showingResults ? "Results" : "Start order";
    },
    heats: function () {
      return this.heat.list();
    },
    headers: function () {
      var frag = document.createDocumentFragment();
      this.heat.headers(function (number, name) {
        frag.appendChild(HeatHeader.$render({heat: number, name: name}));
      });
      return frag;
    },

    results: function () {
      var frag = document.createDocumentFragment();

      var results = AppModel.Result.eventCatIndex.fetch({
        event_id: Event.event._id, category_id: $.data().category._id,
      });

      var heat = this.heat;

      if (this.showingResults)
        heat.sort(results);
      else
        heat.sortByStartOrder(results);

      var prev, row, rank = 0;
      var compareResults = heat.compareResults();

      for(var i = 0; i < results.length; ++i, prev = row) {
        row = results[i];
        if (! prev || compareResults(prev, row) !== 0)
          rank = i + 1;
        row.rank = rank;
        frag.appendChild(Tpl.Result.$render(row));
      }
      return frag;
    },
  });

  Tpl.$extend({
    $created: function (ctx, elm) {
      Bart.autoUpdate(ctx, {
        subject: ctx.data.category,
        removed: function () {AppRoute.replacePath(Bart.Event)},
      });
      ctx.onDestroy(AppModel.Result.Index.observe(function (doc, old) {
        var result = doc || old;
        if (result.event_id !== Event.event._id ||
            result.category_id !== ctx.data.category._id)
          return;

        updateResults(ctx);
      }));
    },

    $destroyed: function (ctx, elm) {
      focusField = null;
    },
  });

  Tpl.$events({
    'click [name=toggleStartOrder]': function (event) {
      Bart.stopEvent();
      var data = $.data();
      data.showingResults = ! data.showingResults;
      updateResults($.ctx);
    },

    'change [name=selectHeat]': function (event) {
      Bart.stopEvent();

      setHeatNumber($.ctx, this.value);
    },

    'change td.score input': function (event) {
      if (! saveScore(event.target)) {
        Bart.stopEvent();
        event.target.focus();
        return;
      }
    },

    'focus td.score input': function (event) {
      setFocusField(this);
    },

    'keydown td.score input': function (event) {
      switch(event.which) {
      case 27:
        focusField = null;
        event.target.value = $.data(event.target).score;
        Bart.remove(this.parentNode.querySelector('.errorMsg'));
        document.activeElement.blur();
        break;

      case 13:
        Bart.stopEvent();
        if (saveScore(event.target)) {
          focusField = null;
          document.activeElement.blur();
        }
        break;
      case 9:
        var oldFocus = focusField;
        focusField = nextField(document.activeElement, event.shiftKey ? -1 : 1);
        if (! saveScore(event.target)) {
          focusField = oldFocus;
          return;
        }
        if (document.activeElement === event.target) {
          Bart.remove(this.parentNode.querySelector('.errorMsg'));
          return;
        }
        Bart.stopEvent();
        break;
      }
    },


    'mousedown td.score': function (event) {
      if (event.target === document.activeElement ||
          ! Bart.hasClass(document.body, 'jAccess'))
        return;

      Bart.stopEvent();

      var input = event.target.tagName === 'INPUT' ? event.target : event.target.querySelector('input') || this.querySelector('input');
      if (input) {
        input.focus();
        input.select();
        return;
      }

      var ctx = $.ctx;
      var data = ctx.data;

      var scoreData = $.data(this);
      var heat = scoreData.heat;
      if (heat < 1) return;


      input = document.activeElement;
      if (Bart.hasClass(input, 'score')) {
        if (! saveScore(input)) return;
      }

      if (data.showingResults) {
        data.showingResults = false;

        data.selectHeat = heat === 99 ? data.heat.total : heat;
      }

      updateResults(ctx);
    },
  });

  Tpl.Result.$extend({
    $created: function (ctx) {
      Bart.autoUpdate(ctx, {subject: ctx.data.climber});
    },
  });

  Tpl.Result.$helpers({
    scores: function () {
      var frag = document.createDocumentFragment();
      var parentCtx = Bart.getCtx($.element.parentNode);
      var result = parentCtx.data;
      var scores = result.scores;

      var heat = $.ctx.parentCtx.data.heat;

      var number = heat.number;
      var boulder = heat.type === 'B';
      var canInput = parentCtx.parentCtx.data.canInput;

      if (boulder && number >= 0) {
        renderBoulderScore(canInput);
      }

      canInput = canInput && ! boulder;

      if (heat.number <= heat.rankIndex) {

        if (heat.number >= 0) {
          renderScore(heat.number, canInput);

        } else {
          frag.appendChild(Score.$render({result: result, heat: -2, score: result.rank}));
          for(var i = heat.total; i > 0; --i) {
            if (heat.rankIndex === i)
              renderScore(i, null, -2);

            renderScore(i);
          }
        }
      } else {
        if (heat.type === 'L' && heat.isFinalRound())
          frag.appendChild(Score.$render({result: result, canInput: canInput, heat: 99,
                                          score: result.displayTimeTaken()}));
        renderScore(heat.number, canInput);
        renderScore(heat.number - 1, null, heat.rankIndex === heat.number - 1);
      }
      return frag;

      function renderScore(i, canInput, qr) {
        if (qr)
          var data = {result: result, heat: -2,
                      score: scores[i] == null ? '' : heat.numberToScore(Math.pow(result.rankMult, 1/i), -2)};
        else
          var data = {result: result, canInput: canInput, heat: i,
                      score: heat.numberToScore(scores[i], i),
                      rank: scores[i] == null ? '' : result['rank'+i]};

        frag.appendChild(Score.$render(data));
      }

      function renderBoulderScore(canInput) {
        frag.appendChild(BoulderScore.$render({result: result, heat: heat, canInput: canInput}));
      }
    },
  });

  Score.$helpers({
    rank: function () {
      if (! this.rank) return;
      var elm =  document.createElement('i');
      elm.textContent = this.rank;
      return elm;
    },

    score: function () {
      if (this.canInput) {
        var elm = document.createElement('input');
        elm.setAttribute('placeholder', this.heat === 99 ? "m:ss" : "n+");
        elm.tabIndex = this.heat;
        elm.className = 'score';
        if (this.score != null)
          elm.value = this.score.toString();
      } else {
        var elm = document.createElement('span');
        elm.textContent = this.score;
      }

      return elm;
    },

    heatClass: function () {
      Bart.addClass($.element, 'heat' + this.heat);
    },
  });

  BoulderScore.$helpers({
    problems: function () {
      var len = this.heat.problems;
      var problems = this.result.problems ? this.result.problems[this.heat.number - 1] || [] : [];
      var canInput = this.canInput;

      var frag = document.createDocumentFragment();
      for(var i = 0; i < len; ++i) {
        var prob = problems[i] || 0;
        var elm = document.createElement('div');
        if (prob > 0) elm.className = prob >= 100 ? 'top' : 'bonus';
        elm.appendChild(createAttempts('bonus', prob % 100, i, canInput));
        elm.appendChild(createAttempts('top', Math.floor(prob / 100), i, canInput));
        frag.appendChild(elm);
      }
      return frag;
    },
  });

  function createAttempts(name, attempts, number, canInput) {
    if (canInput) {
      var elm = document.createElement('input');
      elm.tabIndex = number+1;
      if (attempts)
        elm.value = attempts;
    } else {
      var elm = document.createElement('span');
      if (attempts) elm.textContent = attempts;
    }
    elm.className = name;
    return elm;
  }

  function setHeatNumber(ctx, value) {
    var data = ctx.data;
    data.heat.number = data.selectHeat =  +value;
    if (data.selectHeat === -1)
      data.showingResults = true;
    updateResults(ctx);
  }

  function updateResults(ctx) {
    if (focusField) {
      var input = document.querySelector('#' + focusField.id + ' td.score>input[tabIndex="'+focusField.tabIndex+'"].'+focusField.name);
      if (input === document.activeElement) {
        var start = input.selectionStart;
        var end = input.selectionEnd;
        var value = input.value;
      } else {
        input = null;
      }
    }

    ctx.updateAllTags();

    if (focusField) {
      var elm = document.querySelector('#' + focusField.id + ' td.score>input[tabIndex="'+focusField.tabIndex+'"].'+focusField.name);
      if (elm) {
        elm.focus();
        if (input) {
          elm.value = value;
          elm.setSelectionRange(start, end);
        } else {
          elm.select();
        }
        return;
      }
    }
    document.activeElement.blur();
  }

  function saveScore(elm) {
    var ctx = Bart.getCtx(elm);
    var heat = $.data(document.getElementById('Category')).heat;
    var data = ctx.data;
    if (elm.className === 'score') {
      var number = heat.scoreToNumber(elm.value, data.heat);

      if (number !== false) {
        data.result.setScore(data.heat, data.score = elm.value);
        return true;
      }
    } else {
      return true;
    }

    Bart.addClass(elm, 'error');
    elm.parentNode.insertBefore(InvalidInput, elm.nextSibling);
    return false;
  }

  function setFocusField(input) {
    focusField = {
      id: input.parentNode.parentNode.id,
      tabIndex: +input.getAttribute('tabIndex'),
      name: input.className,
    };
  };

  function nextField(elm, direction) {
    var tabIndex = +elm.getAttribute('tabIndex');

    var row = elm.parentNode.parentNode;

    row = direction > 0 ? row.nextElementSibling : row.previousElementSibling;

    if (!row) {
      elm = document.querySelector('.results tr:'+
                                   (direction > 0 ? 'first' : 'last')+'-child>td.score>input'+
                                   '[tabIndex="'+(tabIndex+direction)+'"]') ||
        document.querySelector('.results tr:'+
                               (direction > 0 ? 'first' : 'last')+'-child>td.score>input'+
                               ':not([tabIndex="'+tabIndex+'"])');

      if (! elm) return;

      tabIndex = +elm.getAttribute('tabIndex');

      row = elm.parentNode.parentNode;
    }

    if (row) return {id: row.id, tabIndex: tabIndex, name: elm.className};
  }
});
