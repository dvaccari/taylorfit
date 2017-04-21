
d3 = require "d3"

module.exports = ( g, scaleX, scaleY, next ) ->
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
