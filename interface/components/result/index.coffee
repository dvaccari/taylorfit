
require "./index.styl"

ko.components.register "tf-result",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.model
      throw new TypeError "components/result:
      expects [model] to be observable"

    model = params.model() # now static

    @result = model.result
    @fit = model.fit
    @dependent = model.dependent

    @graphdata = ko.computed ( ) =>
      result = @result()
      unless result then return [ ]
      data = [ ]; pred = result.predicted
      dep = @dependent()
      # TODO: use coffee for creation
      for row, index in @fit().rows()
        data.push [ row[dep], pred[index] ]
      return data


    return this
