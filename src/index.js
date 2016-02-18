"use strict";

var parse = require("./parse/parse.js").parse;
var env = require("./evaluate/global-env.js");
var evaluate = require("./evaluate/evaluate.js").evaluate;

module.exports = function(program) {
  return evaluate(parse(program), env);
}
