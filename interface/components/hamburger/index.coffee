
require "./index.styl"

ko.components.register "tf-hamburger",
  template: do require "./index.pug"
  viewModel: ( params ) ->

    unless ko.isObservable params.model
      throw new TypeError "components/options:
      expects [model] to be observable"

    model = params.model() # now static

    @inactive = ko.observable true
    @stats = model.stats
    @exponents = model.exponents
    @multiplicands = model.multiplicands
    @candidates = model.candidates

    @clicked = ( ) ->
      @inactive !@inactive()

    return this

