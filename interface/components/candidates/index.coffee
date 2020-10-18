
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
    unless ko.isObservable(params.model)
      throw new TypeError "components/candidates:
      expects [model] to be observable"

    readjust = ( ) =>
      setTimeout =>
        @result.maxWidth 65 + document.querySelector(
          ".candidate-wrapper > .candidates").clientWidth
	
	# Can safely be delayed
    if performance.navigation.type != performance.navigation.TYPE_RELOAD
      setTimeout(global.send_incoming_stats, 1000)

    model = params.model() # now static
    hiddenColumns = model.hiddenColumns
    transform_columns = model.transform_columns

    @current_page = ko.observable(null)

    @timeseries = model.timeseries
    @psig = model.psig

    @result = ko.observableArray [ ]
    @result.subscribe readjust

    @candidates = model.candidates
    @source = ko.observableArray [ ]

    @sort = ko.observable SORT["*"]
    @sort.subscribe ( method ) =>
      @source(@candidates().filter((c) => !isHiddenColumn(c.term)).sort(method))

    @candidates.subscribe ( next ) =>
      @source(next.sort(@sort()).filter((c) => !isHiddenColumn(c.term)))

    # When hidden columns change in CTRL, subscribe and change visible candidates
    hiddenColumns.subscribe ( next ) =>
      @source(@candidates().sort(@sort()).filter((c) => !isHiddenColumn(c.term)))
    
    transform_columns.subscribe ( next ) =>
      @source(@candidates().sort(@sort()).filter((c) -> !isHiddenColumn(c.term)))

    @getStat = ( id ) =>
      return parseFloat(model.cross_or_fit().stats[id])

    @result.maxWidth = ko.observable 0
    @result.maxWidth.subscribe ( next ) ->
      if next <= 65
        readjust()
      document.querySelector(".split-model > .split-data > .candidates-pane")
        .style.maxWidth = next + "px"
      document.querySelector(".split-model > .split-data > .candidates-pane .wrapper")
        .style.width = (next - 40) + "px"
      document.querySelector(".split-model > .split-data > .model-pane")
        .style.minWidth = "calc(100% - #{next}px)"

    # See if that term index is in hiddenColumns or transform_columns
    isHiddenColumn = ( terms ) ->
      cols = hiddenColumns()
      transform_cols = transform_columns()
      return terms.find((t) ->
        cols[t.index] ||
        transform_cols[t.index]
      )

    @sortby = ( stat ) =>
      for s in allstats()
        s.sorting false
      stat.sorting true
      @sort sortBy stat

    # Whenever a statistic is discovered, subscribe to when it is selected
    allstats.subscribe ( changes ) =>
      for { value } in changes
        if @sort() == SORT["*"] && value.id == "t"
            @sortby(value)
        value.selected.subscribe readjust
        value.selected.subscribe ( ) =>
          stats = allstats().filter ( stat ) -> stat.selected()
          # @sort (sortBy stats[stats.length - 1])
    , null, "arrayChange"

    @updateSensitivity = () ->
      for column in model.sensitivityColumns()
        model.update_sensitivity(column.index)

    @updateImportanceRatio = () ->
      for column in model.importanceRatioColumns()
        model.update_importanceRatio(column.index)

    return this
