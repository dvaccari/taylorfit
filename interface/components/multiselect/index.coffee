
require "./index.styl"

ko.components.register "tf-multiselect",
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

    @fixed = params.fixed or [ ]
    @valid = params.valid or ( ) -> true
    @invalid = ko.observable false
    @hide = ko.observable false
    @focus = ko.observable(false).extend({ rateLimit: 50 })

    @name  = params.name

    @input = ko.observable ""

    @update = ( name ) =>
      @values(@values())

    @toggle = ( name ) =>
      values = @values()
      unless name in @fixed
        values[name] = not values[name]
        @update name

    @delete = ( name ) =>
      values = @values()
      unless name in @fixed
        delete values[name]
        do @update

    @add = ( ) =>
      name = @input()

      unless @valid(name) and name != ""
        @invalid true
        return undefined
      @invalid false
      @hide false

      values = @values()
      values[name] = ko.observable true
      @update name

      @input ""

    @showinput = ( ) =>
      @hide true
      @focus true

    @hideinput = ( ) =>
      @hide false
      @focus false

    return this

