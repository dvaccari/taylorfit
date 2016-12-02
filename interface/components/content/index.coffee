
require "./index.styl"

ko.components.register "tf-content",
  template: do require "./index.pug"
  viewModel: ( params ) ->

    @multiplicands = ko.observable
      1: false
    @exponents = ko.observable
      "-1": false
      0: false
      1: false

    return this

