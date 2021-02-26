utils = require('../../engine/utils');

Transformation = require "./transform/label.json"
CROSS_LABEL = require("../../engine/labels.json").CROSS_LABEL
VALIDATION_LABEL = require("../../engine/labels.json").VALIDATION_LABEL

WRAP_O = ( v ) -> ko.observable v
WRAP_A = ( v ) -> ko.observableArray v
UNWRAP = ( v ) -> ko.unwrap v
UNWRAP_O = ( v ) ->
  o = ko.unwrap v
  for k of o
    o[k] = ko.unwrap o[k]
  return o
IGNORE = ( v ) -> undefined
DATA = ( type ) -> ( v ) ->
  o = ko.observable()
  o.subscribe ( next ) ->
    adapter.setData next, type
  o v
  return o
SEND = ( name, converter ) -> ( v ) ->
  o = ko.observable()
  o.subscribe ( next ) ->
    adapter[name] converter next
  o v
  return o

object2array = ( exps ) ->
  Number key for key, value of ko.unwrap exps \
  when ko.unwrap value

object2object = ( exps ) -> exps

CTRL =
  id:
    [ "model"     , WRAP_O                            , UNWRAP ]
  name:
    [ "New Model" , WRAP_O                            , UNWRAP ]

  name_cross:
    [ "Cross Data", WRAP_O                            , UNWRAP ]
  name_validation:
    [ "Validation Data", WRAP_O                       , UNWRAP ]

  progress:
    [ 0           , WRAP_O                            , IGNORE ]
  show_settings:
    [ false       , WRAP_O                            , IGNORE ]
  show_histogram:
    [ undefined    , WRAP_O                           , IGNORE ]
  show_cumulative_distribution:
    [ undefined    , WRAP_O                           , IGNORE ]
  show_export_code:
    [ undefined    , WRAP_O                           , IGNORE ]
  show_autocorrelation:
    [ undefined    , WRAP_O                           , IGNORE ]
  show_xyplot:
    [ undefined    , WRAP_O                           , IGNORE ]
  show_qqplot:
    [ undefined    , WRAP_O                           , IGNORE ]
  show_transform:
    [ undefined    , WRAP_O                           , IGNORE ]
  show_sensitivity:
    [ undefined   , SEND("getSensitivity", Number)    , IGNORE ]
  delete_sensitivity:
    [ undefined   , SEND("deleteSensitivity", Number) , IGNORE ]
  update_sensitivity:
    [ undefined   , SEND("updateSensitivity", Number)  , IGNORE ]
  show_confidence:
    [ undefined   , SEND("getConfidence", Number)    , IGNORE ]
  delete_confidence:
    [ undefined   , SEND("deleteConfidence", Number) , IGNORE ]
  update_confidence:
    [ undefined   , SEND("updateConfidence", Number)  , IGNORE ]
  show_prediction:
    [ undefined   , SEND("getPrediction", Number)    , IGNORE ]
  delete_prediction:
    [ undefined   , SEND("deletePrediction", Number) , IGNORE ]
  update_prediction:
    [ undefined   , SEND("updatePrediction", Number)  , IGNORE ]
  show_importanceRatio:
    [ undefined   , SEND("getImportanceRatio", Number)    , IGNORE ]
  delete_importanceRatio:
    [ undefined   , SEND("deleteImportanceRatio", Number) , IGNORE ]
  update_importanceRatio:
    [ undefined   , SEND("updateImportanceRatio", Number)  , IGNORE ]

  # Loaded from tf-loader
  columns:
    [ [ ]         , WRAP_A                            , UNWRAP ]
  data_fit:
    [ undefined   , DATA("fit")                       , UNWRAP ]
  data_cross:
    [ undefined   , DATA("cross")                     , UNWRAP ]
  data_validation:
    [ undefined   , DATA("validation")                , UNWRAP ]
  data_plotted:
    [ "fit"       , WRAP_O                            , IGNORE ]
  candidates:
    [ [ ]         , WRAP_A                            , IGNORE ]
  result_fit:
    [ undefined   , WRAP_O                            , UNWRAP ]
  result_cross:
    [ undefined   , WRAP_O                            , IGNORE ]
  result_validation:
    [ undefined   , WRAP_O                            , IGNORE ]

  psig:
    [ 0.05        , WRAP_O                            , UNWRAP ]
  dependent:
    [ 0           , SEND("setDependent", Number)      , UNWRAP ]
  hiddenColumns:
    [ {}            , WRAP_O                          , UNWRAP ]
  multiplicands:
    [ 1           , SEND("setMultiplicands", Number)  , UNWRAP ]
  exponents:
    [ 1: true     , SEND("setExponents", object2array), UNWRAP_O ]
  timeseries:
    [ false       , WRAP_O                            , UNWRAP ]
  lags:
    [ 0: true     , SEND("setLags"     , object2array), UNWRAP_O ]

  # key: original col index, value: transform col index
  transform_columns:
    [ {}          , WRAP_O                            , UNWRAP_O ]
  transformDelete:
    [ undefined   , SEND("transformDelete", object2object)   , UNWRAP_O ]
  transformLog:
    [ undefined   , SEND("transformLog", object2object), UNWRAP_O ]
  kOrderTransform:
    [ undefined   , SEND("kOrderTransform", object2object), UNWRAP_O ]
  transformStandardize:
    [ undefined   , SEND("transformStandardize", object2object), UNWRAP_O ]
  transformRescale:
    [ undefined   , SEND("transformRescale", object2object)  , UNWRAP_O ]
  # Value should be index of row to display as start of partition
  partitionData:
    [ undefined   , SEND("partitionData", object2object), UNWRAP_O ]
  sensitivityColumns:
    [ []         , WRAP_A                            , UNWRAP ]
  sensitivityData:
    [ []         , WRAP_A                            , UNWRAP ]
  confidenceColumns:
    [ []         , WRAP_A                            , UNWRAP ]
  confidenceData:
    [ []         , WRAP_A                            , UNWRAP ]
  predictionColumns:
    [ []         , WRAP_A                            , UNWRAP ]
  predictionData:
    [ []         , WRAP_A                            , UNWRAP ]
  importanceRatioColumns:
    [ []         , WRAP_A                            , UNWRAP ]
  importanceRatioData:
    [ []         , WRAP_A                            , UNWRAP ]

