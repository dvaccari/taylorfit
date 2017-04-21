
require "./index.styl"
ResidualGraph = require "./ResidualGraph.coffee"

ko.components.register "tf-result",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.model
      throw new TypeError "components/result:
      expects [model] to be observable"

    model = params.model() # now static

    @result = model.result

    resiGraph = new ResidualGraph ".pca-graph"

    @result.subscribe ( next ) -> resiGraph.update next

    return this
