
require "./index.styl"
Transformation = require "../transform/label.json"

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
    @hidden = params.hidden
    @start = ko.observable 0
    @end = ko.observable 0
    @precision = ko.precision

    model       = params.model() # now static
    @dependent  = model.dependent
    @hiddenColumns = model.hiddenColumns
    @transform_columns = model.transform_columns
    @cols       = model.columns
    @name       = model["name_#{@table}"]
    @rows       = model["data_#{@table}"]
    @extra      = model["extra_#{@table}"]
    @result     = model["result_#{@table}"]

    @clear = ( ) =>
      try @rows null
      try @result null
      return undefined

    @histogram = ( index ) ->
      model.show_histogram(index)
      model.data_plotted(@table)

    @autocorrelation = ( index ) ->
      model.show_autocorrelation(index)
      model.data_plotted(@table)

    @xyplot = ( index ) ->
      model.show_xyplot([index, "Index"])
      model.data_plotted(@table)
    
    # Is hidden if ignored or has transformed column
    @isHidden = ( index ) ->
      return (@hiddenColumns().hasOwnProperty(index) &&
        @hiddenColumns()[index]) ||
        @transform_columns()[index]
    
    @canDeleteTransformColumn = ( index ) ->
      transformColumns = Object.values(@transform_columns())
      # The index must be a value in transform_columns. It is a transformation of the key
      # And the index must not be a key in transform_columns where value is not undefined.
      # If the value for index key is not undefined, means it has another transform column is dependent on it
      return transformColumns.includes(index) &&
        !@transform_columns()[index] &&
        @result() &&
        !@result().terms.find((term) ->
          term.term.find((t) -> t.index == index)
        )

    @deleteTransformColumn = ( index ) ->
      curr_transform_cols = @transform_columns()
      values = Object.keys(curr_transform_cols)
      values.forEach((v) ->
        if curr_transform_cols[v] == index
          curr_transform_cols[v] = undefined
        else if curr_transform_cols[v] > index
          curr_transform_cols[v] = curr_transform_cols[v] - 1
      )
      curr_transform_cols[index] = undefined
      model.transform_columns(curr_transform_cols)
      # Delete index from columns and data
      cols = @cols()
      cols.splice(index, 1)
      model.columns(cols)
      model.transformDelete({ index: index })

    @showHideColumn = ( shouldHide, index ) ->
      oldCols = @hiddenColumns()
      oldCols[index] = shouldHide
      model.hiddenColumns(oldCols)

    @showTransformColumn = ( index ) ->
      model.show_transform(index)

    @save = ( ) =>
      cols = @cols(); rows = @rows(); extra = @extra()
      csv = @cols().map(( v ) -> v.name).join ","
      if extra
        csv += ",Dependent,Predicted,Residual"
      for row, index in rows
        csv += "\n" + row.join ","
        if extra then csv += "," + extra[index].join ","

      blob = new Blob [ csv ]
      uri = URL.createObjectURL blob
      link = document.createElement "a"
      link.setAttribute "href", uri
      link.setAttribute "download", "data.csv"
      document.body.appendChild link

      link.click()
      document.body.removeChild link

      return undefined

    @round_cell = ( data ) ->
      if !isNaN(data)
        decimals = @precision()
        +data.toFixed(decimals)
      else
        data

    @cols.subscribe ( next ) =>
      if next then adapter.unsubscribeToChanges()
      else adapter.subscribeToChanges()
    
    @rows.subscribe ( next ) =>
      if next then adapter.unsubscribeToChanges()
      else adapter.subscribeToChanges()

    @precision.subscribe ( next ) =>
      if next then adapter.unsubscribeToChanges()
      else adapter.subscribeToChanges()

    return this
