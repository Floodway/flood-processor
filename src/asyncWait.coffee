class AsyncWait
  
  constructor: () ->
    
    @steps = []
    
    @done = 0
  
  addStep: (fn) ->
    
    @steps.push(fn)
    
  
  run: (callback) ->
    
    if @steps.length == 0
      
      callback()
    
    for step in @steps
      
      step( =>
        @done++
        @checkDone(callback)
      )
    
  
  checkDone: (callback) ->
    
    if @done == @steps.length
      callback()
      



module.exports =  AsyncWait
  