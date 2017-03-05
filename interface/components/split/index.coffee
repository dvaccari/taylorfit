
require "./index.styl"

ko.bindingHandlers.split =
  init: ( element, accessor, bindings, model, context ) ->
    element.setAttribute "tf-split", true

    accessor = accessor()
    unless "object" is typeof accessor
      throw new Error "parameter must be object"

    direction = accessor.direction or "horizontal"

    unless direction in ["horizontal", "vertical"]
      throw new Error "direction must be
        'horizontal' or 'vertical'"

    element.setAttribute "direction", direction

    children = element.children

    if children.length isnt 2
      throw new Error "split must have
        2 static children"

    child1 = children[0]
    child2 = children[1]

    child1.onmouseover = ( ) ->
      child1.setAttribute "hover", true
      child2.setAttribute "hover", false
    child2.onmouseover = ( ) ->
      child1.setAttribute "hover", false
      child2.setAttribute "hover", true

