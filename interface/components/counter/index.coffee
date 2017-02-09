

require "./index.styl"

ko.components.register "tf-counter",
  template: do require "./index.pug"
  viewModel: ( params ) ->

    # ensure values is an observable with
    # keys mapped to observables
    unless ko.isObservable params.values
      if params.values instanceof Array
        init = { }
        for value in params.values
          init[value] = false
      else init = params.values
      @values = ko.observable init
    else @values = params.values

    @name  = params.name

    @increment = ( name ) =>
      unless @values() is 9
        @values @values() + 1

    @decrement = ( name ) =>
      unless @values() is 1 
        @values @values() - 1

    return this

