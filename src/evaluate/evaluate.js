"use strict";
var types = require('../data-types');

// Define our special forms.
const specialForms = {
  if(env, rest) {
    const test = evaluate(rest.get(0), env);
    if(test === false || test === null)
      return evaluate(rest.get(2), env);

    else
      return evaluate(rest.get(1), env);
  },

  quote(env, rest) {
    return rest.get(0);
  },

  /**
   * Note: our def is dramatically simpler than clojure's.
   * In particular, because we don't have multiple mutable
   * value types (vars, refs, agents, etc), and aren't
   * dealing with threads, we don't introduce the concept
   * of a "var object" in addition to a symbol and its
   * currently bound value.
   */
  def(env, rest) {
    env[rest.get(0).get('name')] =
      rest.get(1) !== undefined ? evaluate(rest.get(1), env) : undefined;

    return rest.get(0);
  }
};

function evaluate(expr, env) {
  // treat symbols like variables to be looked up
  // (See comment on the def special form).
  if(expr instanceof types.Symbol) {
    const val = env[expr.get('name')];
    if(val === undefined)
      throw new Error("Can't lookup a symbol's value before its set.")

    return val;
  }

  // for lists, check for special forms; otherwise treat as a procedure call.
  if(expr instanceof types.List && !types.isVector(expr)) {
    if(expr.size === 0) // This approach might be problematic once we have lazy seqs.
      return expr;

    if(expr.get(0) instanceof types.Symbol && specialForms[expr.get(0).get('name')])
      return specialForms[expr.get(0).get('name')](env, expr.shift());

    else {
      const fn = evaluate(expr.get(0), env);
      const args = expr.shift().map(v => evaluate(v, env)).toArray();
      return fn.apply(null, args);
    }
  }

  // For all other types (i.e. keywords, vector literals,
  // numbers, strings, booleans, and nil, return them as parsed).
  return expr;
}

module.exports = evaluate;
