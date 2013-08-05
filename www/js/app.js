var config = require('./config'),
  controller = require("./controller"),
  sync = require('./sync'),
  // libraries
  coax = require("coax"),
  touchlink = require("./touchlink"),
  fastclick = require("fastclick"),
  router = require("./routes-element");

window.coax = coax;

// document.addEventListener("deviceready", appInit, false);
// document.addEventListener("resume", myResumeListener, false);
// document.addEventListener("pause", myPauseListener, false);
$(appInit)

new fastclick.FastClick(document.body);

// setup the local database
// load the current user
// trigger sync
// draw the UI
function appInit() {
 config.setup(function(err, ok){
    if (err) {
      config.log("setup err", err);
    } else {
      loadUser()
    }
 });
}

function loadUser() {
  config.db.get("_local/user", function(err, user){
    if (!err) {
      window.email = user.email;
      initUI()
    }
    triggerSync(window.email)
  });
}

function initUI() { // assumes window.email is set
  var contentRouter = router(controller, $("#content")[0]);
  contentRouter.init();
  setupChanges(function(doc){
    // console.log(["dbchange", doc._id, doc.channel_id]);
    // console.log(["call changesPainter", window.changesPainter.toString()])
    controller.changesPainter && controller.changesPainter();
  });
};

function triggerSync(email) {
  sync.trigger(email, function(err, newEmail){
    if (err) {
      // need to set an event when we are back online
      // otherwise we might have a new install that goes online
      // and can't setup
      return config.log(err)
    }

    if (email && newEmail && newEmail != email) {
      config.log("hmm", [email, newEmail])
      return alert("This device is already synced for "+email+". To to change users please uninstall and reinstall.");
    }

    if (!email && newEmail) {
      window.email = newEmail;
      // create profile doc to sync to server on first login
      config.db.put("profile:"+newEmail, {email: newEmail, type : "profile"}, function() {
        // local doc for fast boot next time
        config.db.put("_local/user", {email: newEmail}, function() {});
      })

      initUI();
    }
  });
};




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
