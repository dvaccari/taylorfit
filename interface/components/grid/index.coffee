
require "./index.styl"
Papa = require "papaparse"

read = ( file ) ->
  new Promise ( accept, reject ) ->
    Papa.parse file,
      dynamicTyping: true
      complete: ( { errors, data } ) ->
        if errors.length
          reject errors
        else
          data.pop() # remove \n
          data.name = file.name
          data.headless = not data[0].every ( value ) ->
            (typeof value is "string")# and (value isnt "")
          accept data

write = ( table ) ->
  Papa.unparse table

once = false
once_guard = ( ) ->
  return true if once
  once = true
  setTimeout -> once = false
  return false

ko.components.register "tf-grid",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.model
      throw new TypeError "components/grid:
      expects [model] to be observable"

    unless params.table?
      throw new TypeError "components/grid:
      expects [table] to exist"

    @name = params.name
    @table = params.table
    @result = ko.observableArray [ ]
    @start = ko.observable 0

    model = params.model() # now static
    @dependent  = model.dependent
    @cols       = model[@table]().cols
    @rows       = model[@table]().rows

    return this

