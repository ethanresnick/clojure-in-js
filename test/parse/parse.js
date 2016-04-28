"use strict";
var expect = require("chai").expect;
var types = require("../../src/data-types");
var parse = require("../../src/parse/parse.js");

describe("parsing atoms from a token", () => {
  const toAtom = parse.atomFromToken;

  it("should return strings from string tokens", () => {
    expect(toAtom('"bob"')).to.equal("bob");
    expect(toAtom('"This is a "str\\ing []"')).to.equal('This is a "str\\ing []');
  });

  it("should return booleans for literal true and false", () => {
    expect(toAtom("true")).to.equal(true);
    expect(toAtom("false")).to.equal(false);
  });

  it("should return null for nil", () => {
    expect(toAtom("nil")).to.equal(null);
  });

  it("should return a symbol node for symbols", () => {
    expect(toAtom("my-future")).to.deep.equal(new types.Symbol({ name: "my-future" }));
  });

  it("should return an invocation of the comments macro for comments", () => {
    expect(toAtom("; this is a comment")).to.deep.equal(
      new types.List([new types.Symbol({name: "comment"}), " this is a comment"])
    );
  })

  it("should return a keyword node for keywords", () => {
    expect(toAtom(":true")).to.deep.equal(new types.Keyword({ name: "true" }));
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
      expr: types.List(),
      rest: []
    });
  });

  it("should handle maps", () => {
    const exactlyMapOf = (pairs) => {
      return {"expr": types.HashMap(pairs), rest: []};
    }

    expect(parseExp(["{", ":b", "false", "1", "true", "}"])).to.deep.equal(
      exactlyMapOf([[new types.Keyword({name: "b"}), false], [1, true]])
    );

    expect(() => parseExp(["{", ":b", "false", "4", "}"])).to.throw(SyntaxError);
  })

  it("should handle the empty vector", () => {
    expect(parseExp(["[", "]"])).to.deep.equal({
      expr: types.Vector(),
      rest: []
    });
  });

  it("should handle arbitrary expressions", () => {
    expect(parseExp(["(", "true", "[", "symbol", "4", "(", "1", ")", "]", ")"])).to.deep.equal({
      expr: types.List([true, types.Vector([new types.Symbol({name: "symbol"}), 4, types.List([1])])]),
      rest: []
    });
  });

  it("should capture tokens after an expression correctly", () => {
    expect(parseExp(["(", "true", "[", "symbol", "4", "(", "1", ")", "]", ")", "5"])).to.deep.equal({
      expr: types.List([true, types.Vector([new types.Symbol({name: "symbol"}), 4, types.List([1])])]),
      rest: ["5"]
    });
  });
});

// The master "integration test" of sorts.
describe("parsing a program from text", () => {
  const sym = (name) => new types.Symbol({name: name });
  const list = function() { return types.List(arguments) };

  it("should parse an arbitrary, single-expression program", () => {
    const programLines = ["(defn inclist",
                            '"Returns a new list; that list has each entry from the provided list incremented by 1."',
                            "[thisList]",
                            "(let [size (count thisList)]",
                              "(cond",
                                "(= 0 size) (list)",
                                "(= 1 size) (list (inc (first thisList)))",
                                ":else (cons (inc (first thisList)) (inclist (rest thisList))))))"];

    expect(parse.parse(programLines.join("\n"))).to.deep.equal(list(
      sym("defn"),
      sym("inclist"),
      "Returns a new list; that list has each entry from the provided list incremented by 1.",
      types.Vector([sym("thisList")]),
      list(sym("let"), types.Vector([sym("size"), list(sym("count"), sym("thisList"))]),
        list(sym("cond"),
          list(sym("="), 0, sym("size")),
          list(sym("list")),
          list(sym("="), 1, sym("size")),
          list(sym("list"), list(sym("inc"), list(sym("first"), sym("thisList")))),
          new types.Keyword({ name: "else" }),
          list(sym("cons"), list(sym("inc"), list(sym("first"),  sym("thisList"))), list(sym("inclist"), list(sym("rest"), sym("thisList"))))
        )
      )
    ));
  });

  it("should parse a multiple-expression program, wrapping the expressions in a `do`", () => {
    expect(parse.parse(("4 7 (+ 4 7)"))).to.deep.equal(list(sym("do"), 4, 7, list(sym("+"), 4, 7)));
  });
});

describe("static pre-runtime checks", function() {
  describe("if", () => {
    it("should require three arguments", () => {
      expect(() => parse.parse("(if a b c d)")).to.throw(SyntaxError);
      expect(() => parse.parse("(if a b)")).to.throw(SyntaxError);
    });
  });
});