var routes = require("routes");

module.exports = function(table, element, bubbles) {
  var match = matcherForTable(table, element);
  $(window).bind('hashchange', function(){
    match(location.hash);
  });
  $(document.body).on("click", "a", function() {
    var matched = match(this.href);
    // if bubbles is == false, the #/hash won't change, useful for
    // state that doesn't need to be linkable or in the history
    if (matched) {
      return bubbles;
    }
  });
  return {
    init : function(path) {
      console.log("init", location.hash, path);
      var loc = location.hash.slice(location.hash.indexOf('#')+1),
        matched = match.test(loc);
      if (matched) {
        return match(loc);
      } else {
        return match(path||"/");
      }
    },
    go : function(path) { // for non-linked state on widgets
      return match(path);
    }
  }
};

function matcherForTable(table, element) {
  var router = new routes.Router();

  function bindFun(path, fun) {
    console.log("bind path", path);
    router.addRoute(path, function() {
      return fun.apply(element, arguments);
    }); // ensure this is the element
  }

  for (var path in table) {
    if (table[path]) {
      bindFun(path, table[path])
    }
  }

  var matchFun = function(url) {
    var path = url.slice(url.indexOf('#')+1),
      matched = router.match(path);
    console.log(["match?", path, matched, matched && matched.route]);
    if (matched) {
      matched.fn(matched.params, matched.splats)
    }
    return matched;
  };
  matchFun.test = function(url) {
    var path = url.slice(url.indexOf('#')+1);
    return router.match(path);
  };
  return matchFun;
};



