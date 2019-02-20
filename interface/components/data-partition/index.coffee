require "./index.styl"

ko.components.register "tf-data-partition",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.show_partition
      throw new TypeError "components/data_partition:
      expects [show_partition] to be observable"
    unless ko.isObservable params.model
      throw new TypeError "components/data_partition:
      expects [model] to be observable"

    model = params.model
    @show_partition = params.show_partition
    # Partition amount
    # TODO (justint) edge case if percentage is not whole number row
    @fit_p = ko.observable 100
    @cross_p = ko.observable 0
    @validate_p = ko.observable 0
    @fit_row_start = ko.computed () ->
      if model() != undefined then 1 else 0
    @fit_row_end = ko.computed () ->
      if model() != undefined && model().rows != undefined
      then model().rows.length
      else 0
    # Errors
    @error_msg = ko.observable undefined
    @fit_invalid = ko.observable undefined
    @cross_invalid = ko.observable undefined
    @validate_invalid = ko.observable undefined

    check_partition_valid = () ->
      !@fit_invalid() ||
      !@cross_invalid() ||
      !@validate_invalid() ||
      (@fit_p() + @cross_p() + @validate_p() < 0) ||
      (@fit_p() + @cross_p() + @validate_p()  > 100)

    @change_fit_partition = ( ) ->
      @fit_invalid(!@fit_p() || isNaN(@fit_p()))
      if check_partition_valid()
        @error_msg("Invalid fit partition percentage")
    
    @change_cross_partition = ( ) ->
      @cross_invalid(!@cross_p() || isNaN(@cross_p()))
      if check_partition_valid()
        @error_msg("Invalid fit partition percentage")
    
    @change_validate_partition = ( ) ->
      @validate_invalid(!@validate_p() || isNaN(@cross_p()))
      if check_partition_valid()
        @error_msg("Invalid fit partition percentage")
    
    @import_dataset = ( ) ->


    # Check if data partition popup should render
    @active = ko.computed ( ) =>
      @show_partition() != undefined && @show_partition() != false

    return this
