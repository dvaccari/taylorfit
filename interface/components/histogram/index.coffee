
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
    
    @column_name = ko.computed ( ) => if @active() then model.columns()[@column_index()].name else undefined

    @close = ( ) ->
      model.show_histogram undefined

    @bucket_size = ko.observable(10);

    @charthtml = ko.computed () =>
      unless @active()
        return ""

      sorted = model.data_fit().map((row) => row[@column_index()]).sort((a, b) => a - b)
      min = sorted[0]
      max = sorted[sorted.length - 1] + 1
      buckets = Array(@bucket_size()).fill(0)
      bucket_width = Math.ceil((max - min) / @bucket_size())
      sorted.forEach((x) => buckets[Math.floor((x - min) / bucket_width)]++)
      labels = Array(@bucket_size()).fill(0).map((x, index) => index * bucket_width + min)

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
        legend:
          show: false

      return chart.element.innerHTML

    @column_index.subscribe ( next ) =>
      if next then adapter.unsubscribeToChanges()
      else adapter.subscribeToChanges()

    @inc = ( ) -> @bucket_size @bucket_size() + 1
    @dec = ( ) -> @bucket_size ((@bucket_size() - 1) || 1)

    return this