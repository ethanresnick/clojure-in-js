/**
 * Each AST object is one of:
 *
 *   For lists and vectors: an object with a push method,
 *   a type key, and an entries key holding an array.
 *
 *   For symbols and keywords: an object with type & name keys.
 *
 *   A js primitive, for numbers, strings, and booleans.
 *
 *   null for nil.
 */

"use strict";

const keywordPrototype = {
  type: "keyword"
};

const symbolPrototype = {
  type: "symbol"
}

const vectorPrototype = {
  type: "vector",
  push(it) {
    return this.entries.push(it);
  }
};

const listPrototype = {
  type: "list",
  push(it) {
    return this.entries.push(it);
  }
};

module.exports = {
  'keyword': function(name) {
    return Object.assign(Object.create(keywordPrototype), { name: name });
  },

  'symbol': function(name) {
    return Object.assign(Object.create(symbolPrototype), { name: name });
  },

  // stupid node 5 doesn't support rest parameters.
  'vector': function(a, b, c, etc) {
    return Object.assign(
      Object.create(vectorPrototype), { entries: Array.from(arguments) }
    );
  },

  'list': function(a, b, c, etc) {
    return Object.assign(
      Object.create(listPrototype), { entries: Array.from(arguments) }
    );
  }
}
