
require "./index.styl"

ko.components.register "tf-pills",
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

    for key, value of object = @values()
      unless ko.isObservable value
        object[key] = ko.observable value

    @valid = params.valid or ( ) -> true
    @invalid = ko.observable false

    @name  = params.name

    @style = params.style

    @input = ko.observable ""

    @update = ( name ) =>
      if name and "radio" is ko.unwrap @style
        values = @values()
        for key, value of values when key isnt name
          value false
      @values(@values())

    @toggle = ( name ) =>
      values = @values()
      unless name == "0"
        values[name] not values[name]()
        @update name

    @delete = ( name ) =>
      values = @values()
      unless name == "0"
        delete values[name]
        do @update

    @add = ( ) =>
      name = @input()

      unless @valid(name) and name != '0'
        return @invalid true
      @invalid false

      values = @values()
      values[name] = ko.observable true
      @update name

      @input ""

    return this

