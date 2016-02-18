"use strict";
var mocha = require("mocha");
var expect = require("chai").expect;
var parse = require("../src/parse/parse.js");
var Immutable = require('immutable');
var globalEnv = require("../src/evaluate/global-env.js");
var evaluate = require("../src/evaluate/evaluate.js").evaluate;
var isVector = require("../src/evaluate/evaluate.js").isVector;

describe("evaluation basics", () => {
  it("should properly evaluate numbers", () => {
    expect(evaluate(4, {})).to.equal(4);
  });

  it("should properly evaluate nil", () => {
    expect(evaluate(parse.parse("nil"), {})).to.equal(null);
  });

  it("should evaluate vectors as Immutable.Lists, but that pass isVector()", () => {
    const res = evaluate(parse.parse("[1 2 3]"), {});
    expect(isVector(res)).to.be.true;
    expect(res).to.be.an.instanceof(Immutable.List);
  });

  it("should treat lists as procedure calls when the first item isn't a special form", () => {
    expect(evaluate(parse.parse("(+ 1 2 3)"), globalEnv)).to.equal(6);
  });
});

describe("special forms", () => {
  describe("quote", () => {
    it("should return its argument unevaluated", () => {
      expect(evaluate(parse.parse("(quote (+ 1 2 3))"), {})).to.deep.equal(parse.parse("(+ 1 2 3)"));
    });
  });

  describe("if", () => {
    const env = Object.assign(Object.create(globalEnv), {
      [Symbol.for("will-throw")]: function() { throw new Error("fn was called"); }
    });

    it("should evaluate the condition", () => {
      expect(evaluate(parse.parse("(if (= (+ 1 2) 3) true false)"), globalEnv)).to.be.true;
    });

    it("should lazily evaluate the branches", () => {
      // If these tests complete successfully, will-throw wasn't called.
      expect(evaluate(parse.parse("(if true (+ 1 2 3) (will-throw 1))"), env)).to.equal(6);
      expect(evaluate(parse.parse("(if false (will-throw 1) 8)"), env)).to.equal(8);

      expect(() => { evaluate(parse.parse("(if true (will-throw 1) 1)"), env) }).to.throw(Error);
      expect(() => { evaluate(parse.parse("(if false 4 (will-throw (+ 1 2 6)))"), env) }).to.throw(Error);
    });
  });
});
