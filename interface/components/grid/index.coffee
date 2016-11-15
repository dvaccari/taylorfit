
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
          data.headless = not data[0].some ( value ) ->
            typeof value isnt "string" or value is ""
          accept data

write = ( table ) ->
  Papa.unparse table

ko.components.register "tf-grid",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    @cols = ko.observableArray [
      name: ko.observable ""
    ]
    @rows = ko.observableArray [
      ko.observableArray [
        ko.observable undefined
      ]
    ]

    @cols.add = ( ) =>
      @cols.insert @cols().length
    @cols.remove = ( index ) =>
      @cols.splice index, 1
      for row in @rows()
        row.splice index, 1
    @cols.insert = ( index ) =>
      @cols.splice index, 0, name: ko.observable ""
      for row in @rows()
        row.splice index, 0, ko.observable undefined
    @rows.add = ( ) =>
      @rows.insert @rows().length
    @rows.remove = ( index ) =>
      @rows.splice index, 1
    @rows.insert = ( index ) =>
      @rows.splice index, 0, row = ko.observableArray [ ]
      for col in @cols()
        row.push ko.observable undefined

    @load = ( table ) =>
      @cols.removeAll()
      @rows.removeAll()
      unless table.headless
        for title in table.shift()
          @cols.push name: ko.observable title
      else
        for title in table[0]
          @cols.push name: ko.observable ""
      for row in table
        @rows.push r = ko.observableArray [ ]
        for col in row
          r.push ko.observable col

    @save = ( ) =>
      data = ko.toJS @rows
      cols = ko.toJS @cols
      data.unshift cols.map ( v ) -> v.name

      csv = write data

      a = document.createElement "a"
      a.href = URL.createObjectURL new Blob [csv], type: "text/csv"
      a.download = "data.csv"

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


    return this

