
SILENT_MESSAGE_TYPES = [ "progress" ]

#EngineWorker = require "../../engine/worker/engine-worker"

class ME

  constructor: ( ) ->
    @listeners = { }
    undefined

  reset: ( ) ->
    @listners = { }

  on: ( target, listener ) ->
    (@listeners[target] or= [ ]).push listener
    undefined

  fire: ( target, message ) ->
    unless target in SILENT_MESSAGE_TYPES
      console.debug "ME/fire", target
    if listeners = @listeners[target]
      for listener in listeners
        listener.call this, message
    undefined

# eventually have Adapter class extending ME

module.exports = new class WorkerAdapter extends ME

  constructor: ( ) ->
    super

    @worker = new Worker "engine-worker.js"

    @worker.onerror = ( error ) =>
      console.debug "Worker/res [error]", error
      @fire "error", error

    @worker.onmessage = ( { data: message } ) =>
      if message._subworker
        return
      { type, data } = message

      unless type in SILENT_MESSAGE_TYPES
        console.debug "Worker/res [#{type}]", data

      @fire type, data

  post: ( target, message ) ->
    console.debug "Worker/req [#{target}]", message
    @worker.postMessage({
      type: target,
      data: message
    })

  setData: ( x, label ) ->
    @post "setData", { data: x, label }
  setExponents: ( x ) ->
    @post "setExponents", x
  setMultiplicands: ( x ) ->
    @post "setMultiplicands", x
  setDependent: ( x ) ->
    @post "setDependent", x
  setLags: ( x ) ->
    @post "setLags", x

  addTerm: ( x ) ->
    @post "addTerm", x
  removeTerm: ( x ) ->
    @post "removeTerm", x
  
  tranformData: ( x ) ->
    # Doing len_x - 1 and not x[1] because sometimes the label index and index value can be the same
    # Ex: Transform index 1 with log (log is 1 in transform/label.json)
    # So x is [1] since the object is {1: true}
    len_x = x.length
    @post("tranformData", { label: x[0], index: x[len_x - 1] })

  kOrderTransform: ( x ) ->
    len_x = x.length
    if len_x > 0
      @post("tranformData", { index: x[0], k: x[len_x - 1] })

  requestStatisticsMetadata: ( ) ->
    @post "getStatisticsMetadata"

  subscribeToChanges: ( ) ->
    @post "subscribeToChanges"
  unsubscribeToChanges: ( ) ->
    @post "unsubscribeToChanges"

  clear: ( ) ->
    @post "clear"
