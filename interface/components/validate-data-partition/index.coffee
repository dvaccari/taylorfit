require "./index.styl"

ko.components.register "tf-validate-data-partition",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.show_validate_partition
      throw new TypeError "components/validate_data_partition:
      expects [show_validate_partition] to be observable"
    unless ko.isObservable params.model
      throw new TypeError "components/validate_data_partition:
      expects [model] to be observable"

    model = params.model
    @show_partition = params.show_validate_partition
    # Partition amount
    @validate_p = ko.observable 100
    @validate_row_start = ko.observable undefined
    @validate_row_end = ko.observable undefined
    # Errors
    @error_msg = ko.observable undefined
    @validate_invalid = ko.observable false

    check_split_valid = ( num ) ->
      num != undefined &&
      num != null &&
      num >= 0 &&
      num <= 100 &&
      !isNaN(num)
    
    @change_validate_partition = ( ) ->
      validate_partition = Number(@validate_p())
      validate_split_invalid = !check_split_valid(validate_partition)
      @validate_invalid(validate_split_invalid)
      sum_partition = validate_partition
      is_invalid_partition =
        validate_split_invalid ||
        sum_partition < 0 ||
        sum_partition > 100
      if is_invalid_partition
        @error_msg("Invalid validate partition percentage")
      else
        @error_msg(undefined)
        if validate_partition == 0
          @validate_row_start(undefined)
          @validate_row_end(undefined)
        else
          data_rows = model().rows.length
          partition_percentage = validate_partition / 100
          num_rows = Math.round(data_rows * partition_percentage)
          init_start_row = @validate_row_start()
          start_row = if init_start_row
          then init_start_row
          else 1
          if init_start_row == undefined
            @validate_row_start(start_row)
          end_row = if data_rows <= start_row + num_rows then data_rows else start_row + num_rows
          @validate_row_end(end_row)
    
    @change_validate_start_row = ( ) ->
      validate_row_start = Number(@validate_row_start())
      validate_row_end = Number(@validate_row_end())
      data_rows = model().rows.length
      if validate_row_start == undefined
        @error_msg("Validate start row is not defined")
      else if validate_row_start < 1
        @error_msg("Validate start row has to be at least 1")
      else if validate_row_start > data_rows
        @error_msg("Validate start row has to be less than or equal to " + data_rows)
      else if validate_row_start > validate_row_end
        @error_msg("Validate start row has to be less than the validate end row")
      else
        partition_percentage = Math.round((validate_row_end - validate_row_start + 1) / data_rows * 100)
        @validate_p(partition_percentage)
        @error_msg(undefined)

    @change_validate_end_row = ( ) ->
      validate_row_start = Number(@validate_row_start())
      validate_row_end = Number(@validate_row_end())
      data_rows = model().rows.length
      if validate_row_end == undefined
        @error_msg("Validate end row is not defined")
      else if validate_row_end < 1
        @error_msg("Validate end row has to be at least 1")
      else if validate_row_end > data_rows
        @error_msg("Validate end row has to be less than or equal to " + data_rows)
      else if validate_row_start > validate_row_end
        @error_msg("Validate end row has to be less than the validate end row")
      else
        partition_percentage = Math.round((validate_row_end - validate_row_start + 1) / data_rows * 100)
        @validate_p(partition_percentage)
        @error_msg(undefined)
    
    check_in_range = (num, start, end) ->
      # The other partition is not partitioned
      if (start == 0 && end == 0)
        false
      else
        num >= start && num <= end
    
    @import_validate_dataset = ( ) ->
      validate_p = Number(@validate_p()) || 0
      validate_row_start = Number(@validate_row_start()) || 0
      validate_row_end = Number(@validate_row_end()) || 0
      data_rows = model().rows.length
      # Check if percentage 0-100
      sum_p = validate_p
      if @validate_invalid()
        console.error "Validation partition is invalid"
        @error_msg("Validation partition is invalid")
        return false
      if (sum_p <= 0 || sum_p > 100)
        console.error "Total partition percentage must be between 1%-100%. The current partition is " + sum_p + "%"
        @error_msg("Total partition percentage must be between 1%-100%. The current partition is " + sum_p + "%")
        return false
      # Check that validate start and end row valid if has partition
      if (validate_row_start != 0 || validate_row_end != 0)
        if (validate_row_start == 0 || validate_row_start > data_rows)
          console.error "Validate start row is not between 1-" + data_rows
          @error_msg("Validate start row is not between 1-" + data_rows)
          return false
          console.error "Validate end row is not between 1-" + data_rows
        else if (validate_row_end == 0 || validate_row_end > data_rows)
          @error_msg("Validate end row is not between 1-" + data_rows)
          return false
      # Partition ranges are valid
      params.parent.import_validate_partition(
        validate_row_start,
        validate_row_end,
      )
      return true

    # Check if data partition popup should render
    @active = ko.computed ( ) =>
      @show_partition() != undefined && @show_partition() != false

    model.subscribe ( nextModel ) =>
      if nextModel != undefined
        @validate_row_start(1)
        if nextModel.rows != undefined
          @validate_row_end(nextModel.rows.length)

    return this
