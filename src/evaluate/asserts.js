module.exports = {
  arity(allowedArities, fnName, argCount) {
    if(!allowedArities.some(arity => argCount === arity))
      throw new SyntaxError(`${fnName} expects exactly ${allowedArities.join(' or ')} arguments; got ${argCount}.`);
  },

  minArity(minArity, fnName, argCount) {
    if(argCount < minArity)
      throw new SyntaxError(`${fnName} expects at least ${minArity} arguments; got ${argCount}.`);
  },

  instanceof(toTestDesc, toTest, expectedType) {
    if(!(toTest instanceof expectedType))
      throw new TypeError(`${toTestDesc} must be a(n) ${expectedType}`);
  },

  typeof(toTestDesc, toTest, expectedType) {
    if(typeof toTest !== expectedType)
      throw new TypeError(`${toTestDesc} must be a(n) ${expectedType}`);
  }
}
