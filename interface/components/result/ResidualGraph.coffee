
d3 = require "d3"

class ResidualGraph
  width: 300
  height: 267

  constructor: ( @svgSelector ) ->
    @svg = d3.select(@svgSelector).attr "viewBox", "0 0 #{@width} #{@height}"
    @svg.selectAll("*").remove()

    @g = @svg.append("g")

    @scaleX = d3.scaleLinear().range([0, @width]).domain([0, 0])
    @scaleY = d3.scaleLinear().range([@height, 0]).domain([0, 0])

    @xAxis = @svg.append "g"
                 .attr "class", "axis"
                 .attr "transform", "translate(0,#{@height})"
    @yAxis = @svg.append "g"
                 .attr "class", "axis"

    @svg.append "text"
        .attr "x", @width / 2
        .attr "y", @height + 30
        .attr "class", "axis-label"
        .style "text-anchor", "middle"
        .text "response"

    @svg.append "text"
        .attr "x", -35
        .attr "y", @height / 2
        .attr "class", "axis-label"
        .style "text-anchor", "middle"
        .attr "transform", "rotate(-90, -35, #{@height / 2})"
        .text "residual"

    @zeroline = @svg.append "line"
                    .attr "class", "zeroline"
                    .attr "stroke", "black"

  update: ( next ) ->
    if @svg.node() is null or not @svg.node().isConnected
      this.constructor.call this, @svgSelector

    if next == null
      return

    data = next.graphdata

    extentX = d3.extent data, ( d ) -> d[0]
    extentY = d3.extent data, ( d ) -> d[1]
    domainY = extentY[1] - extentY[0]

    scaleX = @scaleX
    scaleY = @scaleY

    scaleX.domain extentX

    domainYOld = scaleY.domain()[1] - scaleY.domain()[0]
    if domainY > domainYOld or
       domainY < domainYOld / 2 or
       extentY[0] > scaleY.domain()[1] or
       extentY[1] < scaleY.domain()[0]
      scaleY.domain extentY

    @xAxis.call d3.axisBottom(scaleX).ticks(7)
    @yAxis.call d3.axisLeft(scaleY).ticks(7)

    circles = @g.selectAll("circle").data data
    circles.exit().remove()

    circles.enter()
      .append "circle"
      .attr "class", "truth"
    .merge circles
      .transition()
      .duration 750
      .attr "cx", ( d ) -> scaleX(d[0])
      .attr "cy", ( d ) -> scaleY(d[1])
      .attr "r", 2

    @zeroline
      .attr "x1", scaleX.range()[0]
      .attr "y1", scaleY(0)
      .attr "x2", scaleX.range()[1]
      .attr "y2", scaleY(0)

module.exports = ResidualGraph
