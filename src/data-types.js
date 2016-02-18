/**
 * Lists use Immutable.List, as do Vectors, but we add
 * an `isVector` key to vectors to tell them apart.
 *
 * Keywords and Symbols (in the Clojure sense) are
 * represented with subtypes of Immutable.Record. There's
 * no central symbol table created during the parse,
 * which means we're using a bit more memory, but it's
 * easier than creating two separate tables for the keywords
 * and the symbols and passing those around everywhere.
 * Plus, it works just to return a "different" Record, since
 * those compare by value thanks to Immutable.js.
 *
 * For numbers, strings, and booleans, we use the corresponding
 * js primitives, and nil becomes null.
 */
"use strict";
var Immutable = require('immutable');

class CljSymbol extends Immutable.Record({name:""}) {};

class Keyword extends Immutable.Record({name:""}) {};

const vectorDiscriminator = Symbol();
function Vector(/* ...args */) {
  const list = Immutable.List.apply(Immutable, arguments);
  list[vectorDiscriminator] = true;
  return list;
}

function isVector(it) {
  return it instanceof Immutable.List && it[vectorDiscriminator];
}

module.exports = {
  Symbol: CljSymbol,
  List: Immutable.List,
  Keyword,
  Vector,
  isVector
};
