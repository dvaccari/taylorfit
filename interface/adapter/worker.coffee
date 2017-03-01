
class ME

  constructor: ( ) ->
    @listeners = { }
    undefined

  on: ( target, listener ) ->
    (@listeners[target] or= [ ]).push listener
    undefined

  fire: ( target, message ) ->
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

    @worker.onmessage = ( { data: { type, data } } ) =>
      console.debug "Worker/res [#{type}]", data
      @fire type, data

  post: ( target, message ) ->
    console.debug "Worker/req [#{target}]", message
    @worker.postMessage
      type: target
      data: message

  post_add_term: ( term ) ->
    @post "add_term", term

  post_dataset: ( s, d, m, e ) ->
    @post "update",
      dataset: s
      dependent: d
      multiplicands: m
      exponents: e

  for target in [
    "dependent"
    "multiplicands"
    "exponents"
  ]
    do ( target ) ->
      WorkerAdapter::["post_#{target}"] = ( message ) ->
        m = { }; m[target] = message
        @post "update", m

