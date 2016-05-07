chalk = require("chalk")

getDate = ->
  d = new Date()
  return "#{ d.getHours() }:#{ d.getMinutes() }:#{ d.getSeconds()}"


message = (header,color,out,data...) ->

  out(color("#{header}[#{ getDate() }]"),data...)


module.exports =



  log: (data...) -> message("LOG",chalk.blue,console.log,data...)

  error: (data...) -> message("ERROR",chalk.red,console.error,data...)

  success: (data...) -> message("SUCCESS",chalk.green,console.log,data...)

  warn: (data...) -> message("WARN",chalk.yellow,console.log,data...)


