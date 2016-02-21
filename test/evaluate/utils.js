"use strict";
const utils = require("../src/evaluate/utils.js");

describe("getting root scope", () => {
  const root = Object.create(null);
  const inner = Object.create(root);
  const innerInner = Object.create(inner);

  expect(utils.getRootScope(innerInner)).to.equal(root);
});
