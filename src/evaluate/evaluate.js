"use strict";
const types = require('../data-types');
const asserts = require('./asserts');
const utils = require("./utils");

// Define our special forms.
const specialForms = {
  if(env, rest) {
    asserts.arity([3], "if", rest.size);

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
    asserts.arity([2], "def", rest.size);
    asserts.instanceof("First argument to def", rest.get(0), types.Symbol);

    // Note that we evaluate the expression in the current
    // scope to get the value we're going to bind, but we put
    // the binding on the root scope.
    const value = evaluate(rest.get(1), env);
    utils.getRootScope(env)[rest.get(0).get('name')] = value;

    return value;
  },

  do(env, rest) {
    // TODO: check whether map gaurantees to process the
    // items in order, or whether it just assumes that
    // there'll be no side effects & order's irrelevant.
    return rest.map(v => evaluate(v, env)).last();
  },

  /**
   * Let creates a new enviroment with the existing environment as
   * the new one's outer scope, and then adds some bindings to the
   * new environment, and evaluates its body in the new environment.
   *
   * Note: in Clojure, let binds sequentially, meaning that a
   * later-bound value can read earlier bindings and base its value
   * off of them. This is useful, but it's not applicable to function
   * calls, where all the arguments *need* to be evaluated independently
   * (though possibly in a fixed order, for side effects) and are
   * *already* being evaluated upfront, by evaluate. Therefore, if we
   * want to reuse the `let` form for handling creating a function's
   * local scope--which is highly useful, since let will also contain
   * a bunch of destructuring logic--we have to add a special flag
   * (the third argument) that lets us turn off sequential evaluation
   * and binding on function calls.
   */
  let(env, rest, fromFnCall) {
    asserts.minArity(2, "let", rest.size);

    const bindings = rest.get(0);
    const body = rest.shift();

    // Create the child env.
    const newEnv = Object.create(env);

    // Set up the local bindings.
    // Note: fromFnCall comes in here to affect our evaluation strategy.
    const evalStrategy = fromFnCall ? (it => it) : (it => evaluate(it, newEnv));
    utils.bind(newEnv, bindings, evalStrategy);

    // Now evaluate the body.
    return specialForms["do"](newEnv, body);
  },

  fn(env, rest) {
    asserts.minArity(2, "fn", rest.size);

    if(!types.isVector(rest.get(0)))
       throw new SyntaxError("The first argument to fn (the arguments) must be a vector.");

    return new types.Function(rest.get(0), rest.shift(), env, this.let);
  }
};

function evaluate(expr, env) {
  // treat symbols like variables to be looked up.
  // (See comment on the def special form).
  if(expr instanceof types.Symbol) {
    const val = env[expr.get('name')];
    if(val === undefined)
      throw new ReferenceError("The symbol " + expr.get('name') + " has not been assigned a value.");

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

      if(!types.isFunction(fn))
        throw new SyntaxError("The first item in a list literal must be a function.");

      const argsArrayUnevaluated = expr.shift().toArray();

      if(types.isMacro(fn))
        return evaluate(fn.apply(null, [expr, env].concat(argsArrayUnevaluated)), env);

      return fn.apply(null, argsArrayUnevaluated.map(v => evaluate(v, env)));
    }
  }

  // For all other types (i.e. keywords, vector literals,
  // numbers, strings, booleans, and nil, return them as parsed).
  return expr;
}

module.exports = evaluate;