module.exports = class Model

  constructor: ( o ) ->

    console.debug "model/input", o

    # Sets on startup
    setTimeout =>
      psig = ko.unwrap @psig
      adapter.sendPsig(psig)
      console.debug "PSIG sending"
    , 0

    adapter.unsubscribeToChanges()

    for k, v of utils.clone(CTRL)
      @[k] = v[1] if o.hasOwnProperty k
      then o[k] else v[0]

    result = ko.unwrap @result_fit
    if result?.terms?
      for { term } in result.terms
        adapter.addTerm term.map ({ index, exp, lag }) ->
          [index, exp, lag]

    adapter.subscribeToChanges()

    for type in [ "fit", "cross", "validation" ]
      do ( type ) =>
        @["extra_#{type}"] = ko.computed ( ) =>

          data = @["data_#{type}"]()
          res = @["result_#{type}"]()
          if res
            pred = (NaN for i in [0...res.lag]).concat res.predicted

          if (not data) or (not pred) then return undefined

          results = [ ]
          dep = @dependent()

          for row, index in data
            d = row[dep]; p = pred[index]
            results.push [ d, p, d - p ]

          return results

    mapper = ( terms, fn ) =>
      cols = ko.unwrap @columns
      # Filter out terms that couldn't get a coefficient calculated
      terms.filter((t) => t.coeff).map (t) =>
        return t if t.selected?
        result =
          selected: ko.observable false
          stats: t.stats
          # TODO: remove hack
          coeff: t.coeff or t.stats.coeff
          term: t.term.map ( term ) ->
            name: cols[term[0]]?.name
            index: term[0]
            exp: term[1]
            lag: term[2]
        # This subscribes to when user picks candidate term
        result.selected.subscribe ( ) ->
          adapter["#{fn}Term"] t.term
          # For some reason doesn't listen to change, so need add subscription for model change
          adapter.subscribeToChanges()
        return result

    adapter.on "candidates", ( candidates ) =>
      setTimeout =>
        @candidates (mapper candidates, "add")
        @progress 0
      , 100

    adapter.on "model:fit", ( model ) =>
      setTimeout =>
        @result_fit
          lag: model.highestLag
          terms: mapper model.terms, "remove"
          stats: model.stats
          predicted: model.predicted
      , 100
    adapter.on "model:cross", ( model ) =>
      setTimeout =>
        @result_cross
          stats: model.stats
          predicted: model.predicted
      , 100
    adapter.on "model:validation", ( model ) =>
      setTimeout =>
        @result_validation
          stats: model.stats
          predicted: model.predicted
      , 100

    adapter.on("data:transform", ( data ) =>
      setTimeout =>
        @data_fit(data.fit)
        if (@data_cross() && data.cross)
          @data_cross(data.cross)
        if (@data_validation() && data.validation)
          @data_validation(data.validation)
        @transformLog(undefined)
        @transformDelete(undefined)
        @kOrderTransform(undefined)
        @transformStandardize(undefined)
        @transformRescale(undefined)
        adapter.subscribeToChanges()
      , 100
    )

    # Need to do transformation here because need to wait for model to have updated data and fire back to UI
    # that setting data completed
    # Once completed, can get all the transformation done already on fit data and do on the cross/validation data
    adapter.on('propogateTransform', ( data ) =>
      setTimeout =>
        label = data.data_label
        data_labels = undefined
        if label == "cross"
          data_labels = [CROSS_LABEL]
        else if label == "validation"
          data_labels = [VALIDATION_LABEL]
        transformColumns = @transform_columns()
        columns = @columns()
        # Iterate through each transform column from left to right
        Object.entries(transformColumns)
          .sort(
            (curr, next) ->
              if curr[1] < next[1]
                -1
              else if curr[1] > next[1]
                1
              else 0
          )
          .forEach((transform_col) =>
            if transform_col[0] != undefined && transform_col[1] != undefined
              index = Number(transform_col[0])
              col = columns[transform_col[1]]
              transform_label = col.label
              if transform_label == Transformation.LOG
                @transformLog({
                  index: index,
                  labels: data_labels
                })
              else if transform_label == Transformation.K_ORDER_DIFFERENCE
                @kOrderTransform({
                  index: index,
                  labels: data_labels,
                  k: col.k
                })
              else if transform_label == Transformation.STANDARDIZE
                @transformStandardize({
                  index: index,
                  labels: data_labels,
                })
              else if transform_label == Transformation.RESCALE
                @transformRescale({
                  index: index,
                  labels: data_labels,
                })
          )
      , 100
    )

    adapter.on "model:getSensitivity", (data) =>
      setTimeout =>
        columns = ko.unwrap @columns
        sensitivityColumns = ko.unwrap @sensitivityColumns
        sensitivityData = ko.unwrap @sensitivityData

        # Check if column already exists
        colExists = false
        sensitivityColumns.forEach((col) =>
          if col.index == data.index
            colExists = true
        )

        if colExists == false
          column = columns[data.index]
          sensitivityColumns.push(column)
          sensitivityData.push(data.sensitivity)

          @sensitivityColumns(sensitivityColumns)
          @sensitivityData(sensitivityData)
      , 100
      adapter.subscribeToChanges()

    adapter.on "model:deleteSensitivity", (data) =>
      setTimeout =>
        sensitivityColumns = ko.unwrap @sensitivityColumns
        sensitivityData = ko.unwrap @sensitivityData

        sensitivityColumns.splice(data.index, 1);
        sensitivityData.splice(data.index, 1);

        @sensitivityColumns(sensitivityColumns)
        @sensitivityData(sensitivityData)
      , 100
      adapter.subscribeToChanges()

    adapter.on "model:updateSensitivity", (data) =>
      setTimeout =>
        columns = ko.unwrap @columns
        sensitivityColumns = ko.unwrap @sensitivityColumns
        sensitivityData = ko.unwrap @sensitivityData

        # Find the column and replace it
        sensitivityColumns.forEach((col, i) =>
          if col.index == data.index
            sensitivityColumns[i] = columns[data.index]
            sensitivityData[i] = data.sensitivity
        )

        @sensitivityColumns(sensitivityColumns)
        @sensitivityData(sensitivityData)
      , 100
      adapter.subscribeToChanges()

    adapter.on "model:getConfidence", (data) =>
      setTimeout =>
        columns = ko.unwrap @columns
        confidenceColumns = ko.unwrap @confidenceColumns
        confidenceData = ko.unwrap @confidenceData

        # Check if column already exists
        colExists = false
        confidenceColumns.forEach((col) =>
          if col.index == data.index
            colExists = true
        )

        if colExists == false
          column = columns[0] # Weird hack to stop errors showing up but it works
          confidenceColumns.push(column)
          confidenceData.push(data.confidence)
          @confidenceColumns(confidenceColumns)
          @confidenceData(confidenceData)
      , 100
      adapter.subscribeToChanges()

    adapter.on "model:deleteConfidence", (data) =>
      setTimeout =>
        confidenceColumns = ko.unwrap @confidenceColumns
        confidenceData = ko.unwrap @confidenceData

        confidenceColumns.splice(data.index, 1);
        confidenceData.splice(data.index, 1);

        @confidenceColumns(confidenceColumns)
        @confidenceData(confidenceData)
      , 100
      adapter.subscribeToChanges()

    adapter.on "model:updateConfidence", (data) =>
      setTimeout =>
        columns = ko.unwrap @columns
        confidenceColumns = ko.unwrap @confidenceColumns
        confidenceData = ko.unwrap @confidenceData

        # Find the column and replace it
        confidenceColumns.forEach((col, i) =>
          if col.index == data.index
            confidenceColumns[i] = columns[data.index]
            confidenceData[i] = data.confidence
        )

        @confidenceColumns(confidenceColumns)
        @confidenceData(confidenceData)
      , 100
      adapter.subscribeToChanges()

    adapter.on "model:getPrediction", (data) =>
      setTimeout =>
        columns = ko.unwrap @columns
        predictionColumns = ko.unwrap @predictionColumns
        predictionData = ko.unwrap @predictionData

        # Check if column already exists
        colExists = false
        predictionColumns.forEach((col) =>
          if col.index == data.index
            colExists = true
        )

        if colExists == false
          column = columns[0] # Weird hack to stop errors showing up but it works
          predictionColumns.push(column)
          predictionData.push(data.prediction)
          @predictionColumns(predictionColumns)
          @predictionData(predictionData)
      , 100
      adapter.subscribeToChanges()

    adapter.on "model:deletePrediction", (data) =>
      setTimeout =>
        predictionColumns = ko.unwrap @predictionColumns
        predictionData = ko.unwrap @predictionData

        predictionColumns.splice(data.index, 1);
        predictionData.splice(data.index, 1);

        @predictionColumns(predictionColumns)
        @predictionData(predictionData)
      , 100
      adapter.subscribeToChanges()

    adapter.on "model:updatePrediction", (data) =>
      setTimeout =>
        columns = ko.unwrap @columns
        predictionColumns = ko.unwrap @predictionColumns
        predictionData = ko.unwrap @predictionData

        # Find the column and replace it
        predictionColumns.forEach((col, i) =>
          if col.index == data.index
            predictionColumns[i] = columns[data.index]
            predictionData[i] = data.prediction
        )

        @predictionColumns(predictionColumns)
        @predictionData(predictionData)
      , 100
      adapter.subscribeToChanges()

    adapter.on "model:getImportanceRatio", (data) =>
      setTimeout =>
        columns = ko.unwrap @columns
        importanceRatioColumns = ko.unwrap @importanceRatioColumns
        importanceRatioData = ko.unwrap @importanceRatioData

        # Check if column already exists
        colExists = false
        importanceRatioColumns.forEach((col) =>
          if col.index == data.index
            colExists = true
        )

        if colExists == false
          column = columns[data.index]
          importanceRatioColumns.push(column)
          importanceRatioData.push(data.importanceRatio)

          @importanceRatioColumns(importanceRatioColumns)
          @importanceRatioData(importanceRatioData)
      , 100
      adapter.subscribeToChanges()

    adapter.on "model:deleteImportanceRatio", (data) =>
      setTimeout =>
        importanceRatioColumns = ko.unwrap @importanceRatioColumns
        importanceRatioData = ko.unwrap @importanceRatioData

        importanceRatioColumns.splice(data.index, 1);
        importanceRatioData.splice(data.index, 1);

        @importanceRatioColumns(importanceRatioColumns)
        @importanceRatioData(importanceRatioData)
      , 100
      adapter.subscribeToChanges()

    adapter.on "model:updateImportanceRatio", (data) =>
      setTimeout =>
        columns = ko.unwrap @columns
        importanceRatioColumns = ko.unwrap @importanceRatioColumns
        importanceRatioData = ko.unwrap @importanceRatioData

        # Find the column and replace it
        importanceRatioColumns.forEach((col, i) =>
          if col.index == data.index
            importanceRatioColumns[i] = columns[data.index]
            importanceRatioData[i] = data.importanceRatio
        )

        @importanceRatioColumns(importanceRatioColumns)
        @importanceRatioData(importanceRatioData)
      , 100
      adapter.subscribeToChanges()

    adapter.on "progress.start", ( { curr, total } ) =>
      @progress 0.01
    adapter.on "progress", ( { curr, total } ) =>
      @progress Math.max(100 * curr / total, 0.01)
    adapter.on "progress.end", ( ) =>
      @progress 100

  cross_or_fit: () ->
    if this.result_cross()
      return this.result_cross()
    return this.result_fit()

  out: ( ) ->
    result = { }
    for k, v of utils.clone(CTRL)
      if v = v[2] @[k]
        result[k] = v
    return JSON.stringify(result)
