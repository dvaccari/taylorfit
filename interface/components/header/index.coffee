
require "./index.styl"

ko.components.register "tf-header",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    return this


