
require "./index.styl"

STATE =
  EMPTY: "empty"
  TERMS: "terms"
  MODEL: "model"

ko.components.register "tf-content",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.model
      throw new TypeError "components/content:
      expects [model] to be observable"

    @model = params.model

    return this

