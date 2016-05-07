var chalk, getDate, message,
  slice = [].slice;

chalk = require("chalk");

getDate = function() {
  var d;
  d = new Date();
  return (d.getHours()) + ":" + (d.getMinutes()) + ":" + (d.getSeconds());
};

message = function() {
  var color, data, header, out;
  header = arguments[0], color = arguments[1], out = arguments[2], data = 4 <= arguments.length ? slice.call(arguments, 3) : [];
  return out.apply(null, [color(header + "[" + (getDate()) + "]")].concat(slice.call(data)));
};

module.exports = {
  log: function() {
    var data;
    data = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return message.apply(null, ["LOG", chalk.blue, console.log].concat(slice.call(data)));
  },
  error: function() {
    var data;
    data = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return message.apply(null, ["ERROR", chalk.red, console.error].concat(slice.call(data)));
  },
  success: function() {
    var data;
    data = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return message.apply(null, ["SUCCESS", chalk.green, console.log].concat(slice.call(data)));
  },
  warn: function() {
    var data;
    data = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return message.apply(null, ["WARN", chalk.yellow, console.log].concat(slice.call(data)));
  }
};
