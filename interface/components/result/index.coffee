
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
    @result_validation = model.result_validation
    @data_fit = model.data_fit
    @data_cross = model.data_cross
    @data_validation = model.data_validation
    @extra_fit = model.extra_fit
    @extra_cross = model.extra_cross
    @extra_validation = model.extra_validation
    @dependent = model.dependent
    @psig = model.psig

    @graph_data = ko.computed ( ) =>
      fit = @extra_fit()
      cross = @extra_cross()
      validation = @extra_validation()

      max = Math.max (fit?.length or 0), (cross?.length or 0), (validation?.length or 0)

      data = [ ]
      for index in [0...max] by 1
        data[index] = d = [  ]
        if fit
          if f = fit[index]
            d.push numberOrNull f[1]
            d.push numberOrNull f[2]
          else
            d.push null
            d.push null
        if cross
          if c = cross[index]
            d.push numberOrNull c[1]
            d.push numberOrNull c[2]
          else
            d.push null
            d.push null
        if validation
          if v = validation[index]
            d.push numberOrNull v[1]
            d.push numberOrNull v[2]
          else
            d.push null
            d.push null
      return data

    @graph_row_labels = ko.computed ( ) =>
      fit = @extra_fit()
      cross = @extra_cross()
      validation = @extra_validation()

      counter = 0

      index = () =>
        return if (++counter == 1) then "" else counter

      labels = [ ]
      if fit
        labels.push "x" + index()
        labels.push "Fit Data"
      if cross
        labels.push "x" + index()
        labels.push "Cross Data"
      if validation
        labels.push "x" + index()
        labels.push "Validation Data"

      return labels

    noExponents = ( num ) ->
      data = String(num).split(/[eE]/)
      if data.length == 1
        return data[0]
      z = ''
      sign = if this < 0 then '-' else ''
      str = data[0].replace('.', '')
      mag = Number(data[1]) + 1
      if mag < 0
        z = sign + '0.'
        while mag++
          z += '0'
        return z + str.replace(/^\-/, '')
      mag -= str.length
      while mag--
        z += '0'
      str + z

    @round_stat = ( num ) ->
      Number(noExponents(num)).toFixed(8)
      
    @updateSensitivity = () ->
      for column in model.sensitivityColumns()
        model.update_sensitivity(column.index)

    @updateConfidence = () ->
      for column in model.confidenceColumns()
        model.update_confidence(column.index)

    @updatePrediction = () ->
      for column in model.predictionColumns()
        model.update_prediction(column.index)

    @updateImportanceRatio = () ->
      for column in model.importanceRatioColumns()
        model.update_importanceRatio(column.index)

    return this
