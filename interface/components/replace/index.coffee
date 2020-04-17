
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

ko.components.register "tf-replace",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.model
      throw new TypeError "components/replace:
      expects [model] to be observable"
    unless params.table?
      throw new TypeError "components/replace:
      expects [table] to exist"

    @init = params.init
    @table = params.table

    @load_dataset = (dataset) ->
      params.model new Model require("interface/demo-data/#{dataset}")

    @id = "input-#{@table}-dataset"

    # --- for loading just dataset
    @dataset = ko.observable null
    @show_partition = ko.observable undefined
    @show_fit_partition = ko.observable undefined
    @show_cross_partition = ko.observable undefined
    #@show_validate_partition = ko.observable undefined
    @temp_model = ko.observable undefined
    @dataset.subscribe ( next ) =>
      # Importing CSV file
      read_csv document.getElementById(@id).files[0]
      # Completed parsing CSV to build model
      .then ( model ) =>
        if @init # Importing data
          @temp_model(model)
          @show_partition(true)
          # params.model new Model
          #   "data_#{@table}": model.rows
          #   name: model.name
          #   columns: model.cols
        else if ( @table == 'fit')
          @temp_model(model)
          @show_fit_partition(true)
        else if ( @table == 'cross')
          @temp_model(model)
          @show_cross_partition(true)
        else
          m = params.model()
          # TODO: check for column length
          m["data_#{@table}"] model.rows
          m["name_#{@table}"] = model.name

    @import_fit_partition = (
      fit_row_start,
      fit_row_end,
    ) ->
      model = @temp_model()
      data_fit = if fit_row_start != 0
      then model.rows[fit_row_start - 1..fit_row_end - 1]
      else undefined
      m = params.model()
      m["data_fit"] data_fit
      m["name_fit"] = model.name
    
    @import_cross_partition = (
      cross_row_start,
      cross_row_end,
    ) ->
      model = @temp_model()
      data_cross = if cross_row_start != 0
      then model.rows[cross_row_start - 1..cross_row_end - 1]
      else undefined
      m = params.model()
      m["data_cross"] data_cross
      m["name_cross"] = model.name
    
     # --- Use from data partition modal
    @import_partition = (
      fit_row_start,
      fit_row_end,
      cross_row_start,
      cross_row_end,
      validate_row_start,
      validate_row_end,
    ) ->
      model = @temp_model()
      data_fit = if fit_row_start != 0
      then model.rows[fit_row_start - 1..fit_row_end - 1]
      else undefined

      data_cross = if cross_row_start != 0
      then model.rows[cross_row_start - 1..cross_row_end - 1]
      else undefined

      data_validate = if validate_row_start != 0
      then model.rows[validate_row_start - 1..validate_row_end - 1]
      else undefined

      params.model new Model
        data_fit: data_fit
        data_cross: data_cross
        data_validation: data_validate
        name: model.name
        columns: model.cols
      @show_partition(false)


    # --- for loading entire model
    if @init
      @model = ko.observable null
      @model.subscribe ( next ) ->
        read_model document.getElementById("input-model").files[0]
        .then ( model ) -> params.model new Model model

    return this
