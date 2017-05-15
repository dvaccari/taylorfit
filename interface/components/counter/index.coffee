

require "./index.styl"

ko.components.register "tf-counter",
  template: do require "./index.pug"
  viewModel: ( params ) ->

    # ensure max is an observable with
    # a number greater than 0
    max = params.max or 1
    unless ko.isObservable max
      max = ko.observable max
    unless "number" is typeof max()
      max Number max()
    unless 0 < max()
      max 1

    # ensure value is an observable with
    # a number greater than 1, less than max
    value = params.value or 1
    unless ko.isObservable value
      value = ko.observable value
    unless "number" is typeof value()
      value Number value()
    unless 0 < value()
      value 1
    unless value() <= max()
      value max()

    @name = params.name or "Counter"
    @value = value

    @upperlimit = ko.observable value() is max()
    @lowerlimit = ko.observable value() is 1

    ko.computed ( ) =>
      @upperlimit value() is max()


    @increment = ( ) ->
      unless @upperlimit()
        value value() + 1
        if @lowerlimit()
          @lowerlimit false
        if value() >= max()
          @upperlimit true

    @decrement = ( ) ->
      unless @lowerlimit()
        value value() - 1
        if @upperlimit()
          @upperlimit false
        if value() <= 1
          @lowerlimit true

    return this

