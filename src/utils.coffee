md5 = require("md5")
module.exports = ->

	generateSecret: ->

		secret = generateId()

		console.log "Connection secret is: #{secret}"

		return secret

	generateId: ->

		return md5(Date.now()*Math.random()*Math.random())

	



