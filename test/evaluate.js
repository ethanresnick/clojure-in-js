"use strict";
var mocha = require("mocha");
var expect = require("chai").expect;
var types = require("../src/data-types");
var parse = require("../src/parse/parse.js");
var globalEnv = require("../src/evaluate/global-env.js");
var evaluate = require("../src/evaluate/evaluate.js");

var run = function(program, env) {
  return evaluate(parse.parse(program), env);
}

describe("evaluation basics", () => {
  it("should properly evaluate numbers", () => {
    expect(run("4", {})).to.equal(4);
  });

  it("should properly evaluate nil", () => {
    expect(run("nil", {})).to.equal(null);
  });

  it("should evaluate vectors correctly according to isVector()", () => {
    const res = run("[1 2 3]", {});
    expect(types.isVector(res)).to.be.true;
  });

  it("should treat lists as procedure calls when the first item is a non-special form symbol", () => {
    expect(run("(+ 1 2 3)", globalEnv)).to.equal(6);
  });

  it("should evaluate the first item of a list if it's not a symbol", () => {
    expect(run("((if true + -) 1 2)", globalEnv)).to.equal(3);
  });

  it("should return the list if its empty", () => {
    expect(run("()", globalEnv)).to.deep.equal(types.List());
    expect(run("(if 1 () 0)", globalEnv)).to.deep.equal(types.List());
  })
});

describe("special forms", () => {
  describe("quote", () => {
    it("should return its argument unevaluated", () => {
      expect(run("(quote (+ 1 2 3))", {})).to.deep.equal(parse.parse("(+ 1 2 3)"));
    });
  });

  describe("if", () => {
    const env = Object.assign(Object.create(globalEnv), {
      "will-throw": function() { throw new Error("fn was called"); }
    });

    it("should evaluate the condition", () => {
      expect(run("(if (= (+ 1 2) 3) true false)", globalEnv)).to.be.true;
    });

    it("should lazily evaluate the branches", () => {
      // If these tests complete successfully, will-throw wasn't called.
      expect(run("(if true (+ 1 2 3) (will-throw 1))", env)).to.equal(6);
      expect(run("(if false (will-throw 1) 8)", env)).to.equal(8);

      expect(() => { run("(if true (will-throw 1) 1)", env) }).to.throw(Error);
      expect(() => { run("(if false 4 (will-throw (+ 1 2 6)))", env) }).to.throw(Error);
    });
  });

  describe("def", () => {
  })
});
