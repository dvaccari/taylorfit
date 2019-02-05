require "./index.styl"

ko.components.register "tf-data-partition",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.show_partition
      throw new TypeError "components/data_partition:
      expects [show_partition] to be observable"

    @show_partition = params.show_partition
    # Partition amount
    @fit_p = ko.observable 100
    @cross_p = ko.observable 0
    @validate_p = ko.observable 0
    # Errors
    @error_msg = ko.observable undefined
    @fit_invalid = ko.observable undefined
    @cross_invalid = ko.observable undefined
    @validate_invalid = ko.observable undefined

    @change_partition = ( ) ->
      @fit_invalid(!@fit_p() || isNaN(@fit_p()))
      @cross_invalid(!@cross_p() || isNaN(@cross_p()))
      @validate_invalid(!@validate_p() || isNaN(@cross_p()))
      invalid = @fit_invalid() || @cross_invalid() || @validate_invalid()
      if invalid
        @error_msg("Invalid partition percentage")

    @import_dataset = ( ) ->


    # Check if data partition popup should render
    @active = ko.computed ( ) => @show_partition() != undefined && @show_partition() != false
  
    return this
