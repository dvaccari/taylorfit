
require "./index.styl"

SORT =
  "*"  : ( ) -> -1,
  "|>|": ( stat, a, b ) -> (Math.abs a.stats[stat]) - (Math.abs b.stats[stat])
  "|<|": ( stat, a, b ) -> (Math.abs b.stats[stat]) - (Math.abs a.stats[stat])
  ">"  : ( stat, a, b ) -> a.stats[stat] - b.stats[stat]
  "<"  : ( stat, a, b ) -> b.stats[stat] - a.stats[stat]

sortBy = ( stat ) ->
  return SORT[stat?.sort ? '*'].bind null, stat?.id

ko.components.register "tf-options",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.model
      throw new TypeError "components/options:
      expects [model] to be observable"

    readjust = ( ) =>
      setTimeout =>
        @candidates.maxWidth 60 + document.querySelector(
          ".candidate-wrapper > .candidates").clientWidth

    model = params.model() # now static

    @candidates = model.candidates

    @candidates.maxWidth = ko.observable 0
    @candidates.maxWidth.subscribe ( next ) ->
      document.querySelector(".split-model > .split-data > .options")
        .style.maxWidth = next + "px"
      document.querySelector(".split-model > .split-data > .model")
        .style.minWidth = "calc(100% - #{next}px)"

    @candidates.subscribe readjust

    @sort = ko.observable SORT['*']

    # Whenever a statistic is discovered, subscribe to when it is selected
    allstats.subscribe ( changes ) =>
      for { value } in changes
        value.selected.subscribe readjust
        value.selected.subscribe ( ) =>
          stats = allstats().filter ( stat ) -> stat.selected()
          @sort (sortBy stats[stats.length - 1])
    , null, "arrayChange"

    return this
