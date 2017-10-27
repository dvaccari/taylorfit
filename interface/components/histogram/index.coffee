
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

    @charthtml = ko.computed () =>
      column = []
      if @column_index()
        column = [@column_name()].concat(
          model.data_fit().map((row) => row[@column_index()])
        )
      chart = c3.generate
        bindto: "#histogram"
        data:
          columns: [
            column
          ]
          type: "bar"
        size:
          height: 370
        legend:
          show: false

      return chart.element.innerHTML

    @column_index.subscribe ( next ) =>
      if next then adapter.unsubscribeToChanges()
      else adapter.subscribeToChanges()

    return this