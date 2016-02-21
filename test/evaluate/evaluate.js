"use strict";
var expect = require("chai").expect;
var types = require("../../src/data-types");
var parse = require("../../src/parse/parse.js");
var globalEnv = require("../../src/evaluate/global-env.js");
var evaluate = require("../../src/evaluate/evaluate.js");

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
  });


  it("should only evaluate function arguments once when called", () => {
    // If the args are evalauted twice, we'll get an error because 1 isn't a function.
    expect(run("(count (list 1 2))", globalEnv)).to.equal(2);
  })
});

describe("special forms", () => {
  const env = Object.assign(Object.create(globalEnv), {
    willThrow() { throw new ReferenceError("fn was called"); },
    willThrowSyntax() { throw new SyntaxError("blah"); }
  });

  describe("quote", () => {
    it("should return its argument unevaluated", () => {
      expect(run("(quote (+ 1 2 3))", {})).to.deep.equal(parse.parse("(+ 1 2 3)"));
    });
  });

  describe("if", () => {
    it("should evaluate the condition", () => {
      expect(run("(if (= (+ 1 2) 3) true false)", globalEnv)).to.be.true;
    });

    it("should lazily evaluate the branches", () => {
      // If these tests complete successfully, will-throw wasn't called.
      expect(run("(if true (+ 1 2 3) (willThrow 1))", env)).to.equal(6);
      expect(run("(if false (willThrow 1) 8)", env)).to.equal(8);

      expect(() => { run("(if true (willThrow 1) 1)", env) }).to.throw(Error);
      expect(() => { run("(if false 4 (willThrow (+ 1 2 6)))", env) }).to.throw(Error);
    });
  });

  describe("do", () => {
    it("should evaluate each expression in order", () => {
      expect(() => { run("(do (willThrow) (willThrowSyntax))", env) }).to.throw(ReferenceError);
      expect(() => { run("(do (willThrowSyntax) (willThrow))", env) }).to.throw(SyntaxError);
    });

    it("should return the value of the last expression", () => {
      expect(run("(do 4 7)", env)).to.equal(7);
    });
  });

  describe("def", () => {
    const root = Object.create(null);
    const env = Object.create(root);

    it("should set a binding on the root scope, even if used from an inner scope", () => {
      run("(def bob 1)", env);
      expect(Object.prototype.hasOwnProperty.call(env, "bob")).to.be.false;
      expect(env.bob).to.equal(1);
      expect(root.bob).to.equal(1);
    });

    it("should set a binding that's mutable", () => {
      run("(def a 4)", env);
      run("(def a 6)", env);
      expect(root.a).to.equal(6);
      run("(do (def a 7) (def a 1))", env);
      expect(root.a).to.equal(1);
    });

    it("should return the bound value", () => {
      expect(run("(def b true)", env)).to.be.true;
    });

    it("should use the _inner_ scope's values to compute the bound value", () => {
      env.innerVal = 2;
      root.innverVal = 1;
      env["+"] = globalEnv["+"];

      run("(def innerVal (+ innerVal 1))", env);
      expect(root.innerVal).to.equal(3);
      expect(env.innerVal).to.equal(2);
    });
  });

  describe("let", () => {
    it("should set up bindings when the binding forms are simple symbols", () => {
      expect(run("(let [x 1 y 9] (+ y x))", globalEnv)).to.equal(10);
    });

    it("should allow subsequent bindings to see previous ones", () => {
      expect(run("(let [x 1 y x] y)", globalEnv)).to.equal(1);
    });

    it("should only set bindings on the inner (temporary) scopes", () => {
      run("(let [x 1 y x] y)", globalEnv);
      expect(globalEnv.y).to.be.undefined;
      expect(globalEnv.x).to.be.undefined;
    });

    it("should make bindings shadowable", () => {
      expect(run("(let [x 10] (list (let [x 2] x) x))", globalEnv)).to.deep.equal(types.List([2, 10]));
    });

    it("should create scopes that have access to outer variables", () => {
      expect(run("(do (def outer 9) (let [inner 9] (= inner outer)))", globalEnv)).to.be.true;
    });
  });

  describe("fn", () => {
    it("should NOT bind its arguments sequentially like a standard let", () => {
      const sequentialTest1 = () => run("(do (def test (fn [a b] (list a b))) (test 1 a))", globalEnv);
      const sequentialTest2 = () => run("(do (def a 2) (def test (fn [a b] (list a b))) (test 1 a))", globalEnv);
      expect(sequentialTest1).to.throw(ReferenceError);
      expect(sequentialTest2()).to.deep.equal(new types.List([1, 2]));
    });
  });
});
