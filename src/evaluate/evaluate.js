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
   * calls, where all the arguments *need* to be evaluated upfront
   * and independently (though possibly in a fixed order, for side
   * effects). Therefore, if we want to reuse the `let` form for
   * handling creating a function's local scope--which is highly
   * useful, since let will also contain a bunch of destructuring
   * logic--we have to add a special flag (the third argument) that
   * lets us turn off sequential binding on function calls.
   */
  let(env, rest, bindSequentially) {
    asserts.minArity(2, "let", rest.size);

    // default bindSequentially to true
    bindSequentially = (bindSequentially === undefined) ? true : bindSequentially;

    const bindings = rest.get(0);
    const body = rest.shift();

    if(!types.isVector(bindings))
       throw new SyntaxError("The first argument to let (the binding forms) must be a vector.");

    if(bindings.size % 2 !== 0)
      throw new SyntaxError("let expects an even number of items in the bindings vector.");

    // Create the child env.
    const newEnv = Object.create(env);

    // Set up the local bindings, evaluating as we go.
    // Assume we're just dealing with symbols as
    // our binding forms (i.e., no destructuring yet).
    //
    // We use Object.defineProperty to add the value as a *non-writeable*
    // property, while also avoiding the override mistake if we're shadowing.
    // See: https://esdiscuss.org/topic/set-and-inherited-readonly-data-properties
    //
    // Note: bindSequentially comes in here to affect the *environment* from
    // which we're evaluating the next binding's init-expr. If we're not
    // supposed to bindSequentially, we evaluate all bindings from the parent
    // env (so the fact that we attach the bound values to the childEnv
    // sequentially is unobservable).
    for(let i = 0; i < bindings.size; i+=2) {
      Object.defineProperty(
        newEnv,
        bindings.get(i).get('name'),
        {value: evaluate(bindings.get(i+1), bindSequentially ? newEnv : env)});
    }

    // Now evaluate the body.
    return specialForms["do"](newEnv, body);
  },

  fn(env, rest) {
    asserts.arity([2], "fn", rest.size);

    if(!types.isVector(rest.get(0)))
       throw new SyntaxError("The first argument to fn (the arguments) must be a vector.");

    return new types.Function(rest.get(0), rest.shift(), env);
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

      const args = expr.shift()

      // If it's a (user defined) function defined in clojure,
      // call it by evaluating the fn as a let defined in the
      // context of the function's original lexical environment.
      if(fn instanceof types.Function) {
        const bindings = new types.Vector(fn.params.interleave(args));
        return specialForms["let"](fn.env, new types.List([bindings]).concat(fn.body), false);
      }

      // If it's a js function, just call it directly, with no env.
      // Note: we have to evaluate the args for js functions first,
      // even though we don't when calling clojure functions, because
      // `let` takes care of that evaluation.
      return fn.apply(null, args.map(v => evaluate(v, env)).toArray());
    }
  }

  // For all other types (i.e. keywords, vector literals,
  // numbers, strings, booleans, and nil, return them as parsed).
  return expr;
}

module.exports = evaluate;
