
require "./index.styl"
Model = require "../Model"
exporter = require "./exporter"

ko.components.register "tf-export-code",
  template: do require "./index.pug"
  viewModel: ( params ) ->

    unless ko.isObservable params.model
      throw new TypeError "components/options:
      expects [model] to be observable"
    
    model = params.model()

    show_export_code = model.show_export_code

    @active = ko.computed ( ) => show_export_code() != undefined

    @language = ko.observable "matlab"

    @code = ko.computed () =>
      if @active()
        if @language() == "javascript"
          return exporter.jsFunc()
        if @language() == "excel"
          return exporter.excelFunc()
        if @language() == "c++"
          return exporter.cppFunc()
        if @language() == "matlab"
          return exporter.matlabFunc()
        if @language() == "python"
          return exporter.pythonFunc()
      return ""

    @close = ( ) ->
      model.show_export_code undefined

    return this