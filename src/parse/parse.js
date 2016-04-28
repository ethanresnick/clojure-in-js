/**
 * My simplified clojure-ish parser
 *
 * Programs are parsed into core data structures based on
 * those from Immutable.js (thanks homoiconicity!).
 * See data-types.js for details.
 */
"use strict";
const types = require("../data-types");
const tokenize = require("./tokenize");
const validateAndExpand = require("../preprocess/preprocess");
const nonAtomMap = Object.assign(Object.create(null), {
  "(": [")", types.ListBuilder],
  "{": ["}", types.HashMapBuilder],
  "[": ["]", types.VectorBuilder]
});

/**
 * Responsible for parsing pieces that don't have any other
 * pieces nested inside them, i.e. symbols and primitives.
 */
function atomFromToken(token) {
  let match;

  // tokens starting and ending with double quotes are strings.
  if (token[0] === '"' && token[token.length-1] === '"') 
    return token.slice(1, -1);

  // boolean & nil literals
  else if (token === "true" || token === "false" || token === "nil")
    return token === "nil" ? null : (token === "true");

  // the regex below matches floats and integers; assigns to match, 
  // which will be falsey if the pattern doesn't match.
  else if (match = /^\d+(\.\d+)?$/.exec(token)) 
    return Number(match[0]);

  // comments
  else if (token[0] === ";")
    return new types.List([new types.Symbol({name: "comment"}), token.slice(1)]);

  // symbols & keywords
  else if (match = /^[^()"{}\[\]]+$/.exec(token))
    return match[0][0] === ":" ?
      new types.Keyword({ name: match[0].slice(1) }) :
      new types.Symbol({ name: match[0] });

  else
    throw new SyntaxError("Not an atom: " + token);
}

/**
 * Parses a single (possibly compound) expression,
 * which every valid program should be.
 * Returns both the parsed expression and any tokens
 * remaining after that expression (of which there
 * should be none, if the whole program is one exp).
 */
function parseExpression(tokens) {
  // copy array so we're not mutating original
  let remainingTokens = tokens.slice(0);
  const result = {expr: undefined, rest: undefined};

  if(remainingTokens.length === 0)
    throw new SyntaxError("Unexpected end of input");

  // Our (sub) expression is a list, vector, or hash map.
  if(remainingTokens[0] in nonAtomMap) {
    const typeInfo = nonAtomMap[remainingTokens[0]];
    const closingDelim = typeInfo[0];
    const nodeBuilder = typeInfo[1];
    const nodeInProgress = nodeBuilder.start();

    // Skip past the opening delimiter.
    remainingTokens.shift();

    while(remainingTokens[0] !== closingDelim) {
      let entry = parseExpression(remainingTokens);

      nodeBuilder.push(entry.expr, nodeInProgress);
      remainingTokens = entry.rest;
    }

    // Turn our "node in progress" into a real
    // instance of the proper data structure.
    result.expr = nodeBuilder.finalize(nodeInProgress);

    // Skip past the closing delimiter.
    result.rest = remainingTokens.slice(1);
  }

  // Our (sub) expression is an atom.
  else {
    result.expr = atomFromToken(tokens[0]);
    result.rest = remainingTokens.slice(1);
  }

  // Before returning, validate the expr we're about to parse
  // (since we want to report errors pre-runtime where possible)
  // and do macroexpansion, which should also happen before runtime.
  result.expr = validateAndExpand(result.expr);

  return result;
}


function parse(program) {
  const exprs = [];
  let currExpr = {rest: tokenize(program)};

  while(currExpr.rest.length) {
    currExpr = parseExpression(currExpr.rest)
    exprs.push(currExpr.expr);
  }

  // Wrap in implicit "do" if necessary.
  return exprs.length > 1 ? 
    types.List([new types.Symbol({name: "do"})]).concat(exprs) : 
    exprs[0];
}

module.exports = {
  atomFromToken,
  parseExpression,
  parse
};
