App.extend(App, {
  userId: function () {
    return Meteor.userId();
  },

  formatSafe: function () {
    return new Handlebars.SafeString(App.format.apply(App.format, arguments));
  },

  subscribe: function () {
    if (typeof arguments[arguments.length - 1] !== 'function')
      return Meteor.subscribe.apply(Meteor, arguments);

    var args = Apputil.slice(arguments, 0);
    var callback = args.pop();

    args.push({
      onError: function (err) {
        if (err != null) {
        App.log('ERROR: ', err);
          App.globalErrorCatch && App.globalErrorCatch(err);
          callback && callback(err);
        }
      },
      onReady: callback,
    });

    return Meteor.subscribe.apply(Meteor, args);
  },
});
