
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
    @location   = ko.observable 0
    @pagesize   = ko.observable 10

    unless ko.isObservable params.model
      throw new TypeError "components/grid:
      expects [model] to be observable"

    unless params.table?
      throw new TypeError "components/grid:
      expects [table] to exist"

    @table = params.table

    model = params.model() # now static
    @dependent  = model.dependent
    @cols       = model[@table]().cols
    @rows       = model[@table]().rows

    @scroll = ( model, event) ->
      if event.deltaY < 0
        if @location() > 0
          @location @location() - 1
      else if @location() < @rows().length - @pagesize()
        @location @location() + 1

    ###
    @cols.add = ( ) =>
      @cols.ins @cols().length
    ###
    ###
    @cols.del = ( index ) =>
      @cols.splice index, 1
      for row in data = @rows()
        row.splice index, 1
      @rows data
      undefined
    ###

    ###
    @cols.ins = ( index ) =>
      @cols.splice index, 0, name: ko.observable ""
      for row in @rows()
        row.splice index, 0, ko.observable undefined
    ###
    ###
    @rows.add = ( ) =>
      @rows.ins len = @rows().length
      @location len + 1 - @pagesize()
    ###
    ###
    @rows.del = ( index ) =>
      return if do once_guard
      @rows.splice index, 1
      undefined
    ###
    ###
    @rows.ins = ( index ) =>
      return if do once_guard
      @rows.splice index, 0, row = ko.observableArray [ ]
      for col in @cols()
        row.push ko.observable undefined
      if index is @location() + @pagesize()
        @location @location() + 1
    ###

    ###
    @load = ( table ) =>
      @dependent 0
      @name table.name
      @cols.removeAll()
      @rows.removeAll()
      unless table.headless
        @cols table.shift().map ( name ) -> { name }
      else
        @cols table[0].map ( ) -> { name: "" }
      @rows table

      @loaded true

    @save = ( ) =>
      data = ko.toJS @rows
      cols = ko.toJS @cols
      data.unshift cols.map ( v ) -> v.name

      csv = write data

      a = document.createElement "a"
      a.href = URL.createObjectURL new Blob [csv], type: "text/csv"
      a.download = @name()

      document.body.appendChild a
      a.click()

      URL.revokeObjectURL a.href
      document.body.removeChild a

    @csv_file = ko.observable undefined
    @csv_file.subscribe ( ) =>
      elem = document.getElementById "input-csv"
      read elem.files[0]
      .then @load
      .catch ( error ) ->
        console.log "ERROR", error
    ###

    return this

