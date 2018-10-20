require "./index.styl"
Model = require "../Model"

ko.components.register "tf-transform",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.model
      throw new TypeError "components/transform:
      expects [model] to be observable"

    model = params.model() # now static
    columns = model.columns
    data_fit = model.data_fit
    @transform_index = model.show_transform

    # Check if transform popup should render
    @active = ko.computed ( ) => @transform_index() != undefined

    gen_column = ( label, index ) ->
      cols = columns()
      ncols = cols.length
      transform_col = cols[index]
      transform_name = "#{label}(#{transform_col.name})"
      transform_index = ncols
      return {
        name: transform_name,
        index: transform_index
      }

    @close = ( ) ->
      model.show_transform(undefined)

    @transform_log = ( index ) ->
      transform_col = gen_column("log", index)
      cols.push(transform_col)
      model.transform_log(index)
      # Need to append new column name and connect new column with existing column
      model.columns(cols)
      @close()
    
    @k_order_diff = ( index ) ->
      transform_col = gen_column("K-Order", index)
      cols = columns()
      cols.push(transform_col)
      model.transform_log(index)
      # Need to append new column name and connect new column with existing column
      model.columns(cols)
      @close()

    @studentize = ( index ) ->
      transform_col = gen_column("Studentize", index)
      cols = columns()
      cols.push(transform_col)
      model.transform_log(index)
      # Need to append new column name and connect new column with existing column
      model.columns(cols)
      @close()

    @normalize = ( index) ->
      transform_col = gen_column("Normalize", index)
      cols = columns()
      cols.push(transform_col)
      model.transform_log(index)
      # Need to append new column name and connect new column with existing column
      model.columns(cols)
      @close()
    
    @transform_index.subscribe ( next ) =>
      if next then adapter.unsubscribeToChanges()
      else adapter.subscribeToChanges()

    return this
