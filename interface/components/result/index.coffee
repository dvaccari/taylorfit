
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
    @cross = model.cross
    @dependent = model.dependent

    @graphdata = ko.computed ( ) =>
      result = @result()
      cross = @cross()?.rows()
      unless result then return [ ]
      data = [ ]; pred = result.predicted
      dep = @dependent()
      # TODO: use coffee for creation
      for row, index in @fit().rows()
        p = pred[index]
        res = [ p, row[dep] - p ]
        if cross then res.push cross[index][dep] - p
        data.push res
      return data


    return this
