var config = require('./config'),
  db = config.db,
  messagesView = db(["_design","threads","_view","messages"]),
  usersView = db(["_design","threads","_view","users"]),
  async = require("async"),
  jsonform = require("./jsonform");


exports["/"] = function () {
  // render index content html
  var elem = $(this);
  window.changesPainter = function() {
    exports["/"].apply(elem);
  };
  messagesView({group_level : 1}, function(err, view) {
    console.log(['sort these', view.rows]);
    var rows = view.rows.sort(function(a, b){ return new Date(b.value[0]) - new Date(a.value[0])});
    async.map(rows, function(row, cb) {
      config.db.get(row.key[0], function(err, doc){
        row.doc = doc;
        cb(err, row);
      });
    }, function(err, results){
      elem.html(config.t.index({user: window.email, rows : results}));
    });
  });
};

// $.ajax({url:"http://lite.couchbase./mydb/dide17d761gi",success:console.log})
exports["/rooms/new"] = function () {
  window.changesPainter = function(){};
  var elem = $(this);
  usersView(function(err, view){
    var rows = [];
    for (var i = 0; i < view.rows.length; i++) {
      if (view.rows[i].id !== "profile:"+window.email) {
        rows.push(view.rows[i]);
      }
    };
    elem.html(config.t.newRoom({rows:rows}));
    elem.find("form").submit(function(e) {
      e.preventDefault();
      var doc = jsonform(this);
      doc.title = doc.title || new Date();
      doc.members = doc.members || [];
      if (!Array.isArray(doc.members)) {
        doc.members = [doc.members];
      }
      doc.owners = [window.email];
      doc.created_at = doc.updated_at = new Date();
      doc._id = doc.channel_id = Math.random().toString(20).slice(2);
      doc.type = "room";
      db.post(doc, function(err, ok) {
        var announce = {
          type : "chat",
          created_at : new Date(),
          author : window.email,
          channel_id : ok.id,
          style : "announcement",
          markdown : window.email+" started this room and invited "+doc.members.join(', ')+"."
        };
        db.post(announce, function(err, ok) {
          location.hash = "/rooms/"+doc._id;
        });
      });
      return false;
    });
  });
}

exports["/rooms/:id"] = function(params) {
  var elem = $(this);
  db.get(params.id, function(err, room) {
    if(err){return location.hash="/error";}
    elem.html(config.t.room(room));
    elem.find("form").submit(makeNewMessageSubmit(window.email));
    elem.find("a.photo").click(makeNewPhotoClick(window.email));
    window.changesPainter = function(){
      listMessages(elem.find(".messages"), params.id);
    };
    window.changesPainter();
  });
};

function listMessages (elem, room_id) {
  messagesView([{descending:true, reduce: false, limit:50,
      startkey : [room_id,{}], endkey : [room_id]}], function(err, view) {
    if(err){return console.log(["listMessages err", err])}
    // console.log(view)
    var row, rows = view.rows;
    for (var i = 0; i < rows.length; i++) {
      row = rows[i];
      if (row.value[0] == window.email) {
        row.who = "mine";
      }
      if (row.value[2]) {
        row.photo = db([row.id, "picture"]).pax.toString();
      }
    };
    elem.html(config.t.listMessages(view));
  });
}

function messageFromForm(author, form) {
  var doc = jsonform(form);
  doc.author = author;
  doc.created_at = doc.updated_at = new Date();
  // doc.seq = last_seq++;
  doc.type = "chat";
  return doc;
};

function makeNewMessageSubmit(email) {
  return function(e) {
    e.preventDefault();
    var form = this, doc = messageFromForm(email, form);
    db.post(doc, function(err, ok){
      if (err) {
        return console.log(["form error",err]);
      }
      // clear the form unless they started typing something new already
      var input = $(form).find("[name=markdown]");
      if (input.val() == doc.markdown) {
        input.val('');
      }
    });
  }
}

function makeNewPhotoClick(email) {
    return function(e) {
      e.preventDefault();
      if (!(navigator.camera && navigator.camera.getPicture)) {
        console.error("no navigator.camera.getPicture")
      } else {
        var link = this, form = $(link).parent("form"),
          doc = messageFromForm(email, form);
        navigator.camera.getPicture(function(picData){
          doc._attachments = {
            "picture" : {
              content_type : "image/jpg",
              data : picData
            }
          };
          db.post(doc, function(err, ok){
            if (err) {return console.log("save err",err);}
            var input = $("form.message [name=markdown]");
            if (input.val() == doc.markdown) {
              input.val('');
            }
          });
        }, function(err){
          console.error(["camera err",err]);
          $(link).text("Error");
        }, {
          quality : 25,
          targetWidth : 1024,
          targetHeight : 1024,
          destinationType: Camera.DestinationType.DATA_URL
        });
      }
    }
};
