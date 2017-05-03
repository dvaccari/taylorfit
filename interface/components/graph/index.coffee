


require "./index.styl"

c3 = require "c3"

ko.components.register "tf-graph",
  template: "<span></span>"
  viewModel:
    createViewModel: ( params, { element } ) ->

      # TODO: check for observability
      data = params.data

      data.subscribe ( next ) ->
        chart.load
          rows: [["x", "y"]].concat next

      chart = c3.generate
        data:
          type: "scatter"
          xs:
            y: "x"
          rows: [["x", "y"]].concat data() or [ ]
        axis:
          x:
            label:
              text: params.xlabel
              position: "outer-center"
            tick:
              fit: false
              count: 8
              format: Math.round
          y:
            label:
              text: params.ylabel
              position: "outer-middle"
        legend:
          show: false
        tooltip:
          contents: ( [ d ] ) ->
            return ko.formatters.float d.value

      global.chart = chart

      element.appendChild chart.element

      return { }
