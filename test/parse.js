"use strict";
var mocha = require("mocha");
var expect = require("chai").expect;
var parse = require("../src/parse.js");

describe("tokenization", () => {
  const tokenize = parse.tokenize;

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

describe("parsing atoms from a token", () => {
  const toAtom = parse.atomFromToken;

  it("should return strings from string tokens", () => {
    expect(toAtom('"bob"')).to.equal("bob");
  });

  it("should return booleans for literal true and false", () => {
    expect(toAtom("true")).to.equal(true);
    expect(toAtom("false")).to.equal(false);
  });

  it("should return vars for other symbols", () => {
    expect(toAtom("my-future")).to.be.an.instanceof(parse.Var);
    expect(toAtom("my-future").name).to.equal("my-future");
  });

  it("should throw on tokens for non-atoms, including invalid symbol names", () => {
    const toAtomDeferred = (token) => (() => toAtom(token));

    expect(toAtomDeferred("(+ 1 2)")).to.throw(Error);
    expect(toAtomDeferred("(")).to.throw(Error);
    expect(toAtomDeferred(")")).to.throw(Error);
    expect(toAtomDeferred("[")).to.throw(Error);
    expect(toAtomDeferred("]")).to.throw(Error);
    expect(toAtomDeferred("my-sym[ol")).to.throw(Error);
  });
});

describe("parsing arbitrary expressions from tokens", () => {
  const parseExp = parse.parseExpression;

  it("should handle single atoms", () => {
    expect(parseExp(["1.1"])).to.deep.equal({expr: 1.1, rest: []});
    expect(parseExp(["true"])).to.deep.equal({expr: true, rest: []});
  });

  it("should handle the empty list", () => {
    expect(parseExp(["(", ")"])).to.deep.equal({expr: [], rest: []});
  });

  it("should handle the empty vector", () => {
    const res = parseExp(["[", "]"]);
    expect(res.expr).to.be.an.instanceof(parse.Vector);
    expect(res.expr.entries).to.deep.equal([]);
    expect(res.rest).to.deep.equal([]);
  });

  it("should handle arbitrary expressions", () => {
    const res = parseExp(["(", "true", "[", "symbol", "4", "(", "1", ")", "]", ")"]);
    expect(res.expr).to.deep.equal([true, new parse.Vector(new parse.Var("symbol"), 4, [1])]);
    expect(res.rest).to.deep.equal([]);
  });

  it("should capture tokens after an expression correctly", () => {
    const res = parseExp(["(", "true", "[", "symbol", "4", "(", "1", ")", "]", ")", "5"]);
    expect(res.expr).to.deep.equal([true, new parse.Vector(new parse.Var("symbol"), 4, [1])]);
    expect(res.rest).to.deep.equal(["5"]);
  });
});

// The master "integration test" of sorts.
describe("parsing a program from text", () => {
  it("should parse an arbitrary, single-expression program", () => {
    const programLines = ["(defn inclist",
                            '"Returns a new list with each entry from the provided list incremented by 1."',
                            "[thisList]",
                            "(let [size (count thisList)]",
                              "(cond",
                                "(= 0 size) (list)",
                                "(= 1 size) (list (inc (first thisList)))",
                                ":else (cons (inc (first thisList)) (inclist (rest thisList))))))"];

    const vars = (name) => new parse.Var(name);

    expect(parse.parse(programLines.join("\n"))).to.deep.equal([
      vars("defn"),
      vars("inclist"),
      "Returns a new list with each entry from the provided list incremented by 1.",
      new parse.Vector(vars("thisList")),
      [vars("let"), new parse.Vector(vars("size"), [vars("count"), vars("thisList")]),
        [vars("cond"),
          [vars("="), 0, vars("size")],
          [vars("list")],
          [vars("="), 1, vars("size")],
          [vars("list"), [vars("inc"), [vars("first"), vars("thisList")]]],
          vars(":else"),
          [vars("cons"), [vars("inc"), [vars("first"),  vars("thisList")]], [vars("inclist"), [vars("rest"), vars("thisList")]]]
        ]
      ]
    ]);
  });
});
