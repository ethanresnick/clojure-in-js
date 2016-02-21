"use strict";
const Immutable = require('immutable');
const types = require('../data-types');
const evaluate = require('./evaluate');
const asserts = require('./asserts');

function createEnv(symbols) {
  return Object.assign(Object.create(null), symbols);
}

module.exports = createEnv({
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
  }
});
