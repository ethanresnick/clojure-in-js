"use strict";
const Immutable = require('immutable');
const types = require('../data-types');
const evaluate = require('./evaluate');
const asserts = require('./asserts');

function createEnv(symbols) {
  return Object.assign(Object.create(null), symbols);
}

function sym(name) {
  return new types.Symbol({name: name});
}

// See http://clojure.org/reference/macros#_special_variables
const macroSpecialParams =
  types.Vector([sym("&form"), sym("&env")]);


module.exports = createEnv({
  "setMacro": types.setMacro,

  "defn": types.setMacro(function(form, env, name /* ...paramsAndBody */) {
    const paramsAndBody = Array.from(arguments).slice(3);

    return types.List([sym("def"), name,
      types.List([sym("fn")]).concat(paramsAndBody)]);
  }),

  "defmacro": types.setMacro(function(form, env, name, params /* ...body */) {
    const body = Array.from(arguments).slice(4);
    const fullParamVec = types.Vector(macroSpecialParams.concat(params));

    return types.List([sym("do"),
        types.List([sym("defn"), name, fullParamVec]).concat(body),
        types.List([types.setMacro, name])
    ]);
  }),

  "comment": types.setMacro(function(form, env, comment) {
    return null;
  }),

  "+": function(/* ...args */) {
    return Array.from(arguments).reduce(((acc, it) => acc + it), 0);
  },

  "*": function(/* ...args */) {
    return Array.from(arguments).reduce(((acc, it) => acc * it), 1);
  },


  "-": function(/* ...args */) {
    asserts.minArity(1, "-", arguments.length);
    return arguments.length === 1 ?
      -1*arguments[0] :
      Array.from(arguments).reduce(((acc, it) => acc - it));
  },

  "=": function(/* ... args */) {
    const args = Array.from(arguments);
    return args.every((it) => Immutable.is(it, args[0]));
  },

  "<=": function(/* ... args */) {
    for(var i = 0; i < (arguments.length - 1); i++) {
      if(arguments[i] > arguments[i + 1])
        return false;
    }
    return true;
  },

  "symbol?": function(val) {
    return val instanceof types.Symbol;
  },

  "list": function(/* ... args */) {
    return types.List(arguments);
  },

  "first": function(iterable) {
    return iterable.first();
  },

  "rest": function(iterable) {
    return iterable.rest();
  },

  "count": function(iterable) {
    return iterable.count();
  },

  "reduce": function(reducer, optStartVal, coll) {
    // To match clojure, we only call the reducer with two
    // arguments (unlike immutable, which throws in others too).
    const reducer2 = (acc, it) => reducer(acc, it)

    if(arguments.length === 2)
      return optStartVal.reduce(reducer2);

    return coll.reduce(reducer2, optStartVal);
  }
});
