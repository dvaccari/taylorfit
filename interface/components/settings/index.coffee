
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

    @active = model.show_settings
    @stats = model.stats
    @exponents = model.exponents
    @multiplicands = model.multiplicands
    @lags = model.lags
    @show_lags = model.show_lags
    @candidates = model.candidates
    @max_multiplicands = model.fit().cols().length - 1

    @subscribedToChanges = ko.observable true
    @subscribedToChanges.subscribe ( next ) ->
      if next then adapter.subscribeToChanges()
      else adapter.unsubscribeToChanges()

    @download_dataset = ( ) ->
      model = params.model()
      download (model.id() or "model") + ".csv",
        "type/csv", model.toCSV()

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

