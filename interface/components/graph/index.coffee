require "./index.styl"

c3 = require "c3"

ko.components.register "tf-graph",
  template: "<span></span>"
  viewModel:
    createViewModel: ( params, { element } ) ->

      # TODO: check for observability
      data = params.data
      row_labels = params.row_labels

      row_labels.subscribe ( next ) ->
        try
          chart.load
            xs: getxs()
            rows: [next].concat data()
        catch error
          console.error error

      getxs = () =>
        xs = []
        labels = row_labels()
        for i in [0...labels.length / 2]
          xs[labels[i * 2 + 1]] = labels[i * 2]
        return xs

      chart = c3.generate
        data:
          type: "scatter"
          xs: getxs()
          rows: [row_labels()].concat data() or [ 0, 0, 0 ]
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
