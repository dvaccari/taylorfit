
require "./index.styl"
d3 = require "d3"

global.d3 = d3

ko.components.register "tf-result",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.model
      throw new TypeError "components/result:
      expects [model] to be observable"

    model = params.model() # now static

    @result = model.result

    # Maybe move all of this into a separate module so we can just plop
    # graphs wherever    |   and however with different data
    #                    v
    width = 300
    height = 267
    svg = d3.select(".pca-graph")
            .attr "viewBox", "0 0 #{width} #{height}"

    g = svg.append("g")

    g.exit().remove()
    svg.exit().remove()

    scaleX = d3.scaleLinear().range([0, width])
    scaleY = d3.scaleLinear().range([height, 0])

    @result.subscribe ( next ) ->
      if next == null
        return

      { truth, predicted, error } = next.graphdata

      if error
        console.error error
        return

      all = truth.concat predicted

      scaleX.domain d3.extent all, ( d ) -> d[0]
      scaleY.domain d3.extent all, ( d ) -> d[1]

      truthCircles = g.selectAll("circle.truth").data truth
      predictedCircles = g.selectAll("circle.predicted").data predicted
      errorLines = g.selectAll("line.error").data predicted

      truthCircles.exit().remove()
      predictedCircles.exit().remove()
      errorLines.exit().remove()

      errorLines.enter()
        .append "line"
        .attr "class", "error"
      .merge(errorLines)
        .transition()
        .duration(750)
        .attr "x1", ( d ) -> scaleX(d[0])
        .attr "y1", ( d ) -> scaleY(d[1])
        .attr "x2", ( _, i ) -> scaleX(truth[i][0])
        .attr "y2", ( _, i ) -> scaleY(truth[i][1])

      truthCircles.enter()
        .append "circle"
        .attr "class", "truth"
      .merge(truthCircles)
        .transition()
        .duration(750)
        .attr "cx", ( d ) -> scaleX(d[0])
        .attr "cy", ( d ) -> scaleY(d[1])
        .attr "r", 2

      predictedCircles.enter()
        .append "circle"
        .attr "class", "predicted"
      .merge(predictedCircles)
        .transition()
        .duration(750)
        .attr "cx", ( d ) -> scaleX(d[0])
        .attr "cy", ( d ) -> scaleY(d[1])
        .attr "r", 2


    return this
