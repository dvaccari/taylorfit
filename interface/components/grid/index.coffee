
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
    @result = ko.observableArray [ ]
    @start = ko.observable 0

    model = params.model() # now static
    @dependent  = model.dependent
    @results    = model.result
    @cols       = model[@table]().cols
    @rows       = model[@table]().rows

    return this

