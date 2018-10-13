define((require, exports, module)=>{
  const Dom             = require('koru/dom');
  const DocChange       = require('koru/model/doc-change');
  const AutoList        = require('koru/ui/auto-list');
  const Dialog          = require('koru/ui/dialog');
  const Route           = require('koru/ui/route');
  const util            = require('koru/util');
  const Event           = require('models/event');
  const Result          = require('models/result');
  const SpeedRound      = require('models/speed-round');
  const User            = require('models/user');
  const ClimberCell     = require('ui/climber-cell');
  const EventHelper     = require('ui/event-helper');

  const orig$ = Symbol();

  const {SPEED_FINAL_NAME} = EventHelper;

  const {endMarker$} = require('koru/symbols');
  const {myCtx} = Dom;

  const {laneA, laneB, ranking} = SpeedRound;

  const Tpl = Dom.newTemplate(module, require('koru/html!./speed-event'));
  const {ABList, ABRow, RankRow, QualResults, GeneralList, GeneralRow} = Tpl;
  const $ = Dom.current;

  const appendNextStage = (data, pn)=>{
    if (User.me().isAdmin()) {
      pn.appendChild(Dom.h(
        data.isClosed
          ? {class: 'reopen', div: {button: ['Reopen '+HEAT_NAME[data.heatNumber]], class: 'action'}}
        : {class: 'nextStage', div: {button: ['Next'], class: 'action'}}));
    }
  };

  const renderQuals = (data, pn, Template, Row, recalc)=>{
    const {round} = data;
    const table = Template.$autoRender(data, Dom.ctx(pn));

    const list = data.list = new AutoList({
      template: Row,
      container: table.lastElementChild,
      compare: round.entries.compare,
      query: {
        forEach: add =>{for (const res of round) add(res)}
      }
    });

    myCtx(table).onDestroy(round.onChange(dc =>{
      if (! dc.isChange) {
        recalc(dc);
        list.changeOptions({updateAllTags: true});
      } else {
        list.updateEntry(dc.doc);
        list.updateEntry(laneA(dc.doc));
      }
    }));

    pn.appendChild(table);
  };

  const renderFinals = (data, pn)=>{
    const table = ABList.$autoRender(data, Dom.ctx(pn));

    const ctx = myCtx(table);

    const {round} = data;

    const len = 1<<round.stage;

    const list = new AutoList({
      template: ABRow,
      container: table.lastElementChild,
      compare: SpeedRound.compareRanking,
      query: {
        forEach: add =>{for (const res of round) res && add(res)}
      }
    });

    ctx.onDestroy(round.onChange(dc =>{dc.isChange && list.updateEntry(laneA(dc.doc))}));

    pn.appendChild(table);
    data.showingResults || appendNextStage(data, pn);
  };

  const renderGeneralResults = (data, pn)=>{
    const event = Event.findById(data.event_id);
    data.heatFormat = event.heats[data.category._id];

    const table = GeneralList.$autoRender(data, Dom.ctx(pn));

    const ctx = myCtx(table);

    const {round} = data;

    const len = 1<<round.stage;

    round.rankResults();
    const list = new AutoList({
      template: GeneralRow,
      container: table.lastElementChild,
      compare: SpeedRound.compareRanking,
      query: {
        forEach: add =>{for (const res of round) add(res)}
      }
    });

    const redraw = ()=>{
      round.rankResults();
      ctx.updateAllTags();
      list.changeOptions({updateAllTags: true});
    };

    ctx.onDestroy(Event.observeId(data.event_id, ()=>{
      data.heatFormat = event.heats[data.category._id];
      ctx.updateAllTags();
      redraw();
    }));
    ctx.onDestroy(round.onChange(redraw));

    pn.appendChild(table);
  };

  const previousStage = (format, stage)=>{
    if (stage == 0) return;
    for(let i = format.length-1; i > 0; --i) {
      if (+format[i] === stage) {
        return +format[i-1] || 0;
      }
    }
    return 0;
  };

  Tpl.$extend({
    $created(ctx, elm) {
      const {data} = ctx;

      util.merge(data, {
        get selectHeat() {return this.heatNumber},
        set selectHeat(value) {return this.heatNumber = value},
      });

      const format = Event.findById(data.event_id).heats[data.category._id];
      const {showingResults} = data;
      const hasReRun = /R/.test(format);
      const heatNumber = hasReRun && data.heatNumber == 1 ? -2 : data.heatNumber;
      data.isClosed = heatNumber == 0
        ? format.length != 1
        : format.indexOf("C") !== -1 || format.indexOf(""+(heatNumber-1)) !== -1;

      const round = data.round = new SpeedRound({
        stage: heatNumber == -1 && hasReRun ? -2 : heatNumber,
        previous: previousStage(format, heatNumber),
        query: Result.query.withIndex(Result.eventCatIndex, {
          event_id: data.event_id, category_id: data.category._id})
      });

      if (heatNumber == 0 || heatNumber == -2) {
        if (showingResults) {
          round.rankResults();
          renderQuals(data, elm, QualResults, RankRow, ()=>{round.rankResults()});
        } else {
          round.calcStartList();
          renderQuals(data, elm, ABList, ABRow, dc =>{
            if (dc.isDelete)
              round.entries.delete(dc.doc);
            else if (dc.isAdd)
              round.entries.add(dc.doc);
            round.recalcQualsStartList();
          });
          appendNextStage(data, elm);
        }
      } else if (heatNumber == -1) {
        elm.classList.add('general');
        renderGeneralResults(data, elm);
      } else {
        if (showingResults)
          round.rankResults();
        else
          round.calcStartList();

        renderFinals(data, elm);
      }
    },
  });

  EventHelper.extendResultTemplate(Tpl);

  const calcSpeedFormat = ({stage}, fmt, nextStage)=>{
    let mx, mn;
    if (stage == 0) {
      if (nextStage == -2)
        return "SR";
      mx = nextStage;
      mn = mx;
      fmt.slice(2).split('').forEach(s => {
        const n = +s;
        if (n < mn) mn = n;
      });
    } else {
      const ps = nextStage == -3 ? stage : stage-1;
      mx = 0;
      mn = ps;
      fmt.slice(1).split('').forEach(s => {
        const n = +s;
        if (n == ps) return fmt;
        if (n > mx) mx = n;
        if (n < mn) mn = n;
      });
    }
    fmt = nextStage == -3 ? 'SC' : 'S';
    for(let i = mx; i >= mn ; --i) fmt += i;
    return fmt;
  };

  Tpl.$events({
    'click .reopen'(event) {
      Dom.stopEvent();

      const {data} = $.ctx;
      const {heatNumber} = data;
      Dialog.confirm({
        classes: 'warn',
        content: Dom.h([{
          div: `Are you sure you want to reopen "${HEAT_NAME[heatNumber]}" and later stages?`,
        }, {
          div: `If later stage results have been entered then they may be corrupted by changes here. BE CAREFUL.`,
        }]),
        okay: 'Yes',
        onConfirm: ()=>{
          const ev = Event.findById(data.event_id);
          let fmt = ev.heats[data.category._id].replace(/[C]/g, '');
          if (heatNumber == 0 || /R/.test(fmt))
            fmt = 'S';
          else if (heatNumber == 1) {
            fmt = fmt.replace(/^SC/, 'S');
          } else {
            const idx = fmt.indexOf(""+heatNumber);
            fmt = fmt.slice(0, idx+1);
          }
          ev.changes = {$partial: {heats: [data.category._id, fmt]}};
          ev.$$save();
          EventHelper.replacePage(data, data.showingResults, heatNumber);
        }
      });
    },
    'click .nextStage'(event) {
      Dom.stopEvent();

      Dom.remove(this.querySelector('.info'));

      const {data} = $.ctx;
      const {round} = $.ctx.data;

      const {isComplete, hasTies, nextStage} = round.complete();

      if (! isComplete) {
        this.appendChild(Dom.h({
          class: 'info',
          div: hasTies
            ? 'Ties need to be broken by extra runs in lane A' : 'All scores need to be entered'}));
      } else {
        Dialog.confirm({
          content: `Do you wish to proceed from the "${HEAT_NAME[data.heatNumber]
}" to the "${HEAT_NAME[nextStage]}"`,
          okay: 'Yes',
          onConfirm: ()=>{
            const ev = Event.findById(data.event_id);
            const fmt = ev.heats[data.category._id];
            ev.changes = {$partial: {
              heats: [data.category._id, calcSpeedFormat(round, fmt, nextStage)]}};
            ev.$$save();
            Route.gotoPage(Dom.Event.Category, {
              eventId: ev._id, append: data.category._id,
              search: `?type=${data.showingResults ? 'startlists' : 'results'}&heat=${
data.heatNumber}`});
          }
        });
      }
    },

    'keydown input'(event) {
      switch(event.which) {
      case 27:
        Dom.stopEvent();
        this.value = this[orig$];
        return;
      }
    },
  });

  const HEAT_NAME = {
    '-3': 'Results',
    '-2': 'Final',
    0: 'Qualifiers',
    1: 'Final',
    2: 'Semi final',
    3: 'Quater final',
    4: 'Round of 16',
  };

  const formatTime = (time, full=true)=> typeof time === 'number'
        ? (full ? util.toDp(time/1000,  3, true) : util.toDp(Math.floor(time/10)/100, 2, true))
        : (time === 'tie' ? '' : time || '');

  const timeToElm = (isInput, elm, disp)=>{
    if (isInput) {
      if (elm !== null && elm.nodeType === 1 && elm.tagName === 'INPUT') {
        elm[orig$] = elm.value = disp;
      } else {
        elm = Dom.h({required: 'required', input: [], value: disp});
        elm[orig$] = disp;
      }
    } else {
      if (elm !== null && elm.nodeType === document.TEXT_NODE)
        elm.textContent = disp;
      else
        elm = document.createTextNode(disp);
    }
    return elm;
  };


  const displayTime = (res, index, isStartlist=! $.ctx.parentCtx.data.showingResults)=>{
    const pn = $.element;
    if (res == null) {
      Dom.removeChildren(pn);
      return;
    }

    const {round, isClosed} = $.ctx.parentCtx.data;
    const time = round.getTime(res, index);

    const isInput = isStartlist && ! isClosed && res.event.canJudge();

    let elm = timeToElm(isInput, pn.firstChild, formatTime(time));
    if (elm !== pn.firstChild) {
      pn.firstChild !== null && pn.firstChild.remove();
      pn.insertBefore(elm, pn.firstChild);
    }

    elm = elm.nextSibling;

    if (index != 1 || round.stage > 0) {
      let attempt = 0;
      for (const score of round.attempts(res)) {
        let ae = timeToElm(isInput, elm, formatTime(score));
        if (ae.nodeType !== 1) {
          ae = Dom.h({span: ae});
        }
        ae.setAttribute('data-attempt', ++attempt);

        if (elm !== ae) {
          pn.insertBefore(ae, elm);
          elm !== null && elm.remove();
        }
        elm = ae.nextSibling;
      }
      while (elm !== null) {
        const ne = elm.nextSibling;
        elm.remove();
        elm = ne;
      }
    }
  };

  Tpl.$helpers({
    heats() {
      const event = Event.findById(this.event_id);
      const heatFormat = event.heats[this.category._id];
      const list = [[0, 'Quals']];
      for(let i = 1; i < heatFormat.length; ++i) {
        const code = heatFormat[i];
        list.push([code == 'R' ? 1 : +code, SPEED_FINAL_NAME[code]]);
      }
      list.push([-1, "General"]);
      return list;
    },

    heatName() {return this.heatNumber == -1 ? 'General' : HEAT_NAME[this.heatNumber]},
  });

  RankRow.$helpers({
    rank() {
      const {round} = $.ctx.parentCtx.data;
      return round.hasClimbed(this) ? ranking(this) : '';
    },
    climber() {
      return ClimberCell.$render(this);
    },
    scoreA() {displayTime(this, 0, false)},
    scoreB() {displayTime(this, 1, false)},

    markWinner() {
      const {round} = $.ctx.parentCtx.data;
      if (round.stage != 0) return null;
      const res = this;
      Dom.setClass('winner', ranking(res)-1 < round.cutoff);
    }
  });

  ABList.$events({
    'change .score>input'(event) {
      const value = this.value.trim() || undefined;
      const num = Math.floor(+value >= 1000 ? +value : (+value)*1000);
      const {round} = $.ctx.parentCtx.data;

      const isLaneA = this.parentNode.nextElementSibling.classList.contains('score');
      const time = num == num ? num : value;
      const attempt = this.getAttribute('data-attempt');
      const result = isLaneA ? $.data(this) : laneB($.data(this));
      if (attempt) {
        round.setTime(result, {time, attempt: +attempt});
      } else {

        round.setTime(result, {
          opponent_id: (isLaneA ? laneB(result) : laneA(result))._id,
          time, lane: isLaneA ? 0 : 1});
      }
    },
  });

  ABRow.$helpers({
    climberA() {
      return ClimberCell.$render(this);
    },

    climberB() {
      return ClimberCell.$render(laneB(this));
    },

    scoreA() {displayTime(this, 0)},
    scoreB() {displayTime(laneB(this), 1)},

    markWinner() {
      const {round} = $.ctx.parentCtx.data;
      if (round.stage == 0 || round.stage == -2) return null;
      const resA = this;
      const resB = laneB(this);
      const winner = round.whoWonFinals(resA, resB);
      $.element.setAttribute('winner', winner === resA ? 'a' : winner === resB ? 'b' : '');
    }
  });

  GeneralList.$helpers({
    finalHeadings() {
      const {heatFormat} = this;
      const frag = document.createDocumentFragment();
      const start = heatFormat[1] === 'C' ? 1 : 0;
      for(let i = heatFormat.length - 1; i > start; --i) {
        frag.appendChild(Dom.h({class: 'score', th: SPEED_FINAL_NAME[heatFormat[i]]}));
      }
      return frag;
    }
  });

  GeneralRow.$helpers({
    rank() {
      const {round} = $.ctx.parentCtx.data;
      const qualScores = this.scores[1];
      return qualScores == null || (qualScores[0] == null && qualScores[1] == null)
        ? '' : ranking(this);
    },

    finalScores() {
      const {heatFormat} = $.ctx.parentCtx.data;
      const frag = document.createDocumentFragment();
      const start = heatFormat[1] === 'C' ? 1 : 0;
      for(let i = heatFormat.length - 1; i > start; --i) {
        const code = heatFormat[i];
        let time;
        if (code === 'R') {
          time = SpeedRound.minQual(this, 2);
        } else {
          const final = this.scores[+code+1];
          time = final && final.time;
        }
        frag.appendChild(Dom.h({class: 'score', td: formatTime(time, false)}));
      }
      return frag;
    },

    climber() {
      return ClimberCell.$render(this);
    },

    qualScore() {
      return formatTime(SpeedRound.minQual(this), false);
    },
  });

  return Tpl;
});