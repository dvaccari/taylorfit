
require "./index.styl"
c3 = require "c3"
Model = require "../Model"

mean = (values) ->
  sum = 0
  i = 0
  while i < values.length
    sum += values[i]
    i++
  sum /= values.length
  return sum

variance = (values, mu) ->
  sum = 0
  i = 0
  while i < values.length
    sum += (values[i] - mu) * (values[i] - mu)
    i++
  return sum /= values.length

calculateAutoCorrelation = (values, k) ->
  mu = mean(values)
  
  normal_values = values.slice(0,values.length - k)
  skipped_values = values.slice(k)

  sum = 0
  i = 0
  while i < normal_values.length
    sum += (normal_values[i] - mu) * (skipped_values[i] - mu)
    i++
  sum /= values.length
  sum /= variance(values, mu)
  return sum

  

ko.components.register "tf-autocorrelation",
  template: do require "./index.pug"
  viewModel: ( params ) ->

    unless ko.isObservable params.model
      throw new TypeError "components/options:
      expects [model] to be observable"
    
    model = params.model()
    @column_index = model.show_autocorrelation

    @active = ko.computed ( ) => @column_index() != undefined
    
    @column_name = ko.computed ( ) => 
      if !@active()
        return undefined
      if typeof @column_index() == "string"
        return @column_index()
      return model.columns()[@column_index()].name
    
    @values = ko.computed ( ) => 
      if !@active()
        return undefined
      index = @column_index()
      if typeof index == "string"
        if index == "Dependent"
          index = 0
        if index == "Predicted"
          index = 1
        if index == "Residual"
          index = 2
        return model.extra_fit().map((row) => row[index])
      return model.data_fit().map((row) => row[index])

    @close = ( ) ->
      model.show_autocorrelation undefined

    @bucket_size = ko.observable(10);

    @charthtml = ko.computed () =>
      unless @active()
        return ""

      # TODO : FINISH THIS

      filtered = @values().filter((x) => !isNaN(x))

      buckets = Array(@bucket_size()).fill(0)

      i = 0
      k = @bucket_size()
      while i < k
        console.log('Calculating Autocorrelation in Bucket ', i)
        buckets[i] = calculateAutoCorrelation(filtered, i+1)
        console.log('Autocorrelation Value: ', buckets[i])
        i++
      labels = Array(@bucket_size()).fill(0).map((x, index) => index + 1)

      chart = c3.generate
        bindto: "#autocorrelation"
        data:
          x: "x"
          columns: [
            ["x"].concat(labels),
            [@column_name()].concat(buckets)
          ]
          type: "bar"
        size:
          height: 370
          width: 600
        axis:
          x:
            tick:
              format: d3.format('.3s')
        legend:
          show: false
      return chart.element.innerHTML

    @column_index.subscribe ( next ) =>
      if next then adapter.unsubscribeToChanges()
      else adapter.subscribeToChanges()

    @inc = ( ) -> @bucket_size @bucket_size() + 1
    @dec = ( ) -> @bucket_size ((@bucket_size() - 1) || 1)

    return this