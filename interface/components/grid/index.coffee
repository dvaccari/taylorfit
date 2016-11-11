
require "./index.styl"

read = ( file ) ->
  return new Promise ( accept, reject ) ->
    reader = new FileReader
    reader.readAsText file
    reader.onload = ( e ) ->
      csv = e.target.result
      lines = [ ]
      for line in csv.split /\r\n|\n/
        lines.push line.split ","
      accept lines
    reader.onerror = ( e ) ->
      reject e.target.error

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
      for title in table.shift()
        @cols.push name: ko.observable title
      for row in table
        @rows.push r = ko.observableArray [ ]
        for col in row
          r.push ko.observable col



    @csv_file = ko.observable undefined
    @csv_file.subscribe ( ) =>
      elem = document.getElementById "input-csv"

      read elem.files[0]
      .then @load
      .catch ( error ) ->
        console.log "ERROR", error


    return this

