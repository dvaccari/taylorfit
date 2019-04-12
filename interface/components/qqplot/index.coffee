
require "./index.styl"
c3 = require "c3"
Model = require "../Model"

mean = (values) ->
  sum = 0
  i = 0
  while i < values.length
    sum += values[i]
    i++
  sum /= values.length
  return sum

variance = (values, mu) ->
  sum = 0
  i = 0
  while i < values.length
    sum += (values[i] - mu) * (values[i] - mu)
    i++
  return sum /= values.length

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
      model.show_qqplot undefined

    @bucket_size = ko.observable(10);

    @charthtml = ko.computed () =>
      unless @active()
        return ""

      sorted = @values().filter((x) => !isNaN(x)).sort((a, b) => a - b)
      console.log(sorted)
      mu = mean(sorted)
      sigma = Math.sqrt(variance(sorted, mu))
      student = sorted.map((x) -> return (x - mu) / sigma)

      # An ordinal sequence to rank the data points
      rank = [1..sorted.length]
      # Perform the quantile calculation over the data set points
      quantile = rank.map((i) -> return (i - 0.5) / sorted.length)
      
      # The following functions for calculating normal and critical values were adapted by John Walker from C implementations written by Gary Perlman of Wang Institute, Tyngsboro, MA 01879. 
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
      console.log(z_score)

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
            tick:
              count: 10
              format: d3.format('.3s')
            label:
              text: 'Theoretical Quantiles'
              position: 'outer-center'
          y:
            tick:
              count: 10
              format: d3.format('.3s')
            label:
              text: 'Sample Quantiles'
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

    return this