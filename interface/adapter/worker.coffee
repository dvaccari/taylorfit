
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
    @worker.postMessage
      type: target
      data: message

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

  requestStatisticsMetadata: ( ) ->
    @post "getStatisticsMetadata"

  subscribeToChanges: ( ) ->
    @post "subscribeToChanges"
  unsubscribeToChanges: ( ) ->
    @post "unsubscribeToChanges"

  clear: ( ) ->
    @post "clear"
