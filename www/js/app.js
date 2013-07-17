$(function() {
  var config = require('./app/config'),
    controller = require("./app/controller"),
    sync = require('./app/sync'),
    // libraries
    coax = require("coax"),
    touchlink = require("./touchlink"),
    fastclick = require("fastclick"),
    router = require("./routes-element");

  new fastclick.FastClick(document.body);

  var changesSetup = false;
  function setupChanges(changesHandler) {
    if (changesSetup) return;
    changesSetup = true;
    config.db(function(err, info){
      console.log("setup changes",info);
      config.db.changes({include_docs:true, since:info.update_seq}, function(err, change){
        if (err) {
          console.log(["changes doc err", err]);
        } else {
          // console.log(["chn", change])
          change.doc && changesHandler(change.doc);
        }
      });
    });

  }
  // start the sync
  function appInit(cb) {
    sync.trigger(function(err, user){
      if (err) {
        alert(err);
        return;
      }
      if (user && user.email) {
        window.email = user.email;
        config.db.put("profile:"+user.email, {type : "profile"}, function() {
          cb(false, user.email);
        });
      }
    });
  }

  config.setup(function(err, ok){
    if (err) {
      return console.log(err);
    }
    appInit(function(err, email) {
      var contentRouter = router(controller, $("#content")[0]);
      contentRouter.init();
      setupChanges(function(doc){
        console.log(["dbchange", doc._id, doc.channel_id]);
        console.log(["call changesPainter", window.changesPainter.toString()])
        window.changesPainter && window.changesPainter();
        if (doc.channel_id == doc._id) {
          // workaround for https://github.com/couchbaselabs/sync_gateway/issues/31
          console.log("resync")
          sync.trigger(function(){});
        }
      });
    });
  });
});
