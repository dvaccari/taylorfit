
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

  progress:
    [ 0           , WRAP_O                            , IGNORE ]
  show_settings:
    [ false       , WRAP_O                            , IGNORE ]

  columns:
    [ [ ]         , WRAP_A                            , UNWRAP ]
  data_fit:
    [ undefined   , DATA("fit")                       , UNWRAP ]
  data_cross:
    [ undefined   , DATA("cross")                     , UNWRAP ]
  data_valid:
    [ undefined   , DATA("validation")                , UNWRAP ]

  candidates:
    [ [ ]         , WRAP_A                            , IGNORE ]

  result_fit:
    [ undefined   , WRAP_O                            , UNWRAP ]
  result_cross:
    [ undefined   , WRAP_O                            , IGNORE ]
  result_valid:
    [ undefined   , WRAP_O                            , IGNORE ]

  dependent:
    [ 0           , SEND("setDependent", Number)      , UNWRAP ]
  multiplicands:
    [ 1           , SEND("setMultiplicands", Number)  , UNWRAP ]

  exponents:
    [ 1: true     , SEND("setExponents", object2array), UNWRAP_O ]
  timeseries:
    [ false       , WRAP_O                            , UNWRAP ]
  lags:
    [ 0: true     , SEND("setLags"     , object2array), UNWRAP_O ]


module.exports = class Model

  constructor: ( o ) ->

    console.debug "model/input", o

    adapter.unsubscribeToChanges()

    for k, v of CTRL
      @[k] = v[1] if o.hasOwnProperty k
      then o[k] else v[0]

    result = ko.unwrap @result_fit
    if result?.terms?
      for { term } in result.terms
        adapter.addTerm term.map ({ index, exp, lag }) ->
          [index, exp, lag]

    adapter.subscribeToChanges()

    for type in [ "fit", "cross", "valid" ]
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
      terms.map ( t ) =>
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
        @result_valid
          stats: model.stats
          predicted: model.predicted
      , 100

    adapter.on "progress", ( { curr, total } ) =>
      @progress 100 * curr / total
    adapter.on "progress.end", ( ) =>
      @progress 100

  out: ( ) ->
    result = { }
    for k, v of CTRL
      if v = v[2] @[k]
        result[k] = v
    return result
