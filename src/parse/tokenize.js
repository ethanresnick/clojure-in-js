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
  var delimiters = /^[()\{\},\[\]\s]/,
      tokens = [],
      currToken = "", currPos = 0, char = program[0],
      lastProgramIndex = program.length - 1;

  const finalizeToken = () => {
    if(currToken.length)
      tokens.push(currToken)

    currToken = "";
  }

  const advance = () => {
    currPos++;
    char = program[currPos];
  }

  while(currPos < program.length) {
    // When we get to the start of a string or comment, just
    // immediately build that whole token, which is easy because
    // no normal delimiters trigger new tokens in strings or
    // comments. This saves us from having to store state flags
    // for this outer loop.
    if(char === '"') {
      finalizeToken();

      do {
        // We're on the program's last character and haven't found
        // the ending double quote yet. (Check >= also, in case the
        // escape-handling code skipped over the last character.)
        if(currPos >= lastProgramIndex)
          throw new SyntaxError("Unexpected end of string");

        // Support backslash escapes for \\ and \" in strings.
        if(char === '\\') {
          advance();

          if(char !== '"' && char !== '\\')
            throw new SyntaxError('Escape sequences besides \\\\ and \\" are not supported.')
        }

        currToken += char;
        advance();
      }
      while(char !== '"');

      currToken += char; // Capture the ending quote.
      finalizeToken();
    }

    else if(char === ";") {
      finalizeToken();

      do {
        currToken += char;
        advance();
      }
      while(char && char !== "\n");

      finalizeToken();
    }

    // If we encounter a delimiter outside a string/comment,
    // add a token for the delimiter itself, except if the
    // delimiter is any kind of space. Spaces don't get a token,
    // and commas count as whitespace.
    else if(delimiters.test(char)) {
      finalizeToken();

      if(!/^(\s|,)/.test(char))
        tokens.push(char)
    }

    else {
      currToken += char;
    }

    advance();
  }

  // Above, we're adding the tokens that we build up character
  // by character, like symbol names or int literals, to the token
  // list when we get to the delimiter after the token ends. But,
  // if such a token is the last token in the stream, we need to
  // add it too! This does that.
  finalizeToken();

  return tokens;
}

module.exports = tokenize;
