/**
 * My simplified lisp-ish parser
 *
 * Each program is a single expression.
 *
 * Programs are parsed into core data structures based on
 * those from Immutable.js (thanks homoiconicity!).
 * See data-types.js for details.
 */
"use strict";
var types = require("../data-types");
var tokenize = require("./tokenize");

/**
 * Responsible for parsing pieces that don't have any other
 * pieces nested inside them, i.e. symbols and primitives.
 */
function atomFromToken(token) {
  var match;

  if (match = /^"([^"]*)"$/.exec(token))
    return match[1];

  else if (match = /^\d+(\.\d+)?$/.exec(token))
    return Number(match[0]);

  else if (match = /^(true|false|nil)$/.exec(token))
    return match[0] === "nil" ? null : (match[0] === "true");

  else if (match = /^[^()"\[\]]+$/.exec(token))
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
  tokens = tokens.slice(0);
  var result = {};

  if(tokens.length === 0)
    throw new SyntaxError("Unexpected end of input");

  // Our (sub) expression is a list or vector.
  if(tokens[0] === '(' || tokens[0] === '[') {
    const closingDelim = tokens[0] === '(' ? ')' : ']';

    // Set up the AST node. We'll make it a standard
    // JS array while we're parsing/mutating it, and
    // convert it to an Immutable.js type at the end.
    result.expr = [];

    // Skip past the opening delimiter.
    tokens = tokens.slice(1);

    while(tokens[0] !== closingDelim) {
      let entry = parseExpression(tokens);
      result.expr.push(entry.expr);

      tokens = entry.rest;
    }

    // Finalize the type of our node.
    result.expr = (closingDelim == ')') ?
      types.List(result.expr) :
      types.Vector(result.expr);

    // Skip past the closing delimiter.
    result.rest = tokens.slice(1);

    return result;
  }

  // Our (sub) expression is an atom.
  else {
    return {expr: atomFromToken(tokens[0]), rest: tokens.slice(1)};
  }
}


function parse(program) {
  const exprs = [];
  let currExpr = {rest: tokenize(program)};

  while(currExpr.rest.length) {
    currExpr = parseExpression(currExpr.rest)
    exprs.push(currExpr.expr);
  }

  // Wrap in implicit "do" if necessary.
  return exprs.length > 1 ? types.List([new types.Symbol({name: "do"})]).concat(exprs) : exprs[0];
}

module.exports = {
  atomFromToken,
  parseExpression,
  parse
};
