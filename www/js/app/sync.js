var config = require("./config"),
  coax = require("coax");

function refreshSync(rep, cb) {
  var cancel = JSON.parse(JSON.stringify(rep));
  cancel.cancel = true;
  coax.post([config.dbHost, "_replicate"], cancel, function(err) {
    if (err) {
      console.log(["nothing to cancel", err])
    }
    coax.post([config.dbHost, "_replicate"], rep, cb)
  })
}

var pullRep = {
    source : {url : config.syncTarget},
    target : config.dbName
    , continuous : true
  },
  pushRep = {
    target : {url: config.syncTarget},
    source : config.dbName
    , continuous : true
  };

// poll _active_tasks until timeout
// if success cancel poll, cb no error
// if needsLogin cancel poll, cb with error
// if timeout cancel poll, cb with error

function parseActiveTasks(body, id) {
  var row, rows = [], lines = body.split(/\n/);
  for (var i = 0; i < lines.length; i++) {
    if (lines[i]) {
      try {
        row = JSON.parse(lines[i]);
        if (row.task == id) {
          rows.push(row);
        }
      } catch (e) {}
    }
  };
  return rows[rows.length-1];
}

function onXHRChange(xhr, cb) {
  var orsc = xhr._object.onreadystatechange;
  xhr._object.onreadystatechange = function(){
    cb.apply(this, arguments);
    orsc.apply(this, arguments);
  }
}

function waitForSyncSuccess(timeout, session_id, cb) {
  var task, done = false;
  var errorTimeout = setTimeout(function() {
    if (done) return;
    done = true;
    cb("timeout", task);
  }, timeout);
  var req = config.dbServer.get(["_active_tasks", {feed : "continuous"}], function(){});
  onXHRChange(req, function(){
    if (done) return;
    var offline = true, needsLogin = true;
    if (this.responseText) {
      task = parseActiveTasks(this.responseText, session_id);
      if (task.status == "Idle" || task.status == "Stopped") {
        // todo maybe we are cool with tasks that have Processed > 0 changes
        offline = false;
      }
      if (!task.error || task.error[0] != 401) {
        needsLogin = false;
      }
      if (needsLogin) {
        clearTimeout(errorTimeout);
        done = true;
        cb("needsLogin", task);
      } else if (!offline) {
        clearTimeout(errorTimeout);
        done = true;
        cb(false, task);
      }
    }
  });
}

function loginWithPersona(cb) {
  window.presentPersonaDialog(config.syncOrigin, function(err, assertion){
    if (err) return cb(err);
    config.dbServer.post("_persona_assertion", {assertion:assertion}, cb);
  })
}


function setupLocalUser(info, cb) {
  config.db.get("_local/user", function(err, user) {
    if (err && err.error == "not_found") {
      config.db.post({_id : "_local/user", email:info.email}, function(err, ok){
        cb(err, info);
      });
    } else {
      if (user.email !== info.email) {
        cb("This device is already synced for "+user.email+". To to change users please uninstall and reinstall.");
      } else {
        cb(false, user);
      }
    }
  });
};

// takes care of triggering pull and push replication to the cloud.
// also handles getting a persona assertion if there is an authentication error.
// is a sync is running it will cancel it and retrigger transparently.
function triggerSync(cb, retries) {
  if (retries === 0) return cb("too many retries");
  retries = retries || 3;
  console.log(["triggering sync", retries, pullRep]);
  refreshSync(pushRep, function(err, ok) {
    console.log(["pushRep", err, ok.session_id])
    waitForSyncSuccess(5000, ok.session_id, function(err, status){
      if (err == "needsLogin") {
        loginWithPersona(function(err, info){
          if (err) return cb(err);
          console.log(["personaInfo", info])
          setupLocalUser(info, function(err, user){
            if (err) return cb(err);
            pullRep.source.auth = {persona:{email:user.email}};
            pushRep.target.auth = {persona:{email:user.email}};
            console.log(["retry with email", user.email]);
            triggerSync(cb, retries-1);
          });
        });
      } else if (err) {
        cb(err);
      } else {
        // we are connected, set up pull replication
        refreshSync(pullRep, function(err, ok) {
          config.db("_local/user", cb);
        });
      }
    });
  });
};

exports.trigger = triggerSync;
