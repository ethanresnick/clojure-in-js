"use strict";
const types = require('../data-types');
const asserts = require('../util/asserts');

const specialFormChecks = {
  if(rest) {
    asserts.arity([3], "if", rest.size);
  },
  
  quote(rest) {
    asserts.arity([1], "quote", rest.size);
  },

  def(rest) {
    asserts.arity([2], "def", rest.size);
    asserts.instanceof("First argument to def", rest.get(0), types.Symbol);
  },

  let(rest) {
    asserts.minArity(2, "let", rest.size);
  },

  fn(rest) {
    asserts.minArity(2, "fn", rest.size);

    if(!types.isVector(rest.get(0)))
       throw new SyntaxError("The first argument to fn (the arguments) must be a vector.");
  }
}

module.exports = function validateAndExpand(expr) {
  // If we have a special form, run the assertions for it.
  if(types.isList(expr) && expr.get(0) instanceof types.Symbol && specialFormChecks[expr.get(0).get('name')]) {
    specialFormChecks[expr.get(0).get('name')](expr.shift());
  }

  return expr;
}