"use strict";

/**
 * Walks the prototype chain until it gets to the last obj before null.
 */
function getRootScope(env) {
  let outerEnv;
  while((outerEnv = Object.getPrototypeOf(env)) !== null) {
    env = outerEnv;
  }
  return env;
}

module.exports = {getRootScope};
