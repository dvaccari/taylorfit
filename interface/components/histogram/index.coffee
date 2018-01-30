
require "./index.styl"
c3 = require "c3"
Model = require "../Model"

ko.components.register "tf-histogram",
  template: do require "./index.pug"
  viewModel: ( params ) ->

    unless ko.isObservable params.model
      throw new TypeError "components/options:
      expects [model] to be observable"
    
    model = params.model()
    @column_index = model.show_histogram

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
      model.show_histogram undefined

    @bucket_size = ko.observable(10);

    @charthtml = ko.computed () =>
      unless @active()
        return ""

      sorted = @values().sort((a, b) => a - b)
      min = sorted[0]
      max = sorted[sorted.length - 1] + 1
      buckets = Array(@bucket_size()).fill(0)
      bucket_width = (max - min) / @bucket_size()
      sorted.forEach((x) => buckets[Math.floor((x - min) / bucket_width)]++)
      labels = Array(@bucket_size()).fill(0).map((x, index) => Math.ceil(index * bucket_width) + min)

      chart = c3.generate
        bindto: "#histogram"
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