
Papa = require "papaparse"

module.exports = class Model

  DEFAULTS =
    id: "model"
    name: "New Model"
    cols: [ ]
    rows: [ ]
    dependent: 0
    multiplicands: 1
    exponents: 1: true
    candidates: [ ]

  constructor: ( options ) ->
    for key, value of DEFAULTS
      value = options[key] or value
      value = if value instanceof Array
      then ko.observableArray value
      else ko.observable value
      Object.defineProperty this, key,
        { value, enumerable: true }

    exponents2array = ( exps ) ->
      Number key for key, value of exps \
      when ko.unwrap value

    @rows.subscribe init = ( next ) =>
      return unless next.length
      adapter.post_dataset next,
        @dependent(), @multiplicands(),
        exponents2array @exponents()
    if @rows().length then init @rows()
    @dependent.subscribe ( next ) =>
      return unless @rows().length
      adapter.post_dependent Number next
    @multiplicands.subscribe ( next ) ->
      adapter.post_multiplicands Number next
    @exponents.subscribe ( next ) ->
      adapter.post_exponents exponents2array next

    adapter.on "candidates", ( candidates ) =>
      cols = @cols()
      candidates.forEach ( c ) ->
        return if c.processed
        c.stats = ({name, value} \
          for name, value of c.stats)

        c.term = c.term.map ( term ) ->
          name: cols[term[0]]?.name
          index: term[0]
          exp: term[1]
        c.processed = true
      @candidates candidates.sort ( a, b ) ->
        b.stats[0].value - a.stats[0].value

  toJSON: ( ) ->
    shallow = { }
    for own key, value of this
      shallow[key] = value
    delete shallow.candidates
    ko.toJSON shallow

  toJS: ( ) ->
    ko.toJS this

  toCSV: ( ) ->
    data = @rows()
    data.unshift _.map @cols(), "name"
    Papa.unparse data

