
require "./index.styl"

ko.components.register "tf-hamburger",
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
    @candidates = model.candidates

    return this

