
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

    @timeseries = model.timeseries
    @psig = model.psig

    @result = ko.observableArray [ ]
    @result.subscribe readjust

    @candidates = model.candidates
    @source = ko.observableArray [ ]

    @sort = ko.observable SORT["*"]
    @sort.subscribe ( method ) =>
      @source @candidates().sort method

    @candidates.subscribe ( next ) =>
      @source next.sort @sort()

    @getStat = ( id ) =>
      cross = model.result_cross() && model.result_cross().stats[id]
      fit = model.result_fit() && model.result_fit().stats[id]
      return parseFloat(cross) || parseFloat(fit)

    @result.maxWidth = ko.observable 0
    @result.maxWidth.subscribe ( next ) ->
      document.querySelector(".split-model > .split-data > .candidates-pane")
        .style.maxWidth = next + "px"
      document.querySelector(".split-model > .split-data > .candidates-pane .wrapper")
        .style.width = (next - 40) + "px"
      document.querySelector(".split-model > .split-data > .model-pane")
        .style.minWidth = "calc(100% - #{next}px)"

    @sortby = ( stat ) =>
      for s in allstats()
        s.sorting false
      stat.sorting true
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
