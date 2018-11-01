require "./index.styl"
Model = require "../Model"

Transformation = require "./label.json"

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
    transform_columns = model.transform_columns

    @k = ko.observable 1
    @invalid = false

    # Check if transform popup should render
    @active = ko.computed ( ) => @transform_index() != undefined

    gen_column = ( label, index, k = undefined ) ->
      cols = columns()
      ncols = cols.length
      transform_col = cols[index]
      transform_name = "#{label}(#{transform_col.name})"
      transform_index = ncols
      return {
        name: transform_name,
        index: transform_index,
        label: label,
        k: k,
      }

    # Function updates model transform_columns and associate the transform column to original column
    link_transform_column = ( original_index, transform_index ) ->
      curr_cols = transform_columns()
      curr_cols[original_index] = transform_index
      model.transform_columns(curr_cols)

    @close = ( ) ->
      model.show_transform(undefined)

    @change_k = ( ) ->
      @invalid = !@k() || isNaN(@k())

    @transform_log = ( index ) ->
      transform_col = gen_column(
        Transformation.LOG,
        index
      )
      cols = columns()
      cols.push(transform_col)
      model.transformLog({ index: index })
      # Need to append new column name and connect new column with existing column
      model.columns(cols)
      link_transform_column(index, transform_col.index)
      @close()
    
    @k_order_diff = ( index ) ->
      if !@invalid
        transform_col = gen_column(
          Transformation.K_ORDER_DIFFERENCE,
          index,
          Number(@k())
        )
        cols = columns()
        cols.push(transform_col)
        model.kOrderTransform({
          index: index,
          k: Number(@k())
        })
        # Need to append new column name and connect new column with existing column
        model.columns(cols)
        link_transform_column(index, transform_col.index)
        @k(1)
        @invalid = false
        @close()

    @standardize = ( index ) ->
      transform_col = gen_column(
        Transformation.STANDARDIZE,
        index
      )
      cols = columns()
      cols.push(transform_col)
      model.transformStandardize({ index: index })
      # Need to append new column name and connect new column with existing column
      model.columns(cols)
      link_transform_column(index, transform_col.index)
      @close()

    @rescale = ( index ) ->
      transform_col = gen_column(
        Transformation.RESCALE,
        index
      )
      cols = columns()
      cols.push(transform_col)
      model.transformRescale({ index: index })
      # Need to append new column name and connect new column with existing column
      model.columns(cols)
      link_transform_column(index, transform_col.index)
      @close()
    
    @transform_index.subscribe ( next ) ->
      if next then adapter.unsubscribeToChanges()
      else adapter.subscribeToChanges()

    return this
