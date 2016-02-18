"use strict";

module.exports = {
  [Symbol.for("+")]: function(/* ...args */) {
    return Array.from(arguments).reduce(((acc, it) => acc + it), 0);
  },

  // This doesn't yet account for Immutable.js types.
  [Symbol.for("=")]: function(/* ... args */) {
    const args = Array.from(arguments);
    return args.every(it => it === args[0]);
  }

}
