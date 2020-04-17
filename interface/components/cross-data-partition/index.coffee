require "./index.styl"

ko.components.register "tf-cross-data-partition",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.show_cross_partition
      throw new TypeError "components/cross_data_partition:
      expects [show_cross_partition] to be observable"
    unless ko.isObservable params.model
      throw new TypeError "components/cross_data_partition:
      expects [model] to be observable"

    model = params.model
    @show_partition = params.show_cross_partition
    # Partition amount
    @cross_p = ko.observable 100
    @cross_row_start = ko.observable undefined
    @cross_row_end = ko.observable undefined
    # Errors
    @error_msg = ko.observable undefined
    @cross_invalid = ko.observable false

    check_split_valid = ( num ) ->
      num != undefined &&
      num != null &&
      num >= 0 &&
      num <= 100 &&
      !isNaN(num)
    
    @change_cross_partition = ( ) ->
      cross_partition = Number(@cross_p())
      cross_split_invalid = !check_split_valid(cross_partition)
      @cross_invalid(cross_split_invalid)
      sum_partition = cross_partition
      is_invalid_partition =
        cross_split_invalid ||
        sum_partition < 0 ||
        sum_partition > 100
      if is_invalid_partition
        @error_msg("Invalid cross partition percentage")
      else
        @error_msg(undefined)
        if cross_partition == 0
          @cross_row_start(undefined)
          @cross_row_end(undefined)
        else
          data_rows = model().rows.length
          partition_percentage = cross_partition / 100
          num_rows = Math.round(data_rows * partition_percentage)
          init_start_row = @cross_row_start()
          start_row = if init_start_row
          then init_start_row
          else 1
          if init_start_row == undefined
            @cross_row_start(start_row)
          end_row = if data_rows <= start_row + num_rows then data_rows else start_row + num_rows
          @cross_row_end(end_row)
    
    @change_cross_start_row = ( ) ->
      cross_row_start = Number(@cross_row_start())
      cross_row_end = Number(@cross_row_end())
      data_rows = model().rows.length
      if cross_row_start == undefined
        @error_msg("cross start row is not defined")
      else if cross_row_start < 1
        @error_msg("cross start row has to be at least 1")
      else if cross_row_start > data_rows
        @error_msg("cross start row has to be less than or equal to " + data_rows)
      else if cross_row_start > cross_row_end
        @error_msg("cross start row has to be less than the cross end row")
      else
        partition_percentage = Math.round((cross_row_end - cross_row_start + 1) / data_rows * 100)
        @cross_p(partition_percentage)
        @error_msg(undefined)

    @change_cross_end_row = ( ) ->
      cross_row_start = Number(@cross_row_start())
      cross_row_end = Number(@cross_row_end())
      data_rows = model().rows.length
      if cross_row_end == undefined
        @error_msg("cross end row is not defined")
      else if cross_row_end < 1
        @error_msg("cross end row has to be at least 1")
      else if cross_row_end > data_rows
        @error_msg("cross end row has to be less than or equal to " + data_rows)
      else if cross_row_start > cross_row_end
        @error_msg("cross end row has to be less than the cross end row")
      else
        partition_percentage = Math.round((cross_row_end - cross_row_start + 1) / data_rows * 100)
        @cross_p(partition_percentage)
        @error_msg(undefined)
    
    check_in_range = (num, start, end) ->
      # The other partition is not partitioned
      if (start == 0 && end == 0)
        false
      else
        num >= start && num <= end

    
    @import_cross_dataset = ( ) ->
      cross_p = Number(@cross_p()) || 0
      cross_row_start = Number(@cross_row_start()) || 0
      cross_row_end = Number(@cross_row_end()) || 0
      data_rows = model().rows.length
      # Check if percentage 0-100
      sum_p = cross_p
      if @cross_invalid()
        console.error "cross partition is invalid"
        @error_msg("cross partition is invalid")
        return false
      if (sum_p <= 0 || sum_p > 100)
        console.error "Total partition percentage must be between 1%-100%. The current partition is " + sum_p + "%"
        @error_msg("Total partition percentage must be between 1%-100%. The current partition is " + sum_p + "%")
        return false
      # Check that cross start and end row valid if has partition
      if (cross_row_start != 0 || cross_row_end != 0)
        if (cross_row_start == 0 || cross_row_start > data_rows)
          console.error "cross start row is not between 1-" + data_rows
          @error_msg("cross start row is not between 1-" + data_rows)
          return false
          console.error "cross end row is not between 1-" + data_rows
        else if (cross_row_end == 0 || cross_row_end > data_rows)
          @error_msg("cross end row is not between 1-" + data_rows)
          return false
      # Partition ranges are valid
      params.parent.import_cross_partition(
        cross_row_start,
        cross_row_end,
      )
      window.location.reload()
      return true
    
    @close_window = ( ) ->
      @show_partition(false)
      window.location.reload()

    # Check if data partition popup should render
    @active = ko.computed ( ) =>
      @show_partition() != undefined && @show_partition() != false

    model.subscribe ( nextModel ) =>
      if nextModel != undefined
        @cross_row_start(1)
        if nextModel.rows != undefined
          @cross_row_end(nextModel.rows.length)

    return this
