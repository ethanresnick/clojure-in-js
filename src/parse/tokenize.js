"use strict";

/**
 * Returns an array of tokens, not tagged by category.
 * Each token is simply a string.
 *
 * Note that strings are returned with their opening
 * and closing quotes as part of the token, for simpler
 * parsing later.
 */
function tokenize(program) {
  var delimiters = /^[\[\]\(\)\s]/,
      tokens = [],
      currToken = "", currPos = 0, inString = false, char;

  while(currPos < program.length) {
    char = program[currPos];

    // Keep a flag for whether we're inside a string, since
    // normal delimiters don't trigger new tokens within strings.
    if(char == '"')
      inString = !inString;

    // If we encounter a delimiter when we're not in a string...
    if(!inString && delimiters.test(char)) {

      // Add the token we've been building up thus far (e.g. the
      // multiple characters in a single symbol token) as a token.
      if(currToken.length)
        tokens.push(currToken)

      // *And*, add a token for the delimiter character itself,
      // except if the delimiter is some form of space. Spaces
      // don't get a token.
      if(!/^\s/.test(char))
        tokens.push(char)

      // And, finally, reset the token.
      currToken = "";
    }

    else {
      currToken += char;
    }

    currPos++;
  }

  // Above, we're adding the tokens that we build up character
  // by character, like symbol names or int literals, to the token
  // list when we get to the delimiter after the token ends. But,
  // if such a token is the last token in the stream, we need to
  // add it too! This does that.
  if(currToken.length)
    tokens.push(currToken);

  return tokens;
}

module.exports = tokenize;
