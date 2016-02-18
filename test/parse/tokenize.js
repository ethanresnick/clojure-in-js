"use strict";
var expect = require("chai").expect;
var tokenize = require("../../src/parse/tokenize.js");

describe("tokenization", () => {
  it("should return an array of untagged, string tokens", () => {
    expect(tokenize("(do (+ 1 2) (+ 3 4))")).to.deep.equal([
      "(", "do",
        "(", "+", "1", "2", ")",
        "(", "+", "3", "4", ")",
      ")"
    ]);

    expect(tokenize('(defmacro my-future [code] (let [a "bobb"] ()))')).to.deep.equal([
      "(", "defmacro", "my-future", "[", "code", "]",
        "(", "let", "[", "a", '"bobb"', "]", "(", ")", ")",
      ")"
    ]);
  });

  it("should tokenize one atom programs", () => {
    expect(tokenize("4.2")).to.deep.equal(["4.2"]);
    expect(tokenize("nil")).to.deep.equal(["nil"]);
    expect(tokenize(":true")).to.deep.equal([":true"]);
  });

  it("should parse keywords, with their leading colon, as a single token", () => {
    expect(tokenize("(:my-key my-map nil)")).to.deep.equal([
      "(", ":my-key", "my-map", "nil", ")"
    ]);
  });

  it("should parse strings, with their quotes, as a single token", () => {
    expect(tokenize('(str "This is a string []")')).to.deep.equal([
      "(", "str", '"This is a string []"', ")"
    ]);
  });

  it("should treat a new line like a space between tokens", () => {
    expect(tokenize("(str\nt)")).to.deep.equal(["(", "str", "t", ")"]);
  });

  it("should collapse multiple whitespace tokens", () => {
    expect(tokenize("(str\n\r t)")).to.deep.equal(["(", "str", "t", ")"]);
  });
});
