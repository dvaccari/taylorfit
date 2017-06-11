
require "./index.styl"

numberOrNull = ( n ) ->
  if isNaN n then null else n or 0

ko.components.register "tf-result",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.model
      throw new TypeError "components/result:
      expects [model] to be observable"

    model = params.model() # now static

    @result_fit = model.result_fit
    @result_cross = model.result_cross
    @data_fit = model.data_fit
    @data_cross = model.data_cross
    @extra_fit = model.extra_fit
    @extra_cross = model.extra_cross
    @dependent = model.dependent

    @graphdata = ko.computed ( ) =>
      fit = @extra_fit()
      cross = @extra_cross()

      max = Math.max (fit?.length or 0), (cross?.length or 0)

      data = [ ]
      for index in [0...max] by 1
        data[index] = d = [ null, null, null, null ]
        if fit and f = fit[index]
          d[0] = numberOrNull f[1]
          d[1] = numberOrNull f[2]
        if cross and c = cross[index]
          d[2] = numberOrNull c[1]
          d[3] = numberOrNull c[2]
      return data


    return this
