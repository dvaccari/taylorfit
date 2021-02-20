require "./index.styl"
c3 = require "c3"
Model = require "../Model"

mean = (values) ->
  [sum, i] = [0, 0]
  while i < values.length
    sum += values[i]
    i++
  sum /= values.length
  return sum

variance = (values, mu) ->
  [sum, i] = [0, 0]
  while i < values.length
    sum += (values[i] - mu) * (values[i] - mu)
    i++
  return sum /= values.length

calculateAutoCorrelation = (values, k) ->
  [sum, i, mu] = [0, 0, mean(values)]

  normal_values = values.slice(0,values.length - k)
  skipped_values = values.slice(k)

  while i < normal_values.length
    sum += (normal_values[i] - mu) * (skipped_values[i] - mu)
    i++
  sum /= values.length
  sum /= variance(values, mu)
  return sum

calculateStandardError = (acf, numValues) ->
  [sum, i, errors] = [0, 0, []]
  while i < acf.length
    sum += acf[i] * acf[i]
    console.log('Sum: ', sum)
    errors[i] = Math.sqrt((1 + 2 * sum) / numValues)
    console.log(errors[i])
    i++
  console.log(errors)
  return errors



ko.components.register "tf-autocorrelation",
  template: do require "./index.pug"
  viewModel: ( params ) ->

    unless ko.isObservable params.model
      throw new TypeError "components/options:
      expects [model] to be observable"

    model = params.model()
    @column_index = model.show_autocorrelation

    @active = ko.computed ( ) => @column_index() != undefined

    @column_name = ko.computed ( ) =>
      if !@active()
        return undefined
      index = @column_index()
      if typeof index == "string"
        if index.indexOf("Sensitivity") != -1
          index = index.split("_")[1]
          return "Sensitivity " + model.sensitivityColumns()[index].name
        if index.indexOf("ImportanceRatio") != -1
          index = index.split("_")[1]
          return "Importance Ratio " + model.importanceRatioColumns()[index].name
        return @column_index()
      return model.columns()[@column_index()].name

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
        if typeof index == "string" && index.indexOf("ImportanceRatio") != -1
          # format is: ImportanceRatio_index
          index = index.split("_")[1]
          return Object.values(model.importanceRatioData()[index])
        return model["extra_#{model.data_plotted()}"]().map((row) => row[index])
      return model["data_#{model.data_plotted()}"]().map((row) => row[index])

    @close = ( ) ->
      model.show_autocorrelation undefined

    @bucket_size = ko.observable(10);

    @charthtml = ko.computed () =>
      unless @active()
        return ""

      # TODO : FINISH THIS

      filtered = @values().filter((x) => !isNaN(x))

      buckets = Array(@bucket_size()).fill(0)

      [i, k, z_score] = [0, @bucket_size(), 3]
      while i < k
        console.log('Calculating Autocorrelation in Bucket ', i)
        buckets[i] = calculateAutoCorrelation(filtered, i+1)
        console.log('Autocorrelation Value: ', buckets[i])
        i++

      errors = calculateStandardError(buckets, filtered.length)
      errors = errors.map((value) => value * z_score)
      negativeErrors = errors.map((value) => value * -1)

      console.log(errors)

      labels = Array(@bucket_size()).fill(0).map((x, index) => index + 1)
      # global varible 'chart' can be accessed in download function
      global.chart = c3.generate
        bindto: "#autocorrelation"
        data:
          x: "x"
          columns: [
            ["x"].concat(labels),
            [@column_name()].concat(buckets),
            ['confidencePositive'].concat(errors),
            ['confidenceNegative'].concat(negativeErrors)
          ]
          type: 'bar',
          types:
            confidencePositive: 'line'
            confidenceNegative: 'line'
        size:
          height: 370
          width: 600
        axis:
          x:
            tick:
              format: d3.format('.3s')
          y:
            tick:
              format: d3.format('.3f')
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

      chart_line = svg_element.querySelectorAll ".c3-chart-line"
      chart_line[1].style.opacity = 1
      chart_line[2].style.opacity = 1

      chart_bar = svg_element.querySelector ".c3-chart-bar"
      chart_bar.style.opacity = 1

      confidencePositive = svg_element.querySelector ".c3-line-confidencePositive"
      confidencePositive.style.fill = "none"
      confidenceNegative = svg_element.querySelector ".c3-line-confidenceNegative"
      confidenceNegative.style.fill = "none"

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

    @inc = ( ) -> @bucket_size @bucket_size() + 1
    @dec = ( ) -> @bucket_size ((@bucket_size() - 1) || 1)

    return this
