require "./index.styl"

Model = require "../Model"

ko.components.register "tf-datapartition",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.model
      throw new TypeError "components/data_partition:
      expects [model] to be observable"

    model = params.model() # now static
    @partition_index = model.row_partition

    # Check if transform popup should render
    @active = ko.computed ( ) => @transform_index() != undefined

    return this
