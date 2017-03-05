
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

          name = _.startCase file.name.replace /.csv$/, ""

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

    # --- for loading just dataset
    @dataset = ko.observable null
    @dataset.subscribe ( next ) ->
      read_csv document.getElementById("input-dataset").files[0]
      .then ( model ) -> params.model new Model model

    # --- for loading entire model
    @model = ko.observable null
    @model.subscribe ( next ) ->
      read_model document.getElementById("input-model").files[0]
      .then ( model ) -> params.model new Model model

    return this

