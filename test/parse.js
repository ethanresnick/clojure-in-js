"use strict";
var expect = require("chai").expect;
var parse = require("../src/parse/parse.js");
var nodes = require("../src/parse/ast-nodes.js");

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

describe("parsing atoms from a token", () => {
  const toAtom = parse.atomFromToken;

  it("should return strings from string tokens", () => {
    expect(toAtom('"bob"')).to.equal("bob");
  });

  it("should return booleans for literal true and false", () => {
    expect(toAtom("true")).to.equal(true);
    expect(toAtom("false")).to.equal(false);
  });

  it("should return null for nil", () => {
    expect(toAtom("nil")).to.equal(null);
  });

  it("should return a symbol node for symbols", () => {
    expect(toAtom("my-future")).to.deep.equal({type: "symbol", name: "my-future"});
  });

  it("should return a keyword node for keywords", () => {
    expect(toAtom(":true")).to.deep.equal({type: "keyword", name: "true" });
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
    expect(parseExp(["(", ")"])).to.deep.equal({
      expr: nodes.list(),
      rest: []
    });
  });

  it("should handle the empty vector", () => {
    expect(parseExp(["[", "]"])).to.deep.equal({
      expr: nodes.vector(),
      rest: []
    });
  });

  it("should handle arbitrary expressions", () => {
    expect(parseExp(["(", "true", "[", "symbol", "4", "(", "1", ")", "]", ")"])).to.deep.equal({
      expr: nodes.list(true, nodes.vector(nodes.symbol("symbol"), 4, nodes.list(1))),
      rest: []
    });
  });

  it("should capture tokens after an expression correctly", () => {
    expect(parseExp(["(", "true", "[", "symbol", "4", "(", "1", ")", "]", ")", "5"])).to.deep.equal({
      expr: nodes.list(true, nodes.vector(nodes.symbol("symbol"), 4, nodes.list(1))),
      rest: ["5"]
    });
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

    const sym = (name) => nodes.symbol(name);
    const list = function() { return nodes.list.apply(null, arguments) };

    expect(parse.parse(programLines.join("\n"))).to.deep.equal(list(
      sym("defn"),
      sym("inclist"),
      "Returns a new list with each entry from the provided list incremented by 1.",
      nodes.vector(sym("thisList")),
      list(sym("let"), nodes.vector(sym("size"), list(sym("count"), sym("thisList"))),
        list(sym("cond"),
          list(sym("="), 0, sym("size")),
          list(sym("list")),
          list(sym("="), 1, sym("size")),
          list(sym("list"), list(sym("inc"), list(sym("first"), sym("thisList")))),
          nodes.keyword("else"),
          list(sym("cons"), list(sym("inc"), list(sym("first"),  sym("thisList"))), list(sym("inclist"), list(sym("rest"), sym("thisList"))))
        )
      )
    ));
  });
});
