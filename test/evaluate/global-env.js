"use strict";
const expect = require("chai").expect;
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
