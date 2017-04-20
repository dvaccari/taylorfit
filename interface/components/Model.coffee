
Papa = require "papaparse"

observable = ( item ) ->
  if item?.constructor is Object and item.rows
    for k, v of item
      item[k] = observable v
  if item instanceof Array
  then ko.observableArray item
  else ko.observable item

module.exports = class Model

  @transient: [ "candidates",
  "show_settings", "progress" ]

  DEFAULTS =
    id:             "model"
    name:           "New Model"
    fit:            null
    cross:          null
    validation:     null
    dependent:      0
    multiplicands:  1
    exponents:      1: true
    lags:           { }
    candidates:     [ ]
    result:         null # perhaps fit: null, test: null, validation: null ?
    show_settings:  false
    progress:       30

  constructor: ( options ) ->
    for key, value of DEFAULTS
      value = observable options[key] or value
      Object.defineProperty this, key,
        { value, enumerable: true }

    exponents2array = ( exps ) ->
      Number key for key, value of exps \
      when ko.unwrap value

    unless @fit()
      throw new Error "model: fit data not defined"

    @fit().rows.subscribe init = ( next ) =>
      return unless next.length
      adapter.setData next
    @dependent.subscribe ( next ) =>
      return unless @fit().rows().length
      adapter.setDependent Number next
    @multiplicands.subscribe ( next ) ->
      adapter.setMultiplicands Number next
    @exponents.subscribe ( next ) ->
      adapter.setExponents exponents2array next
    @lags.subscribe ( next ) ->
      adapter.setLags exponents2array next

    if @fit().rows().length
      # Don't compute candidates or the model right now
      adapter.unsubscribeToChanges()

      adapter.setData @fit().rows()
      adapter.setDependent @dependent()
      adapter.setMultiplicands @multiplicands()
      adapter.setExponents exponents2array @exponents()
      adapter.setLags exponents2array @lags()

      # Tell model which terms have been restored from localStorage
      result = @result()
      if result?.terms?
        for { term } in result.terms
          term = term.map ({ index, exp, lag }) -> [index, exp, lag]
          adapter.addTerm term

      # Subscribe, and also compute the model & candidates
      adapter.subscribeToChanges()

    mapper = ( terms, fn ) =>
      cols = ko.unwrap @fit().cols
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

    adapter.on "model", ( model ) =>
      if model.terms.length
        setTimeout =>
          console.log mapper model.terms, "remove"
          @result {
            terms: mapper model.terms, "remove"
            stats: model.stats
            predicted: model.predicted
            graphdata: model.graphdata
          }
        , 100

    adapter.on "model:test", ( model ) =>
      # handle test model

    adapter.on "model:validation", ( model ) =>
      # handle validation model

    adapter.on "progress", ( { curr, total } ) =>
      @progress 100 * curr / total
    adapter.on "progress.end", ( ) =>
      @progress 100

  toJSON: ( ) ->
    shallow = { }
    for own key, value of this
      shallow[key] = value
    for term in Model.transient
      delete shallow[term]
    ko.toJSON shallow

  toJS: ( ) ->
    ko.toJS this

  toCSV: ( ) ->
    data = @rows()
    data.unshift _.map @cols(), "name"
    Papa.unparse data

