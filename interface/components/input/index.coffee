
require "./index.styl"

ko.components.register "tf-input",
  template: do require "./index.pug"
  viewModel: ( params ) ->

    @name = params.name
    @value = params.value
    @type = params.type
    @decimals = params.decimals

    @change = ( ) ->
      if @type == "decimal" && @decimals
        @value parseInt(@value() * Math.pow(10, @decimals)) / Math.pow(10, @decimals)
        if isNaN @value()
          @value 0

    return this
