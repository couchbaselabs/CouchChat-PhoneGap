#!/usr/bin/env node

var fs = require("fs");

var b = require("browserify")({watch : false, debug : true});
b.addEntry(__dirname + "/www/js/app.js");
b.on('bundle', function() {
  var src = b.bundle();
  if (!b.ok) {
    throw("bundle error")
  }
  fs.writeFile(__dirname + "/www/js/output.js", src, function () {
    console.log(Buffer(src).length + ' bytes written to output.js');
  });
})
b.emit("bundle");
