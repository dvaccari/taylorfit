Transformation = require("../components/transform/label.json")

FIT_LABEL = require('../../engine/labels.json').FIT_LABEL
CROSS_LABEL = require('../../engine/labels.json').CROSS_LABEL
VALIDATION_LABEL = require('../../engine/labels.json').VALIDATION_LABEL

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
    super()

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
  # Send data to engine-worker.js
  stopCalc: ( ) ->
    console.error("Stopped/cancelled calc");
    @post "stopCalc"
  sendPsig: ( x ) ->
    console.debug("Sending PSIG" + x)
    @post "sendPsig", x
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
  
  transformDelete: ( x ) ->
    if x
      @post("transformData", {
        label: Transformation.Transform.delete,
        index: x.index,
        data_labels: x.labels || [FIT_LABEL, CROSS_LABEL, VALIDATION_LABEL]
      })
  transformLog: ( x ) ->
    if x
      @post("transformData", {
        label: Transformation.Transform.log,
        index: x.index,
        data_labels: x.labels || [FIT_LABEL, CROSS_LABEL, VALIDATION_LABEL]
      })
  kOrderTransform: ( x ) ->
    if x
      @post("transformData", {
        label: Transformation.Transform.k_order_diff,
        index: x.index,
        k: x.k,
        data_labels: x.labels || [FIT_LABEL, CROSS_LABEL, VALIDATION_LABEL]
      })
  transformStandardize: ( x ) ->
    if x
      @post("transformData", {
        label: Transformation.Transform.standardize,
        index: x.index,
        data_labels: x.labels || [FIT_LABEL, CROSS_LABEL, VALIDATION_LABEL]
      })
  transformRescale: ( x ) ->
    if x
      @post("transformData", {
        label: Transformation.Transform.rescale,
        index: x.index,
        data_labels: x.labels || [FIT_LABEL, CROSS_LABEL, VALIDATION_LABEL]
      })

  requestStatisticsMetadata: ( ) ->
    @post "getStatisticsMetadata"

  subscribeToChanges: ( ) ->
    @post "subscribeToChanges"
  unsubscribeToChanges: ( ) ->
    @post "unsubscribeToChanges"

  getSensitivity: ( x ) ->
    @post "getSensitivity", x

  deleteSensitivity: ( x ) ->
    @post "deleteSensitivity", x

  updateSensitivity: ( x ) ->
    @post "updateSensitivity", x

  getConfidence: ( x ) ->
    @post "getConfidence", x

  deleteConfidence: ( x ) ->
    @post "deleteConfidence", x

  updateConfidence: ( x ) ->
    @post "updateConfidence", x

  getPrediction: ( x ) ->
    @post "getPrediction", x

  deletePrediction: ( x ) ->
    @post "deletePrediction", x

  updatePrediction: ( x ) ->
    @post "updatePrediction", x

  getImportanceRatio: ( x ) ->
    @post "getImportanceRatio", x

  deleteImportanceRatio: ( x ) ->
    @post "deleteImportanceRatio", x

  updateImportanceRatio: ( x ) ->
    @post "updateImportanceRatio", x

  clear: ( ) ->
    @post "clear"
