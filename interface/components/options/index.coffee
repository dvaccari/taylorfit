
require "./index.styl"

ko.components.register "tf-options",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.model
      throw new TypeError "components/options:
      expects [model] to be observable"

    model = params.model() # now static

    @stats = model.stats
    @candidates = model.candidates

    return this
