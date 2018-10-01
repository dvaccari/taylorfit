
require "./index.styl"

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

    model       = params.model() # now static
    @dependent  = model.dependent
    @hiddenFeatures = model.hiddenFeatures
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
    
    @isHidden = ( index ) ->
      idx = index + 1
      return @hiddenFeatures().hasOwnProperty(idx) && @hiddenFeatures()[idx]
      
    @showHideColumn = ( shouldHide, index ) ->
      oldCols = @hiddenFeatures()
      oldCols[index] = shouldHide
      model.hiddenFeatures(oldCols)

    @isHiddenColumn = ( index ) -> 
      cols = @hiddenFeatures()
      return cols[index]

    # @exponent_col = ( index ) -> 
    #   old_cols = @cols()
    #   old_cols.push {name: "Potato", index: 35}
    #   console.log(@cols())

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

    return this
