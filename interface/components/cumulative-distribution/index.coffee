require "./index.styl"
c3 = require "c3"
Model = require "../Model"

ko.components.register "tf-cumulative-distribution",
  template: do require "./index.pug"
  viewModel: ( params ) ->

    unless ko.isObservable params.model
      throw new TypeError "components/options:
      expects [model] to be observable"

    model = params.model()
    @column_index = model.show_cumulative_distribution

    @active = ko.computed ( ) => @column_index() != undefined

    @column_name = ko.computed ( ) =>
      if !@active()
        return undefined
      index = @column_index()
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
      index = @column_index()
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
          return Object.values(model.confidenceData()[0])
        if typeof index == "string" && index.indexOf("P.I.") != -1
          # format is: P.I.
          index = 0
          return Object.values(model.predictionData()[0])
        if typeof index == "string" && index.indexOf("ImportanceRatio") != -1
          # format is: ImportanceRatio_index
          index = index.split("_")[1]
          return Object.values(model.importanceRatioData()[index])
        return model["extra_#{model.data_plotted()}"]().map((row) => row[index])
      return model["data_#{model.data_plotted()}"]().map((row) => row[index])

    @close = ( ) ->
      model.show_cumulative_distribution undefined

    @bucket_size = ko.observable(10)

    @charthtml = ko.computed () =>
      if !@active() || @values().length == 0
        return ""

      sorted = @values().filter((x) => !isNaN(x)).sort((a, b) => a - b)
      occurrences = {}

      for i in [0..sorted.length-1]
        if !occurrences[sorted[i]]
          occurrences[sorted[i]] = 0
        ++occurrences[sorted[i]]

      keys = Object.keys(occurrences)
      # Sort keys
      keys.sort((a, b) => a - b)
      sorted_occurrences = {}
      for i in [0..keys.length-1]
        key = keys[i]
        value = occurrences[key]
        sorted_occurrences[key] = value

      cumulative_pct = Object.values(sorted_occurrences)

      n = Object.values(sorted_occurrences).reduce (t, s) -> t + s
      last = 0
      for i in [0..cumulative_pct.length-1]
        cumulative_pct[i] += last
        last = cumulative_pct[i]
        cumulative_pct[i] /= n

      # global varible 'chart' can be accessed in download function
      global.chart = c3.generate
        bindto: "#cumulative-distribution"
        data:
          type: "scatter"
          x: "x"
          columns: [
            ["x"].concat(keys),
            ["y"].concat(cumulative_pct)
          ]
        size:
          height: 370
          width: 600
        axis:
          x:
            tick:
              count: 10
              format: d3.format('.3s')
            label:
              text: @column_name()
              position: 'outer-center'
          y:
            min: 0
            max: 1
            # y axis has a default padding value
            padding:
              top: 0
              bottom: 0
            tick:
              format: d3.format('%')
        legend:
          show: false

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
      num_arr = Array(tick.length).fill(0).map((x, y) => y)

      for num in num_arr
        # Use transform property to check if the SVG element is on the top position of y axis
        # matrix(1, 0, 0, 1, 0, 1) -> ["1", "0", "0", "1", "0", "1"]
        transform_y_val = (getComputedStyle(tick[num]).getPropertyValue('transform').replace(/^matrix(3d)?\((.*)\)$/,'$2').split(/, /)[5])*1
        if transform_y_val == 1
          text = tick[num].getElementsByTagName("text")
          # Stop the loop once the SVG element on the top position of y axis is found
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
