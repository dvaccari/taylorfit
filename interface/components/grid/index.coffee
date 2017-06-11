
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
    @start = ko.observable 0
    @end = ko.observable 0

    model       = params.model() # now static
    @dependent  = model.dependent
    @cols       = model.columns
    @rows       = model["data_#{@table}"]
    @extra      = model["extra_#{@table}"]
    @result     = model["result_#{@table}"]

    @clear = ( ) =>
      try @rows null
      try @result null
      return undefined

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
