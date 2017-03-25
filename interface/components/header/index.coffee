
require "./index.styl"

ko.components.register "tf-header",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.model
      throw new TypeError "components/header:
      expects [model] to be observable"

    @model = params.model

    @clear = ( ) ->
      params.model null
    @toggle_settings = ( ) ->
      params.model().show_settings not \
        params.model().show_settings()
      console.log params.model().show_settings()

    return this


