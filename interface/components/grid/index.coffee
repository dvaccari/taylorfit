
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

    @sensitivityColumns  = model.sensitivityColumns
    @sensitivityData   = model.sensitivityData

    @importanceRatioColumns  = model.importanceRatioColumns
    @importanceRatioData   = model.importanceRatioData

    @clear = ( ) =>
      try @rows null
      try @result null
      return undefined

    @histogram = ( index ) ->
      model.show_histogram(index)
      model.data_plotted(@table)

    @histogram_sensitivity = ( index ) ->
      model.show_histogram("Sensitivity_"+index.toString())
      model.data_plotted(@table)
    
    @histogram_importanceratio = ( index ) ->
      model.show_histogram("ImportanceRatio_"+index.toString())
      model.data_plotted(@table)

    @cumulative_distribution = ( index ) ->
      model.show_cumulative_distribution(index)
      model.data_plotted(@table)

    @autocorrelation = ( index ) ->
      model.show_autocorrelation(index)
      model.data_plotted(@table)

    @xyplot = ( index ) ->
      model.show_xyplot([index, "Index"])
      model.data_plotted(@table)

    @xyplot_sensitivity = ( index ) ->
      model.show_xyplot(["Sensitivity_"+index.toString(), "Index"])
      model.data_plotted(@table)
    
    @qqplot = ( index ) ->
      model.show_qqplot(index)
      model.data_plotted(@table)

    @sensitivity = ( index ) ->
      model.show_sensitivity( index )
    
    @deleteSensitivity = ( index, type ) ->
      # Delete with either column index or sensitivity index
      if type == "column"
        model.sensitivityColumns().forEach( (column, sensitivityIndex) ->
          if column.index == index
            return model.delete_sensitivity( sensitivityIndex )
        )
      else if type == "sensitivity"
        model.delete_sensitivity( index ) 

    @hasSensitivity = ( index ) ->
      found = false
      model.sensitivityColumns().forEach( (column) ->
        if column.index == index
          found = true
      )
      return found

    @xyplot_importanceRatio = ( index ) ->
      # TODO maybe combine this with sensitivity
      model.show_xyplot(["ImportanceRatio_"+index.toString(), "Index"])
      model.data_plotted(@table)

    @importanceRatio = ( index ) ->
      model.show_importanceRatio( index )
    
    @deleteImportanceRatio = ( index, type ) ->
      # Delete with either column index or ratio index
      if type == "column"
        model.importanceRatioColumns().forEach( (column, importanceRatioIndex) ->
          if column.index == index
            return model.delete_importanceRatio( importanceRatioIndex )
        )
      else if type == "importanceRatio"
        model.delete_importanceRatio( index ) 

    @hasImportanceRatio = ( index ) ->
      found = false
      model.importanceRatioColumns().forEach( (column) ->
        if column.index == index
          found = true
      )
      return found  
    
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
      if @sensitivityColumns().length > 0
        csv += "," + @sensitivityColumns().map((col) -> "Sensitivity "+col.name).join ","
      if @importanceRatioColumns().length > 0
        csv += "," + @importanceRatioColumns().map((col) -> "Importance Ratio "+col.name).join ","
      for row, index in rows
        csv += "\n" + row.join ","
        if extra then csv += "," + extra[index].join ","
        if @sensitivityData().length > 0
          csv += "," + @sensitivityData().map((col) -> col[index]).join ","
        if @importanceRatioData().length > 0
          csv += "," + @importanceRatioData().map((col) -> col[index]).join ","

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

    @is_k_order_diff = ( col, index ) ->
      col &&
      col.hasOwnProperty("k") &&
      col.k != undefined &&
      index < col.k

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
