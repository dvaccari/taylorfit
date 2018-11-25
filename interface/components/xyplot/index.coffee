
require "./index.styl"
c3 = require "c3"
Model = require "../Model"

ko.components.register "tf-xyplot",
  template: do require "./index.pug"
  viewModel: ( params ) ->

    unless ko.isObservable params.model
      throw new TypeError "components/options:
      expects [model] to be observable"
    
    model = params.model()
    @column_indexes = model.show_xyplot

    @active = ko.computed ( ) => @column_indexes() != undefined

    @columns = ko.observable ["Index"].concat(model.columns().map((x) => x.name)).concat(["Dependent", "Predicted", "Residual"])
    
    @column_names = ko.computed ( ) => 
      if !@active()
        return [undefined, undefined]
      return @column_indexes().map((idx) =>
        if typeof idx == "string"
          # Special Case for Sensitivity 
          if idx.indexOf("Sensitivity") != -1
            idx = idx.split("_")[1]
            return "Sensitivity " + model.sensitivityColumns()[idx].name
          return idx
        return @columns()[idx]
      )
    
    @values = ko.computed ( ) => 
      if !@active()
        return undefined
      column_names = @column_names()
      @column_indexes().map((idx, index) =>
        if column_names[index] == "Index"
          return Object.keys(model["extra_#{model.data_plotted()}"]()).map(parseFloat)
        if column_names[index] == "Dependent"
          return model["extra_#{model.data_plotted()}"]().map((row) => row[0])
        if column_names[index] == "Predicted"
          return model["extra_#{model.data_plotted()}"]().map((row) => row[1])
        if column_names[index] == "Residual"
          return model["extra_#{model.data_plotted()}"]().map((row) => row[2])
        if column_names[index].indexOf("Sensitivity") != -1
          idx = idx.split("_")[1]
          return Object.values(model.sensitivityData()[idx])
        return model["data_#{model.data_plotted()}"]().map((row) => row[idx - 1])
      )

    @close = ( ) ->
      model.show_xyplot undefined

    @charthtml = ko.computed () =>
      unless @active()
        return ""

      chart = c3.generate
        bindto: "#xyplot"
        data:
          type: "scatter"
          x: @column_names()[1]
          columns: [
            [@column_names()[0]].concat(@values()[0])
            [@column_names()[1]].concat(@values()[1])
          ]
        size:
          height: 370
          width: 600
        axis:
          x:
            tick:
              count: 10
              format: d3.format('.3s')
            label:
              text: @column_names()[1]
              position: 'outer-center'
          y:
            tick:
              count: 10
              format: d3.format('.3s')
            label:
              text: @column_names()[0]
              position: 'outer-middle'
        legend:
          show: false

      return chart.element.innerHTML

    @column_indexes.subscribe ( next ) =>
      if next then adapter.unsubscribeToChanges()
      else adapter.subscribeToChanges()

    # @inc = ( ) -> @bucket_size @bucket_size() + 1
    # @dec = ( ) -> @bucket_size ((@bucket_size() - 1) || 1)

    return this