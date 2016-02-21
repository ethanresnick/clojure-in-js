"use strict";
var types = require('../data-types');
var asserts = require('./asserts');

// Define our special forms.
const specialForms = {
  if(env, rest) {
    asserts.arity([3], "if", rest);

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
   * of a "var object" that exists in addition to the symbol
   * and its currently bound value.
   *
   * Instead, we roughly simulate clojure's behavior by having
   * def always sets a (mutable) value at the _root_, even if
   * it's used from within a nested scope. This should encourage
   * the use let within procedures for immutable bindings.
   *
   * Finally, because we don't have vars, we return the bound
   * value rather than the var object.
   */
  def(env, rest) {
    asserts.arity([2], "def", rest);
    asserts.instanceof("First argument to def", rest.get(0), types.Symbol);

    // Note that we evaluate the expression in the current
    // scope to get the value we're going to bind, but we put
    // the binding on the root scope.
    const value = evaluate(rest.get(1), env);
    getRootScope(env)[rest.get(0).get('name')] = value;

    return value;
  },
  }
};


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
    // Handle the empty list.
    // This approach might be problematic once we have lazy seqs.
    if(expr.size === 0)
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


evaluate.getRootScope = getRootScope;
module.exports = evaluate;
