module.exports = function(root, classname) {
  classname = classname || "touch";
  var events = [
    ["click","removeClass"],
    ["touchstart","addClass"],
    ["touchend","removeClass"]
  ];
  for (var i = events.length - 1; i >= 0; i--) {
    var on = events[i][0], method = events[i][1];
    $(root).on(on,"a",function(e) {
      var target = $(e.currentTarget);
      if (target.attr('href')) {
        target[method](classname);
      }
    });
  };
};
