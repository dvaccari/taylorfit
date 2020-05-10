require "./index.styl"

ko.components.register "tf-fit-data-partition",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.show_fit_partition
      throw new TypeError "components/fit_data_partition:
      expects [show_fit_partition] to be observable"
    unless ko.isObservable params.model
      throw new TypeError "components/fit_data_partition:
      expects [model] to be observable"

    model = params.model
    @show_partition = params.show_fit_partition
    # Partition amount
    @fit_p = ko.observable 100
    @fit_row_start = ko.observable undefined
    @fit_row_end = ko.observable undefined
    # Errors
    @error_msg = ko.observable undefined
    @fit_invalid = ko.observable false

    check_split_valid = ( num ) ->
      num != undefined &&
      num != null &&
      num >= 0 &&
      num <= 100 &&
      !isNaN(num)
    
    @change_fit_partition = ( ) ->
      fit_partition = Number(@fit_p())
      fit_split_invalid = !check_split_valid(fit_partition)
      @fit_invalid(fit_split_invalid)
      sum_partition = fit_partition
      is_invalid_partition =
        fit_split_invalid ||
        sum_partition < 0 ||
        sum_partition > 100
      if is_invalid_partition
        @error_msg("Invalid fit partition percentage")
      else
        @error_msg(undefined)
        if fit_partition == 0
          @fit_row_start(undefined)
          @fit_row_end(undefined)
        else
          data_rows = model().rows.length
          partition_percentage = fit_partition / 100
          num_rows = Math.round(data_rows * partition_percentage)
          init_start_row = @fit_row_start()
          start_row = if init_start_row
          then init_start_row
          else 1
          if init_start_row == undefined
            @fit_row_start(start_row)
          end_row = if data_rows <= start_row + num_rows then data_rows else start_row + num_rows
          @fit_row_end(end_row)
    
    @change_fit_start_row = ( ) ->
      fit_row_start = Number(@fit_row_start())
      fit_row_end = Number(@fit_row_end())
      data_rows = model().rows.length
      if fit_row_start == undefined
        @error_msg("fit start row is not defined")
      else if fit_row_start < 1
        @error_msg("fit start row has to be at least 1")
      else if fit_row_start > data_rows
        @error_msg("fit start row has to be less than or equal to " + data_rows)
      else if fit_row_start > fit_row_end
        @error_msg("fit start row has to be less than the fit end row")
      else
        partition_percentage = Math.round((fit_row_end - fit_row_start + 1) / data_rows * 100)
        @fit_p(partition_percentage)
        @error_msg(undefined)

    @change_fit_end_row = ( ) ->
      fit_row_start = Number(@fit_row_start())
      fit_row_end = Number(@fit_row_end())
      data_rows = model().rows.length
      if fit_row_end == undefined
        @error_msg("fit end row is not defined")
      else if fit_row_end < 1
        @error_msg("fit end row has to be at least 1")
      else if fit_row_end > data_rows
        @error_msg("fit end row has to be less than or equal to " + data_rows)
      else if fit_row_start > fit_row_end
        @error_msg("fit end row has to be less than the fit end row")
      else
        partition_percentage = Math.round((fit_row_end - fit_row_start + 1) / data_rows * 100)
        @fit_p(partition_percentage)
        @error_msg(undefined)
    
    check_in_range = (num, start, end) ->
      # The other partition is not partitioned
      if (start == 0 && end == 0)
        false
      else
        num >= start && num <= end

    
    @import_fit_dataset = ( ) ->
      fit_p = Number(@fit_p()) || 0
      fit_row_start = Number(@fit_row_start()) || 0
      fit_row_end = Number(@fit_row_end()) || 0
      data_rows = model().rows.length
      # Check if percentage 0-100
      sum_p = fit_p
      if @fit_invalid()
        console.error "Fit partition is invalid"
        @error_msg("Fit partition is invalid")
        return false
      if (sum_p <= 0 || sum_p > 100)
        console.error "Total partition percentage must be between 1%-100%. The current partition is " + sum_p + "%"
        @error_msg("Total partition percentage must be between 1%-100%. The current partition is " + sum_p + "%")
        return false
      # Check that fit start and end row valid if has partition
      if (fit_row_start != 0 || fit_row_end != 0)
        if (fit_row_start == 0 || fit_row_start > data_rows)
          console.error "fit start row is not between 1-" + data_rows
          @error_msg("fit start row is not between 1-" + data_rows)
          return false
          console.error "fit end row is not between 1-" + data_rows
        else if (fit_row_end == 0 || fit_row_end > data_rows)
          @error_msg("fit end row is not between 1-" + data_rows)
          return false
      # Partition ranges are valid
      params.parent.import_fit_partition(
        fit_row_start,
        fit_row_end,
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
        @fit_row_start(1)
        if nextModel.rows != undefined
          @fit_row_end(nextModel.rows.length)

    return this
