
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
      # ORDER MATTERS
      for row in @rows()
        row.push ko.observable undefined
      @cols.push name: ko.observable ""
    @rows.add = ( ) =>
      @rows.push row = ko.observableArray [ ]
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
      console.log data

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

