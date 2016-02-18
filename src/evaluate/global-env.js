"use strict";
var Immutable = require('immutable');
var types = require('../data-types');

module.exports =  {
  "+": function(/* ...args */) {
    return Array.from(arguments).reduce(((acc, it) => acc + it), 0);
  },

  // This doesn't yet account for Immutable.js types.
  "=": function(/* ... args */) {
    const args = Array.from(arguments);
    return args.every(it => it === args[0]);
  },

  // Make sure we're not counting keywords as symbols.
  "symbol?": function(val) {
    console.log(val, Symbol.keyFor(val));
    return typeof val === "symbol" && Symbol.keyFor(val)[0] !== ':';
  }
}
