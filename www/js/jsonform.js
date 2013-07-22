module.exports = function(elem) {
  var o = {}, list = $(elem).serializeArray();
  for (var i = list.length - 1; i >= 0; i--) {
    var name = list[i].name, value = list[i].value;
    if (o[name]) {
        if (!o[name].push) {
            o[name] = [o[name]];
        }
        o[name].push(value);
    } else {
        o[name] = value;
    }
  };
  return o;
};


