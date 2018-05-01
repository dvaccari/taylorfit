
require "./index.styl"
Model = require "../Model"

Papa = require "papaparse"

Array::fill ?= ( value ) ->
  this[i] = value for i of this

read_csv = ( file ) ->
  new Promise ( accept, reject ) ->
    Papa.parse file,
      dynamicTyping: true
      complete: ( { errors, data:rows } ) ->
        if errors.length
          reject errors
        else
          rows.pop() # remove \n

          cols = rows[0].every ( value ) ->
            typeof value is "string"
          if cols then cols = rows.shift()
          else cols = new Array(rows[0].length).fill ""
          cols = cols.map ( name, index ) -> { name, index }

          name = file.name
          accept { name, rows, cols }


read_model = ( file ) ->
  new Promise ( accept, reject ) ->
    reader = new FileReader
    reader.onload = ( e ) ->
      accept JSON.parse e.target.result
    reader.readAsText file

ko.components.register "tf-loader",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.model
      throw new TypeError "components/loader:
      expects [model] to be observable"
    unless params.table?
      throw new TypeError "components/loader:
      expects [table] to exist"

    @init = params.init
    @table = params.table

    @load_dataset = (dataset) =>
      params.model new Model require("interface/demo-data/#{dataset}")

    @id = "input-#{@table}-dataset"

    # --- for loading just dataset
    @dataset = ko.observable null
    @dataset.subscribe ( next ) =>
      read_csv document.getElementById(@id).files[0]
      .then ( model ) =>
        if @init
          params.model new Model
            "data_#{@table}": model.rows
            name: model.name
            columns: model.cols
        else
          m = params.model()
          # TODO: check for column length
          m["data_#{@table}"] model.rows
          m["name_#{@table}"] = model.name

    # --- for loading entire model
    if @init
      @model = ko.observable null
      @model.subscribe ( next ) ->
        read_model document.getElementById("input-model").files[0]
        .then ( model ) -> params.model new Model model

    return this
