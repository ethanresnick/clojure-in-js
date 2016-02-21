"use strict";
var Immutable = require('immutable');
var types = require('../data-types');

function createEnv(symbols) {
  return Object.assign(Object.create(null), symbols);
}

module.exports = createEnv({
  "+": function(/* ...args */) {
    return Array.from(arguments).reduce(((acc, it) => acc + it), 0);
  },

  "=": function(/* ... args */) {
    const args = Array.from(arguments);
    return args.every((it) => Immutable.is(it, args[0]));
  },

  "symbol?": function(val) {
    return val instanceof types.Symbol;
  },

  "list": function(/* ... args */) {
    return types.List(arguments);
  }
});
