
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
      index = @column_index()
      if typeof index == "string"
        if index.indexOf("Sensitivity") != -1
          index = index.split("_")[1]
          return "Sensitivity " + model.sensitivityColumns()[index].name
        return index
      return model.columns()[index].name
    
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
        if index.indexOf("Sensitivity") != -1
          # format is: Sensitivity_index
          index = index.split("_")[1]
          return Object.values(model.sensitivityData()[index])
        return model["extra_#{model.data_plotted()}"]().map((row) => row[index])
      return model["data_#{model.data_plotted()}"]().map((row) => row[index])

    @close = ( ) ->
      model.show_histogram undefined

    @bucket_size = ko.observable(10);

    @charthtml = ko.computed () =>
      unless @active()
        return ""

      sorted = @values().filter((x) => !isNaN(x)).sort((a, b) => a - b)
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