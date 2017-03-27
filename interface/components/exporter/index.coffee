
require "./index.styl"

download = ( name, type, content ) ->
  a = document.createElement "a"
  a.href = URL.createObjectURL \
    new Blob [ content ], { type }
  a.download = name

  document.body.appendChild a
  a.click()

  URL.revokeObjectURL a.href
  document.body.removeChild a

ko.components.register "tf-exporter",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.model
      throw new TypeError "components/exporter:
      expects [model] to be observable"

    @model = params.model

    @download_dataset = ( ) ->
      model = params.model()
      download (model.id() or "model") + ".csv",
        "type/csv", model.toCSV()

    @download_model = ( ) ->
      model = params.model()
      download (model.id() or "model") + ".tf",
        "application/json", model.toJSON()

    return this
