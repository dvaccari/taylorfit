
require "./index.styl"

ko.components.register "tf-options",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.model
      throw new TypeError "components/options:
      expects [model] to be observable"

    model = params.model() # now static

    @exponents = model.exponents
    @multiplicands = model.multiplicands
    @candidates = model.candidates

    @candidate_click = ( ) ->
      this.selected true
      console.log this, arguments

    return this
