module.exports = 
  namespace: "main"
  
  actions: 
  
    about:
      params: {}
      supportsUpdates: false
      description: "Gets some basic information about the system"
      result: {
        time: { type: "number"}
      }
      process: ({ res, }) ->
        res(
          time: Date.now()
        )