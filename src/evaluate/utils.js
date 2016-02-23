"use strict";
const types = require("../data-types");

/**
 * Walks the prototype chain until it gets to the last obj before null.
 */
function getRootScope(env) {
  let outerEnv;
  while((outerEnv = Object.getPrototypeOf(env)) !== null) {
    env = outerEnv;
  }
  return env;
}

/**
 * Set up bindings on an environment. Supports limited destructuring.
 */
function bind(env, bindings, evaluator) {
  if(!types.isVector(bindings))
    throw new SyntaxError("Binding forms must be given in a vector.");

  if(bindings.size % 2 !== 0)
    throw new SyntaxError("There must be an even number of items in a bindings vector.");

  for(let i = 0; i < bindings.size; i+=2) {
    let bindingForm = bindings.get(i);
    let initExpr = bindings.get(i+1);

    // Note: we use Object.defineProperty to add the value as a *non-writeable*
    // property, while also avoiding the override mistake if we're shadowing.
    // See: https://esdiscuss.org/topic/set-and-inherited-readonly-data-properties
    if(bindingForm instanceof types.Symbol) {
      Object.defineProperty(env, bindingForm.get('name'), {value: evaluator(initExpr) });
    }
  }
}


module.exports = {getRootScope, bind};
