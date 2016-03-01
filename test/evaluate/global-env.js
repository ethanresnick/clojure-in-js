"use strict";
const expect = require("chai").expect;
const types = require("../../src/data-types");
const env = require("../../src/evaluate/global-env");
const parse = require("../../src/parse/parse");
const evaluate = require("../../src/evaluate/evaluate");

function run(program, env) {
  return evaluate(parse.parse(program), env);
}

describe("-", () => {
  it("should throw with no args", () => {
    expect(() => env["-"]()).to.throw(SyntaxError);
  });

  it("should negate input if one number given", () => {
    expect(env["-"](1)).to.equal(-1);
  });

  it("should subtract subsequent numbers from the first, if 2+ arguments given", () => {
    expect(env["-"](1, 5)).to.equal(-4);
  });
});

describe("reduce", () => {
  it("should work on lists and vectors", () => {
    expect(env.reduce(env["+"], types.List([1, 2, 3]))).to.equal(6);
    expect(env.reduce(env["+"], types.Vector([1, 2, 3]))).to.equal(6);
  });

  it("should support providing a starting value", () => {
    expect(env.reduce(env["+"], 7, types.List([1, 2, 3]))).to.equal(13);
  });
});

describe("defn", () => {
  afterEach(() => { delete env.x });

  it("should define a function", () => {
    expect(run("(defn x [it] it) (x 4)", env)).to.equal(4);
    expect(Object.prototype.hasOwnProperty.call(env, "x")).to.be.true;
    expect(env.x).to.be.a.function;
  });
});

describe("defmacro", () => {
  it("should return a function marked as a macro and saved in the global scope", () => {
    expect(run("(defmacro x [fn arg1 arg2] (list fn arg1 arg2)) (x + (+ 1 1) 2)", env)).to.equal(4);
    expect(Object.prototype.hasOwnProperty.call(env, "x")).to.be.true;
    expect(env.x.isMacro).to.be.true;
  });
});

describe("comment", () => {
  it("should ignore its input", () => {
    expect(run("(comment \"blah blah\")", env)).to.equal(null);
  });
});

describe("hash-map", () => {
  it('should return a hash map', () => {
    expect(run('{3 7 "john" true :tim false}', env)).to.deep.equal(
      run('(hash-map 3 7 "john" true :tim false)', env)
    );
  });
});
