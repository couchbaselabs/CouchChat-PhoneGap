var config = require("./config"),
  coax = require("coax");

function refreshSync(rep, cb) {
  var cancel = JSON.parse(JSON.stringify(rep));
  cancel.cancel = true;
  coax.post([config.dbHost, "_replicate"], cancel, function(err) {
    if (err) {
      config.log("nothing to cancel", err)
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
  config.log("task snapshots", rows)
  return rows.pop();
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
  var req = config.dbServer.get(["_active_tasks", {feed : "continuous"}], function(err, resp){
    config.log("active tasks feed closed", [err, resp])
  });
  onXHRChange(req, function(){
    if (done) return;
    var offline = true, needsLogin = true;
    if (this.responseText) {
      task = parseActiveTasks(this.responseText, session_id);
      config.log("active task", task)
      if (!task) {
        return;
      }
      if (task.status == "Idle" || task.status == "Stopped" || (/Processed/.test(task.status) && !/Processed 0/.test(task.status))) {
        // todo maybe we are cool with tasks that have Processed > 0 changes
        offline = false;
        console.log("online", task.status)
      }
      if (!task.error || task.error[0] != 401) {
        needsLogin = false;
      }
      if (needsLogin) {
        clearTimeout(errorTimeout);
        done = true;
        cb("needsLogin", task);
      } else if (task.status == "Offline") {
        // just wait maybe we go online
        console.log("offline waiting for online")
        // done = true;
        // cb("offline", task);
      } else if (!offline) {
        config.log("waitForSyncSuccess", task)
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

function updateReplications(email) {
  pullRep.source.auth = {persona:{email:email}};
  pushRep.target.auth = {persona:{email:email}};
};

// takes care of triggering pull and push replication to the cloud.
// also handles getting a persona assertion if there is an authentication error.
// is a sync is running it will cancel it and retrigger transparently.
function triggerSync(email, cb, retries) {
  if (retries === 0) return cb("too many retries");
  retries = retries || 3;
  console.log("email", email)
  if (email) {
    updateReplications(email)
    cb(false, email)
  }
  config.log("triggering sync "+retries, pushRep);
  refreshSync(pushRep, function(err, ok) {
    console.log(["pushRep", err, ok.session_id])
    waitForSyncSuccess(10000, ok.session_id, function(err, status){
      if (err == "needsLogin") {
        console.log("yes")
        loginWithPersona(function(err, info){
          if (err) return cb(err);
          config.log("personaInfo", info)
          // updateReplications(info.email)
          config.log("retry with email", info.email);
          updateReplications(info.email)
          cb(false, info.email)
          refreshSync(pushRep, function(err, ok) {})
          refreshSync(pullRep, function(err, ok) {
            config.log("pull connected", [err, ok, info.email])
          })
          // triggerSync(info.email, cb, retries-1);
        });
      } else if (err == "timeout") {
        // maybe active tasks didn't update
        config.dbServer.get("_active_tasks", function(err, tasks){
          config.log("active tasks after timeout", tasks)
        });
      } else if (err) {
        cb(err);
      } else {
        // we are connected, set up pull replication
        config.log("connecting pull", email)
        refreshSync(pullRep, function(err, ok) {
          config.log("pull connected", [err, ok, email])
          // cb(err, email)
        });
      }
    });
  });
};

exports.trigger = triggerSync;
