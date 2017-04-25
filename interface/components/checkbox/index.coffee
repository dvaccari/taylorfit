
require "./index.styl"

ko.components.register "tf-checkbox",
  template: do require "./index.pug"
  viewModel: ( params ) ->

    @name = params.name
    @value = params.value

    @toggle = ( ) =>
      @value not @value()

    return this
