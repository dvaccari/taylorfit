
require "./index.styl"

ko.components.register "tf-app",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    return this

