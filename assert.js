// for now only these two functions.
// if necessary we could pull in something more sophisticated such as chai.js
var assert = {};

assert.AssertionError = function (message) {
  var SAFARI_STACK_ELEM = /([^@]*)@(.*):(\d+)/;
  var CHROME_STACK_ELEM = /\s*at ([^(]*)[(](.*):(\d+):(\d+)[)]/;

  this.message = message;
  try { throw new Error(); } catch (trace) {
    var idx;
    var stackTrace = trace.stack.split('\n');
    // parse the stack trace: each line is a tuple (function, file, lineNumber)
    // Note: unfortunately this is interpreter specific
    // safari: "<function>@<file>:<lineNumber>"
    // chrome: "at <function>(<file>:<line>:<col>"

    var stack = [];
    for (idx = 0; idx < stackTrace.length; idx++) {
      var match = SAFARI_STACK_ELEM.exec(stackTrace[idx]);
      if (!match) match = CHROME_STACK_ELEM.exec(stackTrace[idx]);
      if (match) {
        var entry = {
          func: match[1],
          file: match[2],
          line: match[3],
          col: match[4] || 0
        };
        if (entry.func === "") entry.func = "<anonymous>";
        stack.push(entry);
      }
    }

    // leave out the first entries that are from this file
    var thisFile = stack[0].file;
    for (idx = 1; idx < stack.length; idx++) {
      if (stack[idx].file !== thisFile) break;
    }
    this.stack = stack.slice(idx);
  }
};

assert.AssertionError.prototype = new Error();
assert.AssertionError.prototype.constructor = assert.AssertionError;
assert.AssertionError.prototype.name = 'AssertionError';

assert.AssertionError.prototype.log = function() {
  console.log(this.message);
  _.each(this.stack, function(frame) {
    console.log(frame.file+":"+frame.line);
  })
}
assert.AssertionError.prototype.toString = function() {
  var errorPos = this.stack[0];
  return this.message + " at " + errorPos.file+":"+errorPos.line;
};

var _assert = function(assertion, msg, cb) {
  if (!assertion) {
    var exc = new assert.AssertionError(msg);
    if (cb) cb(msg);
    throw exc;
  }
}

assert.fail = function(msg, cb) {
  var exc = new assert.AssertionError(msg);
  if (cb) cb(msg);
  throw exc;
};

assert.exception = function(func, cb) {
  var thrown = false;
  try {
    func();
  } catch (err) {
    thrown = true;
  }
  _assert(thrown, "Assertion failed. Expected an exception in "+func.toString());
};

assert.equal = function(expected, actual, cb) {
  var msg = "Assertion failed. Expected="+expected+", actual="+actual;
  _assert(expected === actual, msg, cb);
};

assert.isEqual = assert.equal;

assert.isTrue = function(stmt, cb) {
  assert.equal(true, stmt, cb);
};

assert.isFalse = function(stmt, cb) {
  assert.equal(false, stmt, cb);
};

assert.isNull = function(obj, cb) {
  assert.equal(null, obj, cb);
};

assert.notNull = function(obj, cb) {
  _assert(null !== obj, "Assertion failed. Actual value is null.", cb);
};

assert.isDefined = function(obj, cb) {
  _assert(undefined !== obj, "Assertion failed. Actual value is undefined.", cb);
};

assert.isUndefined = function(obj, cb) {
  assert.equal(undefined, obj, cb);
};
