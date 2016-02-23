"use strict";
const expect = require("chai").expect;
const types = require("../../src/data-types");
const env = require("../../src/evaluate/global-env");

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
