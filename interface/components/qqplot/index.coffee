require "./index.styl"
c3 = require "c3"
Model = require "../Model"

mean = (values) ->
  if values.length == 0
    return NaN
  sum = 0
  i = 0
  while i < values.length
    sum += values[i]
    i++
  sum /= values.length
  return sum

variance = (values, mu) ->
  if values.length == 0
    return NaN
  sum = 0
  i = 0
  while i < values.length
    sum += (values[i] - mu) * (values[i] - mu)
    i++
  return sum /= (values.length - 1)

ko.components.register "tf-qqplot",
  template: do require "./index.pug"
  viewModel: ( params ) ->

    unless ko.isObservable params.model
      throw new TypeError "components/options:
      expects [model] to be observable"

    model = params.model()
    @column_index = model.show_qqplot

    @active = ko.computed ( ) => @column_index() != undefined

    @column_name = ko.computed ( ) =>
      if !@active()
        return undefined

      index = @column_index()[0]
      if typeof index == "string"
        if index.indexOf("Sensitivity") != -1
          index = index.split("_")[1]
          return "Sensitivity " + model.sensitivityColumns()[index].name
        if index.indexOf("C.I.") != -1
          index = 0
          return "C.I."
        if index.indexOf("P.I.") != -1
          index = 0
          return "P.I."
        if index.indexOf("ImportanceRatio") != -1
          index = index.split("_")[1]
          return "Importance Ratio " + model.importanceRatioColumns()[index].name
        return index
      return model.columns()[index].name

    @values = ko.computed ( ) =>
      if !@active()
        return undefined

      table = @column_index()[1]
      offset_start = 0
      offset_end = 0
      if @table == 'fit'
        offset_start = 0
        offset_end = model["data_fit"]().length
      else if @table == 'cross'
        offset_start = model["data_fit"]().length
        offset_end = offset_start + model["data_cross"]().length
      else
         offset_start = model["data_fit"]().length
        if model["data_cross"]() != undefined
          offset_start += model["data_cross"]().length
        offset_end = offset_start
        if model["data_validation"]() != undefined
          offset_end += model["data_validation"]().length
        # We've gotten into a situation where there's only 1 data table
        # Due to a bug, this doesn't fall under the 'fit' category,
        # but this patch is easier than fixing the bug
        if offset_start == offset_end
          offset_start = 0

      index = @column_index()[0]
      if typeof index == "string"
        if index == "Dependent"
          index = 0
        if index == "Predicted"
          index = 1
        if index == "Residual"
          index = 2
        if typeof index == "string" && index.indexOf("Sensitivity") != -1
          # format is: Sensitivity_index
          index = index.split("_")[1]
          return Object.values(model.sensitivityData()[index])
        if typeof index == "string" && index.indexOf("C.I.") != -1
          # format is: C.I.
          index = 0
          return Object.values(model.confidenceData()[0].slice(offset_start, offset_end))
        if typeof index == "string" && index.indexOf("P.I.") != -1
          # format is: P.I.
          index = 0
          return Object.values(model.predictionData()[0].slice(offset_start, offset_end))
        if typeof index == "string" && index.indexOf("ImportanceRatio") != -1
          # format is: ImportanceRatio_index
          index = index.split("_")[1]
          return Object.values(model.importanceRatioData()[index])
        return model["extra_#{table}"]().map((row) => row[index])
      return model["data_#{table}"]().map((row) => row[index])

    @close = ( ) ->
      model.show_qqplot undefined

    @bucket_size = ko.observable(10);

    @charthtml = ko.computed () =>
      if !@active() || @values().length == 0
        return ""

      numUniqueValues = @values().filter((val, i, arr) ->
                    return arr.indexOf(val) == i
                  ).length
      sorted = @values().filter((x) => !isNaN(x)).sort((a, b) => a - b)
      if numUniqueValues != 1
        mu = mean(sorted)
        sigma = Math.sqrt(variance(sorted, mu))
        student = sorted.map((x) -> return (x - mu) / sigma)
      else
        student = Array(sorted.length).fill(NaN)

      # An ordinal sequence to rank the data points
      rank = [1..sorted.length]
      # Perform the quantile calculation over the data set points
      quantile = rank.map((i) -> return (i - 0.5) / sorted.length)

      # The following functions for converting Z score to Percentile and converting Percentile to Z score were adapted by John Walker from C implementations written by Gary Perlman of Wang Institute, Tyngsboro, MA 01879.
      Z_MAX = 6
      # Convert z-score to probability
      poz = (z) ->
        if z == 0.0
          x = 0.0
        else
          y = 0.5 * Math.abs(z);
          if (y > (Z_MAX * 0.5))
            x = 1.0;
          else if (y < 1.0)
            w = y * y
            x = ((((((((0.000124818987 * w -
                  0.001075204047) * w + 0.005198775019) * w -
                  0.019198292004) * w + 0.059054035642) * w -
                  0.151968751364) * w + 0.319152932694) * w -
                  0.531923007300) * w + 0.797884560593) * y * 2.0
          else
            y -= 2.0;
            x = (((((((((((((-0.000045255659 * y +
                  0.000152529290) * y - 0.000019538132) * y -
                  0.000676904986) * y + 0.001390604284) * y -
                  0.000794620820) * y - 0.002034254874) * y +
                  0.006549791214) * y - 0.010557625006) * y +
                  0.011630447319) * y - 0.009279453341) * y +
                  0.005353579108) * y - 0.002141268741) * y +
                  0.000535310849) * y + 0.999936657524
        return (if z > 0.0 then ((x + 1.0) * 0.5) else ((1.0 - x) * 0.5))
      # Convert probability to z-score
      critz = (p) ->
        Z_EPSILON = 0.000001;     # Accuracy of z approximation
        minz = -Z_MAX;
        maxz = Z_MAX;
        zval = 0.0;
        if p < 0.0
          p = 0.0;
        if p > 1.0
          p = 1.0;
        while (maxz - minz) > Z_EPSILON
          pval = poz(zval)
          if pval > p
              maxz = zval;
          else
              minz = zval;
          zval = (maxz + minz) * 0.5;
        return zval

      z_score = quantile.map((x) -> return critz(x))
      min_z_score = z_score[0]
      max_z_score = z_score[z_score.length-1]
      if numUniqueValues != 1
        min_student = student[0]
        max_student = student[student.length-1]
        min_scale_val = if min_z_score < min_student then Math.floor(min_z_score) else Math.floor(min_student)
        max_scale_val = if max_z_score < max_student then Math.ceil(max_student) else Math.ceil(max_z_score)
      else
        min_scale_val = min_z_score
        max_scale_val = max_z_score

      # global varible 'chart' can be accessed in download function
      global.chart = c3.generate
        bindto: "#qqplot"
        data:
          type: "scatter"
          x: "x"
          columns: [
            ["x"].concat(z_score)
            ["y"].concat(student)
          ]
        size:
          height: 370
          width: 600
        axis:
          x:
            min: min_scale_val
            max: max_scale_val
            # x axis has a default padding value
            padding:
              top: 0
              bottom: 0
            tick:
              count: 10
              format: d3.format('.3s')
            label:
              text: 'Normal Theoretical Quantiles'
              position: 'outer-center'
          y:
            min: min_scale_val
            max: max_scale_val
            # y axis has a default padding value
            padding:
              top: 0
              bottom: 0
            tick:
              count: 10
              format: d3.format('.3s')
            label:
              text: 'Sample Quantiles'
              position: 'outer-middle'
        legend:
          show: false
        grid:
          x:
            lines: [
                value: 0
            ]

      svg_element = chart.element.querySelector "svg"
      xgrid_line = svg_element.querySelector ".c3-xgrid-line"
      vertical_line = xgrid_line.getElementsByTagName("line")[0]
      event_rect_area = svg_element.querySelector ".c3-event-rect"
      shape_width = event_rect_area.getAttribute "width"
      x1 = vertical_line.getAttribute "x1"
      x2 = vertical_line.getAttribute "x2"
      vertical_line.setAttribute "x1", shape_width
      vertical_line.setAttribute "x2", 0

      return chart.element.innerHTML

    @download = ( ) ->
      if !@active()
        return undefined
      svg_element = chart.element.querySelector "svg"
      original_height = svg_element.getAttribute "height"
      original_width = svg_element.getAttribute "width"

      svg_element.removeAttribute "height"
      svg_element.removeAttribute "width"
      svg_element.style.overflow = "visible"
      svg_element.style.padding = "10px"
      box_size = svg_element.getBBox()
      svg_element.style.height = box_size.height
      svg_element.style.width = box_size.width

      chart_line = svg_element.querySelector ".c3-chart-line"
      chart_line.style.opacity = 1

      node_list1 = svg_element.querySelectorAll ".c3-axis path"
      node_list2 = svg_element.querySelectorAll ".c3 line"
      node_list3 = svg_element.querySelectorAll "line"
      node_list4 = svg_element.querySelectorAll ".c3 path"

      x_and_y = Array.from node_list1
      x_and_y.concat Array.from node_list2
      x_and_y.forEach (e) ->
        e.style.fill = "none"
        e.style.stroke = "black"

      scale = Array.from node_list3
      scale.forEach (e) ->
        e.style.fill = "none"
        e.style.stroke = "black"

      path = Array.from node_list4
      path.forEach (e) ->
        e.style.fill = "none"

      svg_element.style.backgroundColor = "white"
      tick = svg_element.querySelectorAll ".tick"

      for i in [0..tick.length-1]
        # use transform property to check if the SVG element is on the top position of y axis
        # matrix(1, 0, 0, 1, 0, 1) -> ["1", "0", "0", "1", "0", "1"]
        transform_y_val = (getComputedStyle(tick[i]).getPropertyValue('transform').replace(/^matrix(3d)?\((.*)\)$/,'$2').split(/, /)[5])*1
        if transform_y_val == 1
          text = tick[i].getElementsByTagName("text")
          # stop the loop once the SVG element on the top position of y axis is found
          break

      original_y = text[0].getAttribute "y"
      text[0].setAttribute "y", original_y + 3

      xml = new XMLSerializer().serializeToString svg_element
      data_url = "data:image/svg+xml;base64," + btoa xml

      # Reset to original values
      svg_element.style.padding = null
      text[0].setAttribute "y", original_y
      svg_element.setAttribute "height", original_height
      svg_element.setAttribute "width", original_width
      svg_element.style.backgroundColor = null

      img = new Image()
      img.src = data_url

      img.onload = () ->
        canvas_element = document.createElement "canvas"
        canvas_element.width = svg_element.scrollWidth
        canvas_element.height = svg_element.scrollHeight
        ctx = canvas_element.getContext "2d"
        ctx.drawImage img, 0, 0
        png_data_url = canvas_element.toDataURL "image/png"

        a_element = document.createElement "a"
        a_element.href = png_data_url
        a_element.style = "display: none;"
        a_element.target = "_blank"
        a_element.download = "chart"
        document.body.appendChild a_element
        a_element.click()
        document.body.removeChild a_element

      return undefined

    return this
