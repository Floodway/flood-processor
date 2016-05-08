module.exports = {
  namespace: "main",
  actions: {
    about: {
      params: {},
      supportsUpdates: false,
      description: "Gets some basic information about the system",
      result: {
        time: {
          type: "number"
        }
      },
      process: function(arg) {
        var res;
        res = arg.res;
        return res({
          time: Date.now()
        });
      }
    }
  }
};
