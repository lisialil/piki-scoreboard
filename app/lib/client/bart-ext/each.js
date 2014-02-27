var $ = Bart.current;

Bart.registerHelpers({
  each: function (func, options) {
    callback.render = callbackRender;
    var eachCtx = $.ctx;
    if ($.element._bartEnd) return;
    if (typeof func !== 'string') throw new Error("first argument must be name of helper method to call");

    var startEach = document.createComment('start');
    var endEach = startEach._bartEnd = document.createComment('end');
    $.element.parentNode.insertBefore(endEach, $.element.nextSibling);

    var col = {};
    var ctpl = $.template;
    options = options || {};
    var templateName = options.template || "Each_" + func;

    var row = Bart.lookupTemplate.call(ctpl, templateName) ||
          Bart.lookupTemplate(templateName);
    if (! row) throw new Error("template '" + templateName + "' not found in template '" + ctpl.name + "'");

    var helper = ctpl._helpers[func];
    if (! helper) throw new Error("helper '" + func + "' not found in template '" + ctpl.name + "'");

    helper.call(this, callback);


    return startEach;


    function callback(doc, old, sort) {
      var id = (doc || old);
      id = id._id || id.id;
      var elm = col[id];
      if (elm) {
        if (doc) {
          Bart.getCtx(elm).updateAllTags(doc);
          if (! old || (sort && sort(doc, old) != 0))
            insert(elm, sort);
        } else {
          delete col[id];
          Bart.remove(elm);
        }
        return;
      }
      var parentNode = endEach.parentNode;
      if (!parentNode) return;
      insert(col[id] = row.$autoRender(doc, eachCtx), sort);
    }

    function insert(elm, sort) {
      var a = $.data(elm);
      var before = endEach;
      if (sort) {
        var prev;
        for(var prev; (prev = before.previousSibling) !== startEach; before = prev)  {
          var b = $.data(prev);
          if (a !== b && sort(a, b) >= 0) break;
        }
      }

      endEach.parentNode.insertBefore(elm, before);
    }
  },
});

function callbackRender(options) {
  var callback = this;
  var model = options.model;
  var params = options.params;
  var sortFunc = options.sort;
  var filter = options.filter;

  var results = options.index ? options.index.fetch(params || {}) : model.find(params || {}).fetch();
  if (filter) results = results.filter(function (doc) {
    return filter(doc);
  });
  results.sort(sortFunc)
    .forEach(function (doc) {callback(doc)});

  $.ctx.onDestroy(model.Index.observe(function (doc, old) {
    if (params) {
      if (old && ! Apputil.includesAttributes(params, old)) old = null;
      if (doc && ! Apputil.includesAttributes(params, doc)) doc = null;
    }

    if (filter) {
      if (old && ! filter(old)) old = null;
      if (doc && ! filter(doc)) doc = null;
    }

    if (doc || old) {
      callback(doc && new model(doc), old && new model(old), sortFunc);
    }
  }));
}
