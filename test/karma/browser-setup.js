__meteor_runtime_config__ = { ROOT_URL: "http://test.local:1234", serverId: "testing"};

(function (geddon) {
  var _savedMethodHandlers, pageTitle, timeoutCount,
      firstTime = true;

  geddon.onTestStart(setUp);
  geddon.onTestEnd(tearDown);
  sinon.stub(App, 'log');

  function setUp () {
    App.log.reset();
    if(firstTime) {
      firstTime = false;
      pageTitle = AppRoute.title;
      AppRoute._orig_history = AppRoute.history;
      AppRoute.history = {
        pushState: function () {},
        replaceState: function () {},
      };
      Accounts.loginServicesConfigured = loginServicesConfiguredStub;
      Meteor.setTimeout = timeoutStub;
    } else {
      cleanup();
    }

    timeoutCount = 0;
  }

  function tearDown(test) {
    if (! test.success && test.logHtml) {
      console.log("html "+ (test.logHtml.innerHTML||''));
      test.logHtml = null;
    }
    AppRoute.gotoPage(null);
    var body = document.body;
    body.className = '';
    var lc;
    while(lc = body.lastChild) {
      body.removeChild(lc);
    }
    App.orgId = null;
    AppRoute.title = pageTitle;
  }

  function loginServicesConfiguredStub() {
    return true;
  }

  function timeoutStub(func,duration) {
    try {Deps.flush();} catch(e) {};
    func();
    return ++timeoutCount;
  }

  function cleanup() {
    try {
      TH.clearDB();
    }
    catch(e) {
      console.log('test cleanup ',e);
    }
  }
})(geddon);
