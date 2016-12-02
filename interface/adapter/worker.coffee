
worker = new Worker "engine-worker.js"

waiting = false

worker.onerror = ( error ) ->
  if waiting is false
    throw new Error "Worker: unexpected message: " + error.message
  waiting.reject error
  waiting = false

worker.onmessage = ( { data } ) ->
  if waiting is false
    throw new Error "Worker: unexpected message: " + data
  waiting.accept data
  waiting = false

send = ( data ) ->
  if waiting isnt false
    throw new Error "Worker: unexpected entry: " + data
  promise = new Promise ( accept, reject ) ->
    waiting = { accept, reject }
  worker.postMessage data
  return promise

module.exports =
  send_model: ( grid, dependant, exponents, multiplicands ) ->
    worker.postMessage
      type: "new_model"
      data: grid
      indepCol: dependant
      exponents: exponents
      multiplicands: multiplicands
    send type: "get_terms"
