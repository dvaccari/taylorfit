
require "./index.styl"

ko.components.register "tf-content",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    @pane1 = ko.observable 80
    @pane1drag = ( model, event ) =>
      console.log event.target
      if event.clientX
        @pane1 event.clientX

    last = null
    @hover = ( where ) =>
      if where isnt last
        if where is "grid"
          @pane1 80
        else
          @pane1 20
        last = where

    @candidates = ko.observable [ ]
    adapter.on "candidates", ( candidates ) =>
      cols = @cols()
      candidates.forEach ( c ) =>
        c.stats = ({name, value} \
          for name, value of c.stats)

        c.term = c.term.map ( term ) =>
          name: cols[term[0]].name
          index: term[0]
          exp: term[1]
          lag: term[2]

      @candidates candidates.sort ( a, b ) ->
        a.stats[0].value - b.stats[0].value


    @multiplicands = ko.observable 1
    @exponents = ko.observable
      1: true
    @loaded = ko.observable false
    @dependent = ko.observable 0
    @rows = ko.observableArray [ ]
    @cols = ko.observableArray [ ]

    exponents2array = ( exps ) ->
      Number key for key, value of exps when ko.unwrap value

    @rows.subscribe ( next ) =>
      return unless next.length
      adapter.post_dataset next,
        @dependent(), @multiplicands(),
        exponents2array @exponents()
    @dependent.subscribe ( next ) =>
      return unless @rows().length
      adapter.post_dependent Number next
    @multiplicands.subscribe ( next ) ->
      adapter.post_multiplicands Number next
    @exponents.subscribe ( next ) ->
      adapter.post_exponents exponents2array next

    return this

