require "./index.styl"
c3 = require "c3"
Model = require "../Model"

ko.components.register "tf-graph",
  template: "<span></span>"
  viewModel:
    createViewModel: ( params, { element } ) ->

      # TODO: check for observability
      data = params.data
      
      #calculate histogram
      getbuckets = (data) =>
          data_predicted = []
          for i in [0...data.length]
            data_predicted[i] = data[i][0]
          data_predicted.sort (a, b) -> a - b
          
          min = data_predicted[0]
          max = data_predicted[data_predicted.length - 1]
          bucket_size = Math.ceil(Math.log2(data_predicted.length)) + 1
          buckets_width = (max-min)/bucket_size
          hist_labels = []
          for i in [0...bucket_size-1]
            n = (min + (i*buckets_width)).toFixed(2)
            hist_labels[i] = n
          hist_labels.push(max.toFixed(2))

          buckets = []
          for i in [0...bucket_size]
            buckets[i] = 0
          for i in [0...data.length]
            counter = Math.floor((data_predicted[i] - min) / buckets_width)
            buckets[counter] = buckets[counter]+1

          return buckets
        
      get_hist_labels = (data) =>
          result = []
          data_predicted = []
          for i in [0...data.length]
            data_predicted[i] = data[i][0]
          data_predicted.sort (a, b) -> a - b
          
          min = data_predicted[0]
          max = data_predicted[data_predicted.length - 1]
          bucket_size = Math.ceil(Math.log2(data_predicted.length)) + 1
          buckets_width = (max-min)/bucket_size
          
          for i in [0...bucket_size]
            n = (min + (i*buckets_width)).toFixed(2)
            result[i] = n
          return result
      
      sort_data_in_next = (data) =>
          data_length = data[0].length
          if data_length == 2
              return [data]
          else if data_length == 4
              listone = []
              listtwo = []
              for i in [0...data.length]
                if(data[i][0] != null && data[i][1] != null)
                    listone[i] = [data[i][0], data[i][1]]
                if(data[i][2] != null && data[i][3] != null)
                    listtwo[i] = [data[i][2], data[i][3]]

              return [listone, listtwo]
          else if data_length == 6
              listone = []
              listtwo = []
              listthree = []
              for i in [0...data.length]
                if(data[i][0] != null && data[i][1] != null)
                    listone[i] = [data[i][0], data[i][1]]
                if(data[i][1] != null && data[i][2] != null)
                    listtwo[i] = [data[i][2], data[i][3]]
                if(data[i][4] != null && data[i][5] != null)
                    listthree[i] = [data[i][4], data[i][5]]
                

              return [listone, listtwo, listthree]
                
            
      data_predicted = []
      for i in [0...data().length]
        data_predicted[i] = data()[i][0]
      data_predicted.sort (a, b) -> a - b
      data_residual = []
      for i in [0...data().length]
        data_residual[i] = data()[i][1]
      data_residual.sort (a, b) -> a - b
        
      min = data_predicted[0]
      max = data_predicted[data_predicted.length - 1]
      bucket_size = Math.ceil(Math.log2(data_predicted.length)) + 1
      buckets_width = (max-min)/bucket_size
      
      hist_labels = []
      for i in [0...bucket_size-1]
        n = (min + (i*buckets_width)).toFixed(2)
        hist_labels[i] = n
      hist_labels.push(max.toFixed(2))
    
      buckets = []
      for i in [0...bucket_size]
        buckets[i] = 0
      for i in [0...data().length]
        counter = Math.floor((data_predicted[i] - min) / buckets_width)
        buckets[counter] = buckets[counter]+1

      row_labels = params.row_labels
      hist_legend = row_labels().slice(1)

      #calculate autocorrelation
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

      calculateAutoCorrelation = (values, k) ->
        mu = mean(values)
        normal_values = values.slice(0,values.length - k)
        skipped_values = values.slice(k)

        sum = 0
        i = 0
        while i < normal_values.length
          sum += (normal_values[i] - mu) * (skipped_values[i] - mu)
          i++
        sum /= values.length
        sum /= variance(values, mu)
        return sum

      calculateStandardError = (acf, numValues) ->
        i = 0
        errors = []
        sum = 0
        while i < acf.length
          sum += acf[i] * acf[i]
          errors[i] = Math.sqrt((1 + 2 * sum) / numValues)

          i++
        console.log(errors)
        return errors

      autoc_data_predicted = []
      for i in [0...data().length]
        autoc_data_predicted[i] = data()[i][0]
      filtered = autoc_data_predicted.filter((x) => !isNaN(x))
      autoc_bucket_size = 10
      
      autoc_buckets = []
      for i in [0...autoc_bucket_size]
        autoc_buckets[i] = 0
    
      i=0
      k = autoc_bucket_size
      while i < k
        autoc_buckets[i] = calculateAutoCorrelation(filtered, i+1)
        i++
      z_score = 3
      errors = calculateStandardError(autoc_buckets, filtered.length)
      errors = errors.map((value) => value * z_score)
      negativeErrors = errors.map((value) => value * -1)
      autoc_labels = Array(bucket_size).fill(0).map((x, index) => index + 1)

      #update graph
      row_labels.subscribe ( next ) ->  
        try
          if global.chart == chart_scatter   
              chart.load
                xs: getxs()
                rows: [next].concat data()
          else if global.chart == chart_histogram
            data_sorted = sort_data_in_next(data())
            if data_sorted.length == 1
                chart.load
                    x: 'x'
                    columns: [
                                ['x'].concat(get_hist_labels(data_sorted[0])),
                                ["Fit Data"].concat(getbuckets(data_sorted[0]))
                             ]
            else if data_sorted.length == 2
                chart.load
                    x: 'x'
                    columns: [
                                ['x'].concat(get_hist_labels(data_sorted[0].concat(data_sorted[1]))),
                                ["Fit Data"].concat(getbuckets(data_sorted[0])),
                                ["Cross Data"].concat(getbuckets(data_sorted[1]))
                             ]
            else if data_sorted.length == 3
                chart.load
                    x: 'x'
                    columns: [
                                ['x'].concat(get_hist_labels( data_sorted[0].concat(data_sorted[1]).concat(data_sorted[2]) )),
                                ["Fit Data"].concat(getbuckets(data_sorted[0])),
                                ["Cross Data"].concat(getbuckets(data_sorted[1])),
                                ["Validation Data"].concat(getbuckets(data_sorted[2]))
                             ]
        catch error
          console.error error
        

      getxs = () =>
        xs = []
        labels = row_labels()
        for i in [0...labels.length / 2]
          xs[labels[i * 2 + 1]] = labels[i * 2]
        return xs
    
      #Default: Scatter plot with C3
      chart_scatter = c3.generate
        data:
          type: "scatter"
          xs: getxs()
          rows: [row_labels()].concat data()
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
      #Scatter Plot End here

      #Histogram Plot with C3
      data_sorted = sort_data_in_next(data())
      chart_histogram = c3.generate
        data:
          type: 'bar'
          x: 'x'
          columns:
            [
              ['x'].concat(hist_labels), 
              [hist_legend].concat(buckets)
            ]
        axis:
          x:
            label:
              text: params.xlabel
              position: "outer-center"
            type: 'category'
            tick:
              count: 5
          y:
            label:
              position: "outer-middle"
            min: 0
            padding:
              top: 0
              bottom: 0
        legend:
          show: true
          position: "inset"
      #Histogram Plot End here
       
            
      #Autocorrelation Plot generation
      chart_autoc = c3.generate
        bindto: "#autocorrelation"
        data:
          x: "x"
          columns: [
            ["x"].concat(autoc_labels),
            [hist_legend].concat(autoc_buckets),
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
          show: true
          position:"inset"

      #Autocorrelation plot Ends here
        
      #Display Default Plot
      global.chart = chart_scatter
      element.appendChild chart.element
      currchart = chart_scatter
      
      global.changeGraph = () ->
        e = document.getElementById("graphs")
        selectedvalue = e.options[e.selectedIndex].value
        if selectedvalue == "histogram"
            
            element.removeChild currchart.element
            global.chart = chart_histogram
            currchart = chart_histogram
            element.appendChild chart.element
        else if selectedvalue == "scatter"
            element.removeChild currchart.element
            global.chart = chart_scatter
            currchart = chart_scatter
            element.appendChild chart.element
        else if selectedvalue == "autocorrelation"
            element.removeChild currchart.element
            global.chart = chart_autoc
            currchart = chart_autoc
            element.appendChild chart.element
      
        
        
      download_chart = () ->
        svg_element = global.chart.element.querySelector "svg"
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

        temp_height = svg_element.style.height
        if temp_height.substring(0,temp_height.length-2) > 370 
          svg_element.style.height = 368

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
          if fit_legend
            fit_legend.onclick = fit_legend_VS

          cross_legend_VS = () -> 
            if cross_visible == true
              cross_visible = false
            else
              cross_visible = true
            return
          if cross_legend
            cross_legend.onclick = cross_legend_VS

          validation_legend_VS = () -> 
            if validation_visible == true
              validation_visible = false
            else
              validation_visible = true
            return
          if validation_legend
            validation_legend.onclick = validation_legend_VS
          ), 1000
          
      return { }

    
    
    
    
    
