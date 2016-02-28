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
      currToken = "", currPos = 0, char,
      lastProgramIndex = program.length - 1;

  function finalizeToken() {
    if(currToken.length)
      tokens.push(currToken)

    currToken = "";
  }

  while(currPos < program.length) {
    char = program[currPos];

    // Within a string or a comment, normal delimiters
    // don't trigger new tokens. Instead, the tokenizer
    // stays in "string state" or "comment state" until
    // it sees the one character that can end a string or
    // commment respectively. Therefore, it's easy to just
    // immediately loop to the end of the token once it starts,
    // and thereby save ourselves from having to store
    // state flags for this outer loop.
    if(char === '"') {
      finalizeToken();

      do {
        // We're on the program's last character and haven't
        // found the ending double quote yet. (Check >= to
        // also, in case the escape-handling code skipped over
        // the last character.)
        if(currPos >= lastProgramIndex)
          throw new SyntaxError("Unexpected end of string");

        // Support backslash escapes for \\ and \" in strings.
        if(char === '\\') {
          let nextChar = program[currPos + 1];

          if(nextChar !== '"' && nextChar !== '\\')
            throw new SyntaxError('Escape sequences besides \\\\ and \\" are not supported.')

          char = nextChar;
          currPos++;
        }

        currToken += char;
        currPos++;
        char = program[currPos];
      }
      while(char !== '"');

      // Capture the ending quote.
      currToken += char;
      finalizeToken();
    }

    else if(char === ";") {
      finalizeToken()

      do {
        currToken += char;
        currPos++;
        char = program[currPos];
      }

      while(char && char !== "\n");
      finalizeToken();
    }

    // If we encounter a delimiter outside a string/comment...
    else if(delimiters.test(char)) {
      finalizeToken();

      // Add a token for the delimiter itself, except if the
      // delimiter is some form of space. Spaces don't get a token.
      if(!/^\s/.test(char))
        tokens.push(char)
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
  finalizeToken();

  return tokens;
}

module.exports = tokenize;
