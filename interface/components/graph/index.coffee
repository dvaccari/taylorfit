


require "./index.styl"

c3 = require "c3"

ko.components.register "tf-graph",
  template: "<span></span>"
  viewModel:
    createViewModel: ( params, { element } ) ->

      # TODO: check for observability
      data = params.data

      data.subscribe ( next ) ->
        try
          chart.load
            rows: [["x", "y", "y2" ]].concat next
        catch error
          console.error error

      chart = c3.generate
        data:
          type: "scatter"
          xs:
            y: "x"
            y2: "x"
          rows: [["x", "y", "y2"]].concat data() or [ 0, 0, 0 ]
        axis:
          x:
            label:
              text: params.xlabel
              position: "outer-center"
            tick:
              fit: false
              count: 2
              format: ko.formatters.float
              rotate: 0
          y:
            label:
              text: params.ylabel
              position: "outer-middle"
            tick:
              count: 2
              format: ko.formatters.float
              rotate: 90
        grid:
          y:
            lines: [
              value: 0
            ]
        legend:
          show: false
        tooltip:
          contents: ( [ d ] ) ->
            return "(#{ko.formatters.float d.x},
            #{ko.formatters.float d.value})"

      global.chart = chart

      element.appendChild chart.element

      return { }
