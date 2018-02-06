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
            rows: [["x", "Fit Data", "x2", "Cross Data" ]].concat next
        catch error
          console.error error

      chart = c3.generate
        data:
          type: "scatter"
          xs:
            "Fit Data": "x"
            "Cross Data": "x2"
          rows: [["x", "Fit Data", "x2", "Cross Data"]].concat data() or [ 0, 0, 0 ]
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
        legend:
          show: true
          position: "inset"
        grid:
          y:
            lines: [
              value: 0
            ]
        tooltip:
          contents: ( [ d ] ) ->
            return "(#{ko.formatters.float d.x},
            #{ko.formatters.float d.value})"

      global.chart = chart

      element.appendChild chart.element

      return { }
