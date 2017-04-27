
require "./index.styl"

SORT =
  "*"  : ( ) -> -1,
  "|>|": ( stat, a, b ) -> (Math.abs a.stats[stat]) - (Math.abs b.stats[stat])
  "|<|": ( stat, a, b ) -> (Math.abs b.stats[stat]) - (Math.abs a.stats[stat])
  ">"  : ( stat, a, b ) -> a.stats[stat] - b.stats[stat]
  "<"  : ( stat, a, b ) -> b.stats[stat] - a.stats[stat]

sortBy = ( stat ) -> SORT[stat?.sort ? "*"].bind null, stat?.id

ko.components.register "tf-candidates",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.model
      throw new TypeError "components/candidates:
      expects [model] to be observable"

    readjust = ( ) =>
      setTimeout =>
        @result.maxWidth 60 + document.querySelector(
          ".candidate-wrapper > .candidates").clientWidth

    model = params.model() # now static

    @result = ko.observableArray [ ]
    @result.subscribe readjust

    @candidates = model.candidates
    @source = ko.observableArray [ ]

    @sort = ko.observable SORT["*"]
    @sort.subscribe ( method ) =>
      @source @candidates().sort method

    @candidates.subscribe ( next ) =>
      @source next.sort @sort()

    @result.maxWidth = ko.observable 0
    @result.maxWidth.subscribe ( next ) ->
      document.querySelector(".split-model > .split-data > .candidates")
        .style.maxWidth = next + "px"
      document.querySelector(".split-model > .split-data > .model")
        .style.minWidth = "calc(100% - #{next}px)"

    @sortby = ( stat ) =>
      console.log "SORT", stat
      @sort sortBy stat

    # Whenever a statistic is discovered, subscribe to when it is selected
    allstats.subscribe ( changes ) =>
      for { value } in changes
        value.selected.subscribe readjust
        value.selected.subscribe ( ) =>
          stats = allstats().filter ( stat ) -> stat.selected()
          # @sort (sortBy stats[stats.length - 1])
    , null, "arrayChange"

    return this
