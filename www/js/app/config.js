var config = module.exports = {
    t : {}, dbName : "mydb",
    dbHost : 'http://lite.couchbase.'
  },
  mu = require("mustache"),
  coax = require("coax");

// todo make configurable in-app
config.syncOrigin = 'http://mineral.local:4984/';
config.syncTarget = 'http://mineral.local:4984/chat';

config.dbUrl = config.dbHost + '/' + config.dbName;

config.db = coax(config.dbUrl);
config.dbServer = coax(config.dbHost);

$('script[type="text/mustache"]').each(function() {
    var id = this.id.split('-');
    id.pop();
    module.exports.t[id.join('-')] = mu.compile(this.innerHTML.replace(/^\s+|\s+$/g,''));
});

var ddoc = {
  _id : "_design/threads",
  views : {
    messages : {
      map : function(doc) {
        if (doc.type =="chat" && doc.channel_id) {
          emit([doc.channel_id, doc.created_at],
            [doc.author, doc.markdown, !!doc._attachments, doc.style == "announcement"]);
        }
      }.toString(),
      reduce : function(ks, vs, rr) {
        var v, d, max, count = 0, lastSender;
        if (rr) {
          for (var i = 0; i < vs.length; i++) {
            v = vs[i];
            count += v[1];
            d = new Date(v[0]);
            if (!max || d > max) {
              max = d;
              lastSender = v[2];
            }
          };
        } else {
          max = new Date(ks[ks.length-1][1]);
          lastSender = vs[vs.length-1][0];
          count = vs.length;
        }
        return [max, count, lastSender];
      }.toString()
    },
    users : {
      map : function(doc){
        if (doc.type == "profile") {
          var key = doc._id.replace(/^profile:/,''), name = doc.nick || key;
          emit(key, name);
        }
      }.toString()
    }
  }
}

config.setup = function(done) {
  // install the views
  config.db.forceSave(ddoc, done);
}
