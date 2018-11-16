
require "./index.styl"
c3 = require "c3"
Model = require "../Model"

ko.components.register "tf-xyplot",
  template: do require "./index.pug"
  viewModel: ( params ) ->

    unless ko.isObservable params.model
      throw new TypeError "components/options:
      expects [model] to be observable"
    
    model = params.model()
    @column_indexes = model.show_xyplot

    @active = ko.computed ( ) => @column_indexes() != undefined

    @columns = ko.observable ["Index"].concat(model.columns().map((x) => x.name)).concat(["Dependent", "Predicted", "Residual"])
    
    @column_names = ko.computed ( ) => 
      if !@active()
        return [undefined, undefined]
      return @column_indexes().map((idx) =>
        if typeof idx == "string"
          return idx
        return @columns()[idx]
      )
    
    @values = ko.computed ( ) => 
      if !@active()
        return undefined
      column_names = @column_names()
      @column_indexes().map((idx, index) =>
        if column_names[index] == "Index"
          return Object.keys(model["extra_#{model.data_plotted()}"]()).map(parseFloat)
        if column_names[index] == "Dependent"
          return model["extra_#{model.data_plotted()}"]().map((row) => row[0])
        if column_names[index] == "Predicted"
          return model["extra_#{model.data_plotted()}"]().map((row) => row[1])
        if column_names[index] == "Residual"
          return model["extra_#{model.data_plotted()}"]().map((row) => row[2])
        return model["data_#{model.data_plotted()}"]().map((row) => row[idx - 1])
      )

    @close = ( ) ->
      model.show_xyplot undefined

    @charthtml = ko.computed () =>
      unless @active()
        return ""

      global.chart = c3.generate
        bindto: "#xyplot"
        data:
          type: "scatter"
          x: @column_names()[1]
          columns: [
            [@column_names()[0]].concat(@values()[0])
            [@column_names()[1]].concat(@values()[1])
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
              text: @column_names()[1]
              position: 'outer-center'
          y:
            tick:
              count: 10
              format: d3.format('.3s')
            label:
              text: @column_names()[0]
              position: 'outer-middle'
        legend:
          show: false

      return chart.element.innerHTML

    @download = ( ) -> 
      if !@active()
        return undefined
      svg_element = chart.element.querySelector "svg"
      original_height = svg_element.getAttribute "height"
      original_width = svg_element.getAttribute "width"

      console.log(original_height)
      console.log(original_width)

      svg_element.removeAttribute "height"
      svg_element.removeAttribute "width"
      svg_element.style.overflow = "visible"
      svg_element.style.padding = "10px"
      box_size = svg_element.getBBox()
      svg_element.style.height = box_size.height
      svg_element.style.width = box_size.width

      chart_line = svg_element.querySelector ".c3-chart-line"
      chart_line.style.opacity = 1

      node_list1 = svg_element.querySelectorAll ".c3-chart path"
      node_list2 = svg_element.querySelectorAll ".c3-axis path"
      node_list3 = svg_element.querySelectorAll ".c3 line"

      line_graph = Array.from node_list1
      x_and_y = Array.from node_list2
      x_and_y.concat Array.from node_list3
      x_and_y.forEach (e) ->
        e.style.fill = "none"
        e.style.stroke = "black" 

      svg_element.style.backgroundColor = "white"
      
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




    @column_indexes.subscribe ( next ) =>
      if next then adapter.unsubscribeToChanges()
      else adapter.subscribeToChanges()

    # @inc = ( ) -> @bucket_size @bucket_size() + 1
    # @dec = ( ) -> @bucket_size ((@bucket_size() - 1) || 1)

    return this