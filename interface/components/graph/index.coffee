require "./index.styl"

c3 = require "c3"

ko.components.register "tf-graph",
  template: "<span></span>"
  viewModel:
    createViewModel: ( params, { element } ) ->

      # TODO: check for observability
      data = params.data
      row_labels = params.row_labels

      row_labels.subscribe ( next ) ->
        try
          chart.load
            xs: getxs()
            rows: [next].concat data()
        catch error
          console.error error

      getxs = () =>
        xs = []
        labels = row_labels()
        for i in [0...labels.length / 2]
          xs[labels[i * 2 + 1]] = labels[i * 2]
        return xs

      chart = c3.generate
        data:
          type: "scatter"
          xs: getxs()
          rows: [row_labels()].concat data() or [ 0, 0, 0 ]
        axis:
          x:
            label:
              text: params.xlabel
              position: "outer-center"
            tick:
              fit: false
              count: 2
              format: ko.formatters.float
              rotate: 0
          y:
            label:
              text: params.ylabel
              position: "outer-middle"
            tick:
              count: 2
              format: ko.formatters.float
              rotate: 90
        legend:
          show: true
          position: "inset"
        grid:
          y:
            lines: [
              value: 0
            ]
        tooltip:
          contents: ( [ d ] ) ->
            return "(#{ko.formatters.float d.x},
            #{ko.formatters.float d.value})"

      global.chart = chart

      element.appendChild chart.element

      download_chart = () ->
        svg_element = chart.element.querySelector "svg"
        original_height = svg_element.getAttribute "height" 
        original_width = svg_element.getAttribute "width" 

        # get real height/width of a overflow
        svg_element.removeAttribute "height"
        svg_element.removeAttribute "width"
        svg_element.style.overflow = "visible"

        svg_element.style.padding = "10px"
        box_size = svg_element.getBBox()

        svg_element.style.height = box_size.height + 20 
        svg_element.style.width = box_size.width + 20

        legend_background = svg_element.querySelector ".c3-legend-background"
        legend_background.style.display = "none"

        node_list1 = svg_element.querySelectorAll ".c3-chart path"
        node_list2 = svg_element.querySelectorAll ".c3-axis path"
        node_list3 = svg_element.querySelectorAll ".c3 line"

        x_and_y = Array.from node_list2
        x_and_y.concat Array.from node_list3
        x_and_y.forEach (e) ->
          e.style.fill = "none"
          e.style.stroke = "black"
        console.log(svg_element.style.backgroundColor)
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
          document.body.appendChild(a_element)
          a_element.click()
          a_element.remove()

      download_button = document.createElement "button"
      download_button.innerText = "DOWNLOAD"
      download_button.onclick = download_chart

      element.appendChild download_button

      return { }
