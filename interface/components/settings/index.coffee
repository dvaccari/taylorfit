
require "./index.styl"

download = ( name, type, content ) ->
  a = document.createElement "a"
  a.href = URL.createObjectURL \
    new Blob [ content ], { type }
  a.download = name

  document.body.appendChild a
  a.click()

  URL.revokeObjectURL a.href
  document.body.removeChild a

ko.components.register "tf-settings",
  template: do require "./index.pug"
  viewModel: ( params ) ->

    unless ko.isObservable params.model
      throw new TypeError "components/options:
      expects [model] to be observable"

    model = params.model() # now static

    update_multiplicands_max = ( next ) ->
      active = 0
      zero = false
      for key, value of @lags() when ko.unwrap value
        active++
        zero = true if key is "0"
      unless @timeseries() and active
        @multiplicands_max @ncols - 1
      else
        unless zero
          @multiplicands_max @ncols * active
        else
          @multiplicands_max (@ncols - 1) * active + active - 1
      unless @multiplicands() <= @multiplicands_max()
        @multiplicands @multiplicands_max()

    @active = model.show_settings
    @stats = model.stats
    @exponents = model.exponents
    @multiplicands = model.multiplicands
    @lags = model.lags
    @timeseries = model.timeseries
    @candidates = model.candidates
    @multiplicands_max = model.multiplicands_max
    @ncols = model.fit().cols().length

    @lags.subscribe update_multiplicands_max, this
    @timeseries.subscribe update_multiplicands_max, this

    @timeseries.subscribe ( next ) =>
      @lags { } unless next

    @active.subscribe ( next ) ->
      if next then adapter.unsubscribeToChanges()
      else adapter.subscribeToChanges()

    @download_model = ( ) ->
      model = params.model()
      download (model.id() or "model") + ".tf",
        "application/json", model.toJSON()

    @clear_project = ( ) ->
      params.model null

    @clear_model = ( ) ->
      params.model().result null
      adapter.clear()

    return this

