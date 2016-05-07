var md5;

md5 = require("md5");

module.exports = function() {
  return {
    generateSecret: function() {
      var secret;
      secret = generateId();
      console.log("Connection secret is: " + secret);
      return secret;
    },
    generateId: function() {
      return md5(Date.now() * Math.random() * Math.random());
    }
  };
};
