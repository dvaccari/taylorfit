
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
      return model["data_#{model.data_plotted()}"]().map((row) => row[index])

    @close = ( ) ->
      model.show_cumulative_distribution undefined

    @bucket_size = ko.observable(10);

    @charthtml = ko.computed () =>
      unless @active()
        return ""

      sorted = @values().filter((x) => !isNaN(x)).sort((a, b) => a - b)
      min = sorted[0]
      max = sorted[sorted.length - 1] + 1
      buckets = Array(@bucket_size()).fill(0)
      bucket_width = (max - min) / @bucket_size()
      sorted.forEach((x) => buckets[Math.floor((x - min) / bucket_width)]++)
      n = buckets.reduce (t, s) -> t + s
      last = 0
      for i in [0...buckets.length]
        buckets[i] += last
        last = buckets[i]
        buckets[i] /= n

      labels = Array(@bucket_size()).fill(0).map((x, index) => Math.ceil(index * bucket_width) + min)

      # global varible 'chart' can be accessed in download function
      global.chart = c3.generate
        bindto: "#cumulative-distribution"
        data:
          x: "x"
          columns: [
            ["x"].concat(labels),
            [@column_name()].concat(buckets)
          ]
        size:
          height: 370
          width: 600
        axis:
          x:
            tick:
              format: d3.format('.3s')
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
        # use transform property to check if the SVG element is on the top position of y axis
        transform_y_val = (getComputedStyle(tick[num]).getPropertyValue('transform').replace(/^matrix(3d)?\((.*)\)$/,'$2').split(/, /)[5])*1
        if transform_y_val == 1
          text = tick[num].getElementsByTagName("text")
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



    @column_index.subscribe ( next ) =>
      if next then adapter.unsubscribeToChanges()
      else adapter.subscribeToChanges()

    @inc = ( ) -> @bucket_size @bucket_size() + 1
    @dec = ( ) -> @bucket_size ((@bucket_size() - 1) || 1)

    return this