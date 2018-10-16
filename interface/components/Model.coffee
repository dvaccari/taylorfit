utils = require('../../engine/utils');

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
    return unless next?.length
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
  show_export_code:
    [ undefined    , WRAP_O                           , IGNORE ]
  show_autocorrelation:
    [ undefined    , WRAP_O                           , IGNORE ]
  show_xyplot:
    [ undefined    , WRAP_O                           , IGNORE ]
  show_transform:
    [ undefined    , WRAP_O                           , IGNORE ]

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
  transform_log:
    [ undefined   , SEND("transformLog", Number)      , UNWRAP_O ]

module.exports = class Model

  constructor: ( o ) ->

    console.debug "model/input", o

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
      # filter out terms that couldn't get a coefficient calculated
      terms.filter((t) => t.coeff).map (t) =>
        return t if t.selected?
        result =
          selected: ko.observable false
          stats: t.stats
          # TODO, remove hack
          coeff: t.coeff or t.stats.coeff
          term: t.term.map ( term ) ->
            name: cols[term[0]]?.name
            index: term[0]
            exp: term[1]
            lag: term[2]
        result.selected.subscribe ( ) ->
          adapter["#{fn}Term"] t.term
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
