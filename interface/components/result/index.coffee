
require "./index.styl"

ko.components.register "tf-result",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.model
      throw new TypeError "components/result:
      expects [model] to be observable"

    model = params.model() # now static

    @result = model.result

    @graphdata = ko.observable @result()?.graphdata

    @result.subscribe ( next ) =>
      if not next?.terms.length
        @result null
      else
        @graphdata next.graphdata


    return this
