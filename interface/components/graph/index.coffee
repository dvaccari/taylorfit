require "./index.styl"
c3 = require "c3"
Model = require "../Model"

ko.components.register "tf-graph",
  template: "<span></span>"
  viewModel:
    createViewModel: ( params, { element } ) ->

      # TODO: check for observability
      data = params.data
      console.log("check here for data: ")
      console.log(data())
      
      getbuckets = (data) =>
          data_predicted = []
          for i in [0...data.length]
            data_predicted[i] = data[i][0]
          data_predicted.sort (a, b) -> a - b
          
          min = data_predicted[0]
          max = data_predicted[data_predicted.length - 1]+1
          bucket_size = 10
          buckets_width = (max-min)/bucket_size
          console.log("data_predicted")
          console.log(data_predicted)
          console.log("max, min")
          console.log(max)
          console.log(min)
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
          console.log("bucket within function")
          console.log(buckets)
          return buckets
        
      get_hist_labels = (data) =>
          result = []
          data_predicted = []
          for i in [0...data.length]
            data_predicted[i] = data[i][0]
          data_predicted.sort (a, b) -> a - b
          
          min = data_predicted[0]
          max = data_predicted[data_predicted.length - 1]+1
          console.log("min, max within hist labels:")
          console.log(min)
          console.log(max)
          bucket_size = 10
          buckets_width = (max-min)/bucket_size
          
          for i in [0...bucket_size]
            n = (min + (i*buckets_width)).toFixed(2)
            console.log("i: " + i)
            console.log("n: " + n)
            console.log(buckets_width)
            result[i] = n
          console.log("hist_labels: ")
          console.log(result)
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
              console.log("result")
              console.log([listone, listtwo])
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
                
              console.log("result")
              console.log([listone, listtwo, listthree])
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
      max = data_predicted[data_predicted.length - 1]+1
      bucket_size = 10
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

      
      
      console.log("buckets_width: ")
      console.log(buckets_width)
      console.log("labels: ")
      console.log(hist_labels)
      console.log("buckets: ")
      console.log(buckets)
      console.log("labels")
      console.log(['x'].concat(hist_labels))
      console.log("concat2")
      
    
      row_labels = params.row_labels
      hist_legend = row_labels().slice(1)
      console.log("row_labels")
      console.log(row_labels())
      console.log("hist_legend")
      console.log(hist_legend)


      row_labels.subscribe ( next ) ->  
        try
          if global.chart == chart_scatter   
              chart.load
                xs: getxs()
                rows: [next].concat data()
                console.log("row_labels within next")
                console.log(row_labels())
                console.log("xs")
                console.log(getxs())
                console.log("data within next")
                console.log(data())
          else if global.chart == chart_histogram
            console.log("I AM IN SIDE HISTOGRAM NEXT")  
            console.log("data within next")
            console.log(data())
            data_sorted = sort_data_in_next(data())
            console.log("data_sorted len")
            console.log(data_sorted.length)
            if data_sorted.length == 1
                console.log("buckets in MOTION")
                console.log(getbuckets(data_sorted[0]))
                console.log("datasorted0")
                console.log(data_sorted[0])
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

      #Display Default Plot
      global.chart = chart_scatter
      element.appendChild chart.element
      
      global.changeGraph = () ->
        e = document.getElementById("graphs")
        selectedvalue = e.options[e.selectedIndex].value
        console.log("hello, check here")
        console.log(selectedvalue)
        if selectedvalue == "histogram"
            console.log("IN IF STATEMENT OF HISTOGRAM")
            element.removeChild chart.element
            global.chart = chart_histogram
            element.appendChild chart.element
        else if selectedvalue == "scatter"
            console.log("IN IF STATEMENT OF SCATTER")
            element.removeChild chart.element
            global.chart = chart_scatter
            element.appendChild chart.element
        
      return ""

    
    
    
    
    
