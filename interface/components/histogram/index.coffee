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
      model.show_histogram undefined

    @bucket_size = ko.observable(10)

    @charthtml = ko.computed () =>
      if !@active() || @values().length == 0
        return ""

      sorted = @values().filter((x) => !isNaN(x)).sort((a, b) => a - b)
      min = sorted[0]
      max = sorted[sorted.length - 1]
      bucket_width = (max - min) / @bucket_size()
      # we can set bucket_width to any non-zero value when all data is identical
      if bucket_width == 0
        bucket_width = 0.1

      buckets = Array(@bucket_size()).fill(0)
      # all values equal to the maximum will be in the last bin
      sorted.forEach((x) => if Math.floor((x - min) / bucket_width) == @bucket_size() then buckets[@bucket_size()-1]++ else buckets[Math.floor((x - min) / bucket_width)]++)
      column_name = @column_name()
      if column_name.indexOf("Sensitivity") != -1 || column_name.indexOf("Importance Ratio") != -1
        labels = Array(@bucket_size()).fill(0).map((x, index) => index * bucket_width + min)
      else
        labels = Array(@bucket_size()).fill(0).map((x, index) => Math.ceil(index * bucket_width) + min)

      # global varible 'chart' can be accessed in download function
      global.chart = c3.generate
        bindto: "#histogram"
        data:
          x: "x"
          columns: [
            ["x"].concat(labels),
            [@column_name()].concat(buckets)
          ]
          type: "bar"
        size:
          height: 370
          width: 600
        axis:
          x:
            tick:
              count: () ->
                numUniqueLabels = labels.filter((val, i, arr) ->
                                    return arr.indexOf(val) == i
                                  ).length
                # to avoid text label for each bin overlap on each other
                if numUniqueLabels < 9
                  return numUniqueLabels
                else
                  if column_name.indexOf("Sensitivity") != -1 || column_name.indexOf("Importance Ratio") != -1
                    # avoid tick labels overlap when labels are very long
                    return 8
                  return 9
              format: d3.format('.3s')
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

      chart_bar = svg_element.querySelector ".c3-chart-bar"
      chart_bar.style.opacity = 1

      node_list1 = svg_element.querySelectorAll ".c3-axis path"
      node_list2 = svg_element.querySelectorAll ".c3 line"
      node_list3 = svg_element.querySelectorAll "line"

      x_and_y = Array.from node_list1
      x_and_y.concat Array.from node_list2
      x_and_y.forEach (e) ->
        e.style.fill = "none"
        e.style.stroke = "black"

      scale = Array.from node_list3
      scale.forEach (e) ->
        e.style.fill = "none"
        e.style.stroke = "black"

      svg_element.style.backgroundColor = "white"

      fst_bar = svg_element.querySelector ".c3-shape-0"
      if fst_bar
        fst_bar_shape = fst_bar.getAttribute "d"
        shape_arr = fst_bar_shape.split(" ")
        if (shape_arr[1].split(",")[0])*1 < 0
          shape_arr[1] = "0," + shape_arr[1].split(",")[1]
          shape_arr[2] = "L0," + shape_arr[2].split(",")[1]
          new_fst_bar_shap = shape_arr.join(' ')
          fst_bar.setAttribute "d", new_fst_bar_shap

      bars = svg_element.querySelectorAll ".c3-chart-bar"
      bars = bars[0]
      paths = bars.getElementsByTagName("path")
      if paths.length
        event_rect_area = svg_element.querySelector ".c3-zoom-rect"
        shape_width = event_rect_area.getAttribute "width"
        lst_bar = paths[paths.length-1]
        lst_bar_shape = lst_bar.getAttribute "d"
        shape_arr = lst_bar_shape.split(" ")
        if ((shape_arr[3].split(",")[0]).substring(1))*1 > shape_width
          shape_arr[3] = "L" + shape_width + "," + shape_arr[3].split(",")[1]
          shape_arr[4] = "L" + shape_width + "," + shape_arr[4].split(",")[1]
          new_lst_bar_shap = shape_arr.join(' ')
          lst_bar.setAttribute "d", new_lst_bar_shap

      xml = new XMLSerializer().serializeToString svg_element
      data_url = "data:image/svg+xml;base64," + btoa xml

      # Reset to original values
      svg_element.style.padding = null
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

    @column_index.subscribe ( next ) =>
      #if next then adapter.unsubscribeToChanges()
      #else adapter.subscribeToChanges()
      if @active() && @values().length
          # Use Sturges' formula to determine the optimal number of buckets
          # k = number of buckets (bins)
          k = Math.ceil(Math.log2(@values().length)) + 1
          numUniqueValues = @values().filter((val, i, arr) ->
                              return arr.indexOf(val) == i
                            ).length
          if numUniqueValues == 1
            @bucket_size 1
          else
            @bucket_size k

    @inc = ( ) -> @bucket_size @bucket_size() + 1
    @dec = ( ) -> @bucket_size ((@bucket_size() - 1) || 1)

    return this
