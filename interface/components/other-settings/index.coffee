
require "./index.styl"

ko.components.register "tf-other-settings",
  template: do require "./index.pug"
  viewModel: ( params ) ->

    @values = params.values
    @name  = params.name

    @toggle = ( [ name, setting ] ) =>
      setting(not setting())

    return this

