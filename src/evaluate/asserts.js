module.exports = {
  arity(allowedArities, fnName, args) {
    if(!allowedArities.some(arity => args.size === arity))
      throw new SyntaxError(`${fnName} expects exactly ${allowedArities.join(' or ')} arguments; got ${rest.size}.`);
  },

  minArity(minArity, fnName, args) {
    if(args.size < minArity)
      throw new SyntaxError(`${fnName} expects at least ${minArity} arguments; got ${rest.size}.`);
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
