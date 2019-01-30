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

        svg_element.style.height = box_size.height + 15
        svg_element.style.width = box_size.width + 15

        legend_background = svg_element.querySelector ".c3-legend-background"
        legend_background.style.display = "none"
        
        ygrid_line = svg_element.querySelector ".c3-ygrid-line"
        ygrid_line.style.stroke = "black"

        node_list1 = svg_element.querySelectorAll ".c3-axis path"
        node_list2 = svg_element.querySelectorAll ".c3 line"

        x_and_y = Array.from node_list1
        x_and_y.concat Array.from node_list2
        x_and_y.forEach (e) ->
          e.style.fill = "none"
          e.style.stroke = "black"
        svg_element.style.backgroundColor = "white"
        
        tick = svg_element.querySelectorAll ".tick"
        text = tick[3].getElementsByTagName("text")
        original_y = text[0].getAttribute "y"
        text[0].setAttribute "y", original_y+3

        temp_height = svg_element.style.height

        if temp_height.substring(0,temp_height.length-2) > 400 
          fix_svg_height = 0
          box_size.height = box_size.height - 30
          new_height = (temp_height.substring(0,temp_height.length-2) - 60)
          svg_element.style.height = new_height

        if fit_visible == false
          fit_legend.style.display = "none"
        if cross_visible == false
          cross_legend.style.display = "none"
        if validation_visible == false
          validation_legend.style.display = "none"

        xml = new XMLSerializer().serializeToString svg_element
        data_url = "data:image/svg+xml;base64," + btoa xml
        
        # Reset to original values
        svg_element.style.padding = null
        text[0].setAttribute "y", original_y
        svg_element.setAttribute "height", original_height
        svg_element.setAttribute "width", original_width
        svg_element.style.backgroundColor = null
        if fit_visible == false
          fit_legend.style.display = "block";
        if cross_visible == false
          cross_legend.style.display = "block"
        if validation_visible == false
          validation_legend.style.display = "block"

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

      fit_visible = true
      cross_visible = true
      validation_visible = true
      
      window.onload = () ->
        setTimeout ( ->
          svg_element = chart.element.querySelector "svg"
          @fit_legend = svg_element.querySelector ".c3-legend-item-Fit-Data"
          @cross_legend = svg_element.querySelector ".c3-legend-item-Cross-Data" 
          @validation_legend = svg_element.querySelector ".c3-legend-item-Validation-Data" 
          
          fit_legend_VS = () -> 
            if fit_visible == true
              fit_visible = false
            else
              fit_visible = true
            return
          fit_legend.onclick = fit_legend_VS

          cross_legend_VS = () -> 
            if cross_visible == true
              cross_visible = false
            else
              cross_visible = true
            return
          cross_legend.onclick = cross_legend_VS

          validation_legend_VS = () -> 
            if validation_visible == true
              validation_visible = false
            else
              validation_visible = true
            return
          validation_legend.onclick = validation_legend_VS
          ), 1000
          
      return { }
