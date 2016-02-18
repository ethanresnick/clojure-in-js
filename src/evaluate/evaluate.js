"use strict";
var Immutable = require('immutable');

// Implement vectors, like lists, using Immutable.List.
// But stick a property on the resulting object to distinguish
// them from lists.
const vectorDiscriminator = Symbol();

function Vector(/* ...values */) {
  const list = Immutable.List.apply(Immutable, arguments);
  list[vectorDiscriminator] = true;
  return list;
}

function isVector(it) {
  return (typeof it == "object") && it !== null && it[vectorDiscriminator];
}

// Define our special forms.
const specialForms = {
  if(env, rest) {
    if(evaluate(rest[0], env))
      return evaluate(rest[1], env);

    else
      return evaluate(rest[2], env);
  },

  quote(env, rest) {
    return rest[0];
  }
};

function evaluate(expr, env) {
  // return numbers, strings, booleans, nil as is
  // from the ast (i.e. as javascript primitives).
  if(typeof expr !== "object" || expr === null)
    return expr;

  switch(expr.type) {
    // have keywords always evaluate to themselves, using
    // js's built-in global symbol registry. Note, we store
    // and look up keywords in the symbol registry with a
    // leading colon in their key, so they won't conflict
    // with the symbols for variables.
    case "keyword":
      return Symbol.for(':' + expr.name);

    // treat all other symbols like variables (though also
    // define a symbol for them in the global so they can be
    // retrieved quoted).
    case "symbol":
      return env[Symbol.for(expr.name)];

    // back vectors (and soon other data structures) with immutable.js
    case "vector":
      return Vector(expr.entries);

    // for lists, check for special forms; otherwise treat as a procedure call.
    case "list":
      if(specialForms[expr.entries[0].name])
        return specialForms[expr.entries[0].name](env, expr.entries.slice(1));

      else {
        const fn = evaluate(expr.entries[0], env);
        const args = expr.entries.slice(1).map(v => evaluate(v, env));
        return fn.apply(null, args);
      }
  }
}

module.exports = {
  isVector: isVector,
  evaluate: evaluate
}
