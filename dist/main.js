'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

/**
 * Encode an integer in the range of 0 to 63 to a single base 64 digit.
 */
var encode = function (number) {
  if (0 <= number && number < intToCharMap.length) {
    return intToCharMap[number];
  }
  throw new TypeError("Must be between 0 and 63: " + number);
};

/**
 * Decode a single base 64 character code digit to an integer. Returns -1 on
 * failure.
 */
var decode = function (charCode) {
  var bigA = 65;     // 'A'
  var bigZ = 90;     // 'Z'

  var littleA = 97;  // 'a'
  var littleZ = 122; // 'z'

  var zero = 48;     // '0'
  var nine = 57;     // '9'

  var plus = 43;     // '+'
  var slash = 47;    // '/'

  var littleOffset = 26;
  var numberOffset = 52;

  // 0 - 25: ABCDEFGHIJKLMNOPQRSTUVWXYZ
  if (bigA <= charCode && charCode <= bigZ) {
    return (charCode - bigA);
  }

  // 26 - 51: abcdefghijklmnopqrstuvwxyz
  if (littleA <= charCode && charCode <= littleZ) {
    return (charCode - littleA + littleOffset);
  }

  // 52 - 61: 0123456789
  if (zero <= charCode && charCode <= nine) {
    return (charCode - zero + numberOffset);
  }

  // 62: +
  if (charCode == plus) {
    return 62;
  }

  // 63: /
  if (charCode == slash) {
    return 63;
  }

  // Invalid base64 digit.
  return -1;
};

var base64 = {
	encode: encode,
	decode: decode
};

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * Based on the Base 64 VLQ implementation in Closure Compiler:
 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
 *
 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name of Google Inc. nor the names of its
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */



// A single base 64 digit can contain 6 bits of data. For the base 64 variable
// length quantities we use in the source map spec, the first bit is the sign,
// the next four bits are the actual value, and the 6th bit is the
// continuation bit. The continuation bit tells us whether there are more
// digits in this value following this digit.
//
//   Continuation
//   |    Sign
//   |    |
//   V    V
//   101011

var VLQ_BASE_SHIFT = 5;

// binary: 100000
var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

// binary: 011111
var VLQ_BASE_MASK = VLQ_BASE - 1;

// binary: 100000
var VLQ_CONTINUATION_BIT = VLQ_BASE;

/**
 * Converts from a two-complement value to a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
 *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
 */
function toVLQSigned(aValue) {
  return aValue < 0
    ? ((-aValue) << 1) + 1
    : (aValue << 1) + 0;
}

/**
 * Converts to a two-complement value from a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
 *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
 */
function fromVLQSigned(aValue) {
  var isNegative = (aValue & 1) === 1;
  var shifted = aValue >> 1;
  return isNegative
    ? -shifted
    : shifted;
}

/**
 * Returns the base 64 VLQ encoded value.
 */
var encode$1 = function base64VLQ_encode(aValue) {
  var encoded = "";
  var digit;

  var vlq = toVLQSigned(aValue);

  do {
    digit = vlq & VLQ_BASE_MASK;
    vlq >>>= VLQ_BASE_SHIFT;
    if (vlq > 0) {
      // There are still more digits in this value, so we must make sure the
      // continuation bit is marked.
      digit |= VLQ_CONTINUATION_BIT;
    }
    encoded += base64.encode(digit);
  } while (vlq > 0);

  return encoded;
};

/**
 * Decodes the next base 64 VLQ value from the given string and returns the
 * value and the rest of the string via the out parameter.
 */
var decode$1 = function base64VLQ_decode(aStr, aIndex, aOutParam) {
  var strLen = aStr.length;
  var result = 0;
  var shift = 0;
  var continuation, digit;

  do {
    if (aIndex >= strLen) {
      throw new Error("Expected more digits in base 64 VLQ value.");
    }

    digit = base64.decode(aStr.charCodeAt(aIndex++));
    if (digit === -1) {
      throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
    }

    continuation = !!(digit & VLQ_CONTINUATION_BIT);
    digit &= VLQ_BASE_MASK;
    result = result + (digit << shift);
    shift += VLQ_BASE_SHIFT;
  } while (continuation);

  aOutParam.value = fromVLQSigned(result);
  aOutParam.rest = aIndex;
};

var base64Vlq = {
	encode: encode$1,
	decode: decode$1
};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var util = createCommonjsModule(function (module, exports) {
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This is a helper function for getting values from parameter/options
 * objects.
 *
 * @param args The object we are extracting values from
 * @param name The name of the property we are getting.
 * @param defaultValue An optional value to return if the property is missing
 * from the object. If this is not specified and the property is missing, an
 * error will be thrown.
 */
function getArg(aArgs, aName, aDefaultValue) {
  if (aName in aArgs) {
    return aArgs[aName];
  } else if (arguments.length === 3) {
    return aDefaultValue;
  } else {
    throw new Error('"' + aName + '" is a required argument.');
  }
}
exports.getArg = getArg;

var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
var dataUrlRegexp = /^data:.+\,.+$/;

function urlParse(aUrl) {
  var match = aUrl.match(urlRegexp);
  if (!match) {
    return null;
  }
  return {
    scheme: match[1],
    auth: match[2],
    host: match[3],
    port: match[4],
    path: match[5]
  };
}
exports.urlParse = urlParse;

function urlGenerate(aParsedUrl) {
  var url = '';
  if (aParsedUrl.scheme) {
    url += aParsedUrl.scheme + ':';
  }
  url += '//';
  if (aParsedUrl.auth) {
    url += aParsedUrl.auth + '@';
  }
  if (aParsedUrl.host) {
    url += aParsedUrl.host;
  }
  if (aParsedUrl.port) {
    url += ":" + aParsedUrl.port;
  }
  if (aParsedUrl.path) {
    url += aParsedUrl.path;
  }
  return url;
}
exports.urlGenerate = urlGenerate;

/**
 * Normalizes a path, or the path portion of a URL:
 *
 * - Replaces consecutive slashes with one slash.
 * - Removes unnecessary '.' parts.
 * - Removes unnecessary '<dir>/..' parts.
 *
 * Based on code in the Node.js 'path' core module.
 *
 * @param aPath The path or url to normalize.
 */
function normalize(aPath) {
  var path = aPath;
  var url = urlParse(aPath);
  if (url) {
    if (!url.path) {
      return aPath;
    }
    path = url.path;
  }
  var isAbsolute = exports.isAbsolute(path);

  var parts = path.split(/\/+/);
  for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
    part = parts[i];
    if (part === '.') {
      parts.splice(i, 1);
    } else if (part === '..') {
      up++;
    } else if (up > 0) {
      if (part === '') {
        // The first part is blank if the path is absolute. Trying to go
        // above the root is a no-op. Therefore we can remove all '..' parts
        // directly after the root.
        parts.splice(i + 1, up);
        up = 0;
      } else {
        parts.splice(i, 2);
        up--;
      }
    }
  }
  path = parts.join('/');

  if (path === '') {
    path = isAbsolute ? '/' : '.';
  }

  if (url) {
    url.path = path;
    return urlGenerate(url);
  }
  return path;
}
exports.normalize = normalize;

/**
 * Joins two paths/URLs.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be joined with the root.
 *
 * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
 *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
 *   first.
 * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
 *   is updated with the result and aRoot is returned. Otherwise the result
 *   is returned.
 *   - If aPath is absolute, the result is aPath.
 *   - Otherwise the two paths are joined with a slash.
 * - Joining for example 'http://' and 'www.example.com' is also supported.
 */
function join(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }
  if (aPath === "") {
    aPath = ".";
  }
  var aPathUrl = urlParse(aPath);
  var aRootUrl = urlParse(aRoot);
  if (aRootUrl) {
    aRoot = aRootUrl.path || '/';
  }

  // `join(foo, '//www.example.org')`
  if (aPathUrl && !aPathUrl.scheme) {
    if (aRootUrl) {
      aPathUrl.scheme = aRootUrl.scheme;
    }
    return urlGenerate(aPathUrl);
  }

  if (aPathUrl || aPath.match(dataUrlRegexp)) {
    return aPath;
  }

  // `join('http://', 'www.example.com')`
  if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
    aRootUrl.host = aPath;
    return urlGenerate(aRootUrl);
  }

  var joined = aPath.charAt(0) === '/'
    ? aPath
    : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

  if (aRootUrl) {
    aRootUrl.path = joined;
    return urlGenerate(aRootUrl);
  }
  return joined;
}
exports.join = join;

exports.isAbsolute = function (aPath) {
  return aPath.charAt(0) === '/' || urlRegexp.test(aPath);
};

/**
 * Make a path relative to a URL or another path.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be made relative to aRoot.
 */
function relative(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }

  aRoot = aRoot.replace(/\/$/, '');

  // It is possible for the path to be above the root. In this case, simply
  // checking whether the root is a prefix of the path won't work. Instead, we
  // need to remove components from the root one by one, until either we find
  // a prefix that fits, or we run out of components to remove.
  var level = 0;
  while (aPath.indexOf(aRoot + '/') !== 0) {
    var index = aRoot.lastIndexOf("/");
    if (index < 0) {
      return aPath;
    }

    // If the only part of the root that is left is the scheme (i.e. http://,
    // file:///, etc.), one or more slashes (/), or simply nothing at all, we
    // have exhausted all components, so the path is not relative to the root.
    aRoot = aRoot.slice(0, index);
    if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
      return aPath;
    }

    ++level;
  }

  // Make sure we add a "../" for each component we removed from the root.
  return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
}
exports.relative = relative;

var supportsNullProto = (function () {
  var obj = Object.create(null);
  return !('__proto__' in obj);
}());

function identity (s) {
  return s;
}

/**
 * Because behavior goes wacky when you set `__proto__` on objects, we
 * have to prefix all the strings in our set with an arbitrary character.
 *
 * See https://github.com/mozilla/source-map/pull/31 and
 * https://github.com/mozilla/source-map/issues/30
 *
 * @param String aStr
 */
function toSetString(aStr) {
  if (isProtoString(aStr)) {
    return '$' + aStr;
  }

  return aStr;
}
exports.toSetString = supportsNullProto ? identity : toSetString;

function fromSetString(aStr) {
  if (isProtoString(aStr)) {
    return aStr.slice(1);
  }

  return aStr;
}
exports.fromSetString = supportsNullProto ? identity : fromSetString;

function isProtoString(s) {
  if (!s) {
    return false;
  }

  var length = s.length;

  if (length < 9 /* "__proto__".length */) {
    return false;
  }

  if (s.charCodeAt(length - 1) !== 95  /* '_' */ ||
      s.charCodeAt(length - 2) !== 95  /* '_' */ ||
      s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 4) !== 116 /* 't' */ ||
      s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
      s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
      s.charCodeAt(length - 8) !== 95  /* '_' */ ||
      s.charCodeAt(length - 9) !== 95  /* '_' */) {
    return false;
  }

  for (var i = length - 10; i >= 0; i--) {
    if (s.charCodeAt(i) !== 36 /* '$' */) {
      return false;
    }
  }

  return true;
}

/**
 * Comparator between two mappings where the original positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same original source/line/column, but different generated
 * line and column the same. Useful when searching for a mapping with a
 * stubbed out mapping.
 */
function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
  var cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0 || onlyCompareOriginal) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByOriginalPositions = compareByOriginalPositions;

/**
 * Comparator between two mappings with deflated source and name indices where
 * the generated positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same generated line and column, but different
 * source/name/original line and column the same. Useful when searching for a
 * mapping with a stubbed out mapping.
 */
function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0 || onlyCompareGenerated) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

function strcmp(aStr1, aStr2) {
  if (aStr1 === aStr2) {
    return 0;
  }

  if (aStr1 === null) {
    return 1; // aStr2 !== null
  }

  if (aStr2 === null) {
    return -1; // aStr1 !== null
  }

  if (aStr1 > aStr2) {
    return 1;
  }

  return -1;
}

/**
 * Comparator between two mappings with inflated source and name strings where
 * the generated positions are compared.
 */
function compareByGeneratedPositionsInflated(mappingA, mappingB) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;

/**
 * Strip any JSON XSSI avoidance prefix from the string (as documented
 * in the source maps specification), and then parse the string as
 * JSON.
 */
function parseSourceMapInput(str) {
  return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ''));
}
exports.parseSourceMapInput = parseSourceMapInput;

/**
 * Compute the URL of a source given the the source root, the source's
 * URL, and the source map's URL.
 */
function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
  sourceURL = sourceURL || '';

  if (sourceRoot) {
    // This follows what Chrome does.
    if (sourceRoot[sourceRoot.length - 1] !== '/' && sourceURL[0] !== '/') {
      sourceRoot += '/';
    }
    // The spec says:
    //   Line 4: An optional source root, useful for relocating source
    //   files on a server or removing repeated values in the
    //   “sources” entry.  This value is prepended to the individual
    //   entries in the “source” field.
    sourceURL = sourceRoot + sourceURL;
  }

  // Historically, SourceMapConsumer did not take the sourceMapURL as
  // a parameter.  This mode is still somewhat supported, which is why
  // this code block is conditional.  However, it's preferable to pass
  // the source map URL to SourceMapConsumer, so that this function
  // can implement the source URL resolution algorithm as outlined in
  // the spec.  This block is basically the equivalent of:
  //    new URL(sourceURL, sourceMapURL).toString()
  // ... except it avoids using URL, which wasn't available in the
  // older releases of node still supported by this library.
  //
  // The spec says:
  //   If the sources are not absolute URLs after prepending of the
  //   “sourceRoot”, the sources are resolved relative to the
  //   SourceMap (like resolving script src in a html document).
  if (sourceMapURL) {
    var parsed = urlParse(sourceMapURL);
    if (!parsed) {
      throw new Error("sourceMapURL could not be parsed");
    }
    if (parsed.path) {
      // Strip the last path component, but keep the "/".
      var index = parsed.path.lastIndexOf('/');
      if (index >= 0) {
        parsed.path = parsed.path.substring(0, index + 1);
      }
    }
    sourceURL = join(urlGenerate(parsed), sourceURL);
  }

  return normalize(sourceURL);
}
exports.computeSourceURL = computeSourceURL;
});
var util_1 = util.getArg;
var util_2 = util.urlParse;
var util_3 = util.urlGenerate;
var util_4 = util.normalize;
var util_5 = util.join;
var util_6 = util.isAbsolute;
var util_7 = util.relative;
var util_8 = util.toSetString;
var util_9 = util.fromSetString;
var util_10 = util.compareByOriginalPositions;
var util_11 = util.compareByGeneratedPositionsDeflated;
var util_12 = util.compareByGeneratedPositionsInflated;
var util_13 = util.parseSourceMapInput;
var util_14 = util.computeSourceURL;

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */


var has = Object.prototype.hasOwnProperty;
var hasNativeMap = typeof Map !== "undefined";

/**
 * A data structure which is a combination of an array and a set. Adding a new
 * member is O(1), testing for membership is O(1), and finding the index of an
 * element is O(1). Removing elements from the set is not supported. Only
 * strings are supported for membership.
 */
function ArraySet() {
  this._array = [];
  this._set = hasNativeMap ? new Map() : Object.create(null);
}

/**
 * Static method for creating ArraySet instances from an existing array.
 */
ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
  var set = new ArraySet();
  for (var i = 0, len = aArray.length; i < len; i++) {
    set.add(aArray[i], aAllowDuplicates);
  }
  return set;
};

/**
 * Return how many unique items are in this ArraySet. If duplicates have been
 * added, than those do not count towards the size.
 *
 * @returns Number
 */
ArraySet.prototype.size = function ArraySet_size() {
  return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
};

/**
 * Add the given string to this set.
 *
 * @param String aStr
 */
ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
  var sStr = hasNativeMap ? aStr : util.toSetString(aStr);
  var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
  var idx = this._array.length;
  if (!isDuplicate || aAllowDuplicates) {
    this._array.push(aStr);
  }
  if (!isDuplicate) {
    if (hasNativeMap) {
      this._set.set(aStr, idx);
    } else {
      this._set[sStr] = idx;
    }
  }
};

/**
 * Is the given string a member of this set?
 *
 * @param String aStr
 */
ArraySet.prototype.has = function ArraySet_has(aStr) {
  if (hasNativeMap) {
    return this._set.has(aStr);
  } else {
    var sStr = util.toSetString(aStr);
    return has.call(this._set, sStr);
  }
};

/**
 * What is the index of the given string in the array?
 *
 * @param String aStr
 */
ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
  if (hasNativeMap) {
    var idx = this._set.get(aStr);
    if (idx >= 0) {
        return idx;
    }
  } else {
    var sStr = util.toSetString(aStr);
    if (has.call(this._set, sStr)) {
      return this._set[sStr];
    }
  }

  throw new Error('"' + aStr + '" is not in the set.');
};

/**
 * What is the element at the given index?
 *
 * @param Number aIdx
 */
ArraySet.prototype.at = function ArraySet_at(aIdx) {
  if (aIdx >= 0 && aIdx < this._array.length) {
    return this._array[aIdx];
  }
  throw new Error('No element indexed by ' + aIdx);
};

/**
 * Returns the array representation of this set (which has the proper indices
 * indicated by indexOf). Note that this is a copy of the internal array used
 * for storing the members so that no one can mess with internal state.
 */
ArraySet.prototype.toArray = function ArraySet_toArray() {
  return this._array.slice();
};

var ArraySet_1 = ArraySet;

var arraySet = {
	ArraySet: ArraySet_1
};

var binarySearch = createCommonjsModule(function (module, exports) {
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

exports.GREATEST_LOWER_BOUND = 1;
exports.LEAST_UPPER_BOUND = 2;

/**
 * Recursive implementation of binary search.
 *
 * @param aLow Indices here and lower do not contain the needle.
 * @param aHigh Indices here and higher do not contain the needle.
 * @param aNeedle The element being searched for.
 * @param aHaystack The non-empty array being searched.
 * @param aCompare Function which takes two elements and returns -1, 0, or 1.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 */
function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
  // This function terminates when one of the following is true:
  //
  //   1. We find the exact element we are looking for.
  //
  //   2. We did not find the exact element, but we can return the index of
  //      the next-closest element.
  //
  //   3. We did not find the exact element, and there is no next-closest
  //      element than the one we are searching for, so we return -1.
  var mid = Math.floor((aHigh - aLow) / 2) + aLow;
  var cmp = aCompare(aNeedle, aHaystack[mid], true);
  if (cmp === 0) {
    // Found the element we are looking for.
    return mid;
  }
  else if (cmp > 0) {
    // Our needle is greater than aHaystack[mid].
    if (aHigh - mid > 1) {
      // The element is in the upper half.
      return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
    }

    // The exact needle element was not found in this haystack. Determine if
    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return aHigh < aHaystack.length ? aHigh : -1;
    } else {
      return mid;
    }
  }
  else {
    // Our needle is less than aHaystack[mid].
    if (mid - aLow > 1) {
      // The element is in the lower half.
      return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
    }

    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return mid;
    } else {
      return aLow < 0 ? -1 : aLow;
    }
  }
}

/**
 * This is an implementation of binary search which will always try and return
 * the index of the closest element if there is no exact hit. This is because
 * mappings between original and generated line/col pairs are single points,
 * and there is an implicit region between each of them, so a miss just means
 * that you aren't on the very start of a region.
 *
 * @param aNeedle The element you are looking for.
 * @param aHaystack The array that is being searched.
 * @param aCompare A function which takes the needle and an element in the
 *     array and returns -1, 0, or 1 depending on whether the needle is less
 *     than, equal to, or greater than the element, respectively.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
 */
exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
  if (aHaystack.length === 0) {
    return -1;
  }

  var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack,
                              aCompare, aBias || exports.GREATEST_LOWER_BOUND);
  if (index < 0) {
    return -1;
  }

  // We have found either the exact element, or the next-closest element than
  // the one we are searching for. However, there may be more than one such
  // element. Make sure we always return the smallest of these.
  while (index - 1 >= 0) {
    if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
      break;
    }
    --index;
  }

  return index;
};
});
var binarySearch_1 = binarySearch.GREATEST_LOWER_BOUND;
var binarySearch_2 = binarySearch.LEAST_UPPER_BOUND;
var binarySearch_3 = binarySearch.search;

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

// It turns out that some (most?) JavaScript engines don't self-host
// `Array.prototype.sort`. This makes sense because C++ will likely remain
// faster than JS when doing raw CPU-intensive sorting. However, when using a
// custom comparator function, calling back and forth between the VM's C++ and
// JIT'd JS is rather slow *and* loses JIT type information, resulting in
// worse generated code for the comparator function than would be optimal. In
// fact, when sorting with a comparator, these costs outweigh the benefits of
// sorting in C++. By using our own JS-implemented Quick Sort (below), we get
// a ~3500ms mean speed-up in `bench/bench.html`.

/**
 * Swap the elements indexed by `x` and `y` in the array `ary`.
 *
 * @param {Array} ary
 *        The array.
 * @param {Number} x
 *        The index of the first item.
 * @param {Number} y
 *        The index of the second item.
 */
function swap(ary, x, y) {
  var temp = ary[x];
  ary[x] = ary[y];
  ary[y] = temp;
}

/**
 * Returns a random integer within the range `low .. high` inclusive.
 *
 * @param {Number} low
 *        The lower bound on the range.
 * @param {Number} high
 *        The upper bound on the range.
 */
function randomIntInRange(low, high) {
  return Math.round(low + (Math.random() * (high - low)));
}

/**
 * The Quick Sort algorithm.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 * @param {Number} p
 *        Start index of the array
 * @param {Number} r
 *        End index of the array
 */
function doQuickSort(ary, comparator, p, r) {
  // If our lower bound is less than our upper bound, we (1) partition the
  // array into two pieces and (2) recurse on each half. If it is not, this is
  // the empty array and our base case.

  if (p < r) {
    // (1) Partitioning.
    //
    // The partitioning chooses a pivot between `p` and `r` and moves all
    // elements that are less than or equal to the pivot to the before it, and
    // all the elements that are greater than it after it. The effect is that
    // once partition is done, the pivot is in the exact place it will be when
    // the array is put in sorted order, and it will not need to be moved
    // again. This runs in O(n) time.

    // Always choose a random pivot so that an input array which is reverse
    // sorted does not cause O(n^2) running time.
    var pivotIndex = randomIntInRange(p, r);
    var i = p - 1;

    swap(ary, pivotIndex, r);
    var pivot = ary[r];

    // Immediately after `j` is incremented in this loop, the following hold
    // true:
    //
    //   * Every element in `ary[p .. i]` is less than or equal to the pivot.
    //
    //   * Every element in `ary[i+1 .. j-1]` is greater than the pivot.
    for (var j = p; j < r; j++) {
      if (comparator(ary[j], pivot) <= 0) {
        i += 1;
        swap(ary, i, j);
      }
    }

    swap(ary, i + 1, j);
    var q = i + 1;

    // (2) Recurse on each half.

    doQuickSort(ary, comparator, p, q - 1);
    doQuickSort(ary, comparator, q + 1, r);
  }
}

/**
 * Sort the given array in-place with the given comparator function.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 */
var quickSort_1 = function (ary, comparator) {
  doQuickSort(ary, comparator, 0, ary.length - 1);
};

var quickSort = {
	quickSort: quickSort_1
};

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */



var ArraySet$2 = arraySet.ArraySet;

var quickSort$1 = quickSort.quickSort;

function SourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util.parseSourceMapInput(aSourceMap);
  }

  return sourceMap.sections != null
    ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL)
    : new BasicSourceMapConsumer(sourceMap, aSourceMapURL);
}

SourceMapConsumer.fromSourceMap = function(aSourceMap, aSourceMapURL) {
  return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
};

/**
 * The version of the source mapping spec that we are consuming.
 */
SourceMapConsumer.prototype._version = 3;

// `__generatedMappings` and `__originalMappings` are arrays that hold the
// parsed mapping coordinates from the source map's "mappings" attribute. They
// are lazily instantiated, accessed via the `_generatedMappings` and
// `_originalMappings` getters respectively, and we only parse the mappings
// and create these arrays once queried for a source location. We jump through
// these hoops because there can be many thousands of mappings, and parsing
// them is expensive, so we only want to do it if we must.
//
// Each object in the arrays is of the form:
//
//     {
//       generatedLine: The line number in the generated code,
//       generatedColumn: The column number in the generated code,
//       source: The path to the original source file that generated this
//               chunk of code,
//       originalLine: The line number in the original source that
//                     corresponds to this chunk of generated code,
//       originalColumn: The column number in the original source that
//                       corresponds to this chunk of generated code,
//       name: The name of the original symbol which generated this chunk of
//             code.
//     }
//
// All properties except for `generatedLine` and `generatedColumn` can be
// `null`.
//
// `_generatedMappings` is ordered by the generated positions.
//
// `_originalMappings` is ordered by the original positions.

SourceMapConsumer.prototype.__generatedMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
  configurable: true,
  enumerable: true,
  get: function () {
    if (!this.__generatedMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__generatedMappings;
  }
});

SourceMapConsumer.prototype.__originalMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
  configurable: true,
  enumerable: true,
  get: function () {
    if (!this.__originalMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__originalMappings;
  }
});

SourceMapConsumer.prototype._charIsMappingSeparator =
  function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
    var c = aStr.charAt(index);
    return c === ";" || c === ",";
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
SourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    throw new Error("Subclasses must implement _parseMappings");
  };

SourceMapConsumer.GENERATED_ORDER = 1;
SourceMapConsumer.ORIGINAL_ORDER = 2;

SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
SourceMapConsumer.LEAST_UPPER_BOUND = 2;

/**
 * Iterate over each mapping between an original source/line/column and a
 * generated line/column in this source map.
 *
 * @param Function aCallback
 *        The function that is called with each mapping.
 * @param Object aContext
 *        Optional. If specified, this object will be the value of `this` every
 *        time that `aCallback` is called.
 * @param aOrder
 *        Either `SourceMapConsumer.GENERATED_ORDER` or
 *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
 *        iterate over the mappings sorted by the generated file's line/column
 *        order or the original's source/line/column order, respectively. Defaults to
 *        `SourceMapConsumer.GENERATED_ORDER`.
 */
SourceMapConsumer.prototype.eachMapping =
  function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
    var context = aContext || null;
    var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

    var mappings;
    switch (order) {
    case SourceMapConsumer.GENERATED_ORDER:
      mappings = this._generatedMappings;
      break;
    case SourceMapConsumer.ORIGINAL_ORDER:
      mappings = this._originalMappings;
      break;
    default:
      throw new Error("Unknown order of iteration.");
    }

    var sourceRoot = this.sourceRoot;
    mappings.map(function (mapping) {
      var source = mapping.source === null ? null : this._sources.at(mapping.source);
      source = util.computeSourceURL(sourceRoot, source, this._sourceMapURL);
      return {
        source: source,
        generatedLine: mapping.generatedLine,
        generatedColumn: mapping.generatedColumn,
        originalLine: mapping.originalLine,
        originalColumn: mapping.originalColumn,
        name: mapping.name === null ? null : this._names.at(mapping.name)
      };
    }, this).forEach(aCallback, context);
  };

/**
 * Returns all generated line and column information for the original source,
 * line, and column provided. If no column is provided, returns all mappings
 * corresponding to a either the line we are searching for or the next
 * closest line that has any mappings. Otherwise, returns all mappings
 * corresponding to the given line and either the column we are searching for
 * or the next closest column that has any offsets.
 *
 * The only argument is an object with the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number is 1-based.
 *   - column: Optional. the column number in the original source.
 *    The column number is 0-based.
 *
 * and an array of objects is returned, each with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *    line number is 1-based.
 *   - column: The column number in the generated source, or null.
 *    The column number is 0-based.
 */
SourceMapConsumer.prototype.allGeneratedPositionsFor =
  function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
    var line = util.getArg(aArgs, 'line');

    // When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
    // returns the index of the closest mapping less than the needle. By
    // setting needle.originalColumn to 0, we thus find the last mapping for
    // the given line, provided such a mapping exists.
    var needle = {
      source: util.getArg(aArgs, 'source'),
      originalLine: line,
      originalColumn: util.getArg(aArgs, 'column', 0)
    };

    needle.source = this._findSourceIndex(needle.source);
    if (needle.source < 0) {
      return [];
    }

    var mappings = [];

    var index = this._findMapping(needle,
                                  this._originalMappings,
                                  "originalLine",
                                  "originalColumn",
                                  util.compareByOriginalPositions,
                                  binarySearch.LEAST_UPPER_BOUND);
    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (aArgs.column === undefined) {
        var originalLine = mapping.originalLine;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we found. Since
        // mappings are sorted, this is guaranteed to find all mappings for
        // the line we found.
        while (mapping && mapping.originalLine === originalLine) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      } else {
        var originalColumn = mapping.originalColumn;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we were searching for.
        // Since mappings are sorted, this is guaranteed to find all mappings for
        // the line we are searching for.
        while (mapping &&
               mapping.originalLine === line &&
               mapping.originalColumn == originalColumn) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      }
    }

    return mappings;
  };

var SourceMapConsumer_1 = SourceMapConsumer;

/**
 * A BasicSourceMapConsumer instance represents a parsed source map which we can
 * query for information about the original file positions by giving it a file
 * position in the generated source.
 *
 * The first parameter is the raw source map (either as a JSON string, or
 * already parsed to an object). According to the spec, source maps have the
 * following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - sources: An array of URLs to the original source files.
 *   - names: An array of identifiers which can be referrenced by individual mappings.
 *   - sourceRoot: Optional. The URL root from which all sources are relative.
 *   - sourcesContent: Optional. An array of contents of the original source files.
 *   - mappings: A string of base64 VLQs which contain the actual mappings.
 *   - file: Optional. The generated file this source map is associated with.
 *
 * Here is an example source map, taken from the source map spec[0]:
 *
 *     {
 *       version : 3,
 *       file: "out.js",
 *       sourceRoot : "",
 *       sources: ["foo.js", "bar.js"],
 *       names: ["src", "maps", "are", "fun"],
 *       mappings: "AA,AB;;ABCDE;"
 *     }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
 */
function BasicSourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util.parseSourceMapInput(aSourceMap);
  }

  var version = util.getArg(sourceMap, 'version');
  var sources = util.getArg(sourceMap, 'sources');
  // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
  // requires the array) to play nice here.
  var names = util.getArg(sourceMap, 'names', []);
  var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
  var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
  var mappings = util.getArg(sourceMap, 'mappings');
  var file = util.getArg(sourceMap, 'file', null);

  // Once again, Sass deviates from the spec and supplies the version as a
  // string rather than a number, so we use loose equality checking here.
  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  if (sourceRoot) {
    sourceRoot = util.normalize(sourceRoot);
  }

  sources = sources
    .map(String)
    // Some source maps produce relative source paths like "./foo.js" instead of
    // "foo.js".  Normalize these first so that future comparisons will succeed.
    // See bugzil.la/1090768.
    .map(util.normalize)
    // Always ensure that absolute sources are internally stored relative to
    // the source root, if the source root is absolute. Not doing this would
    // be particularly problematic when the source root is a prefix of the
    // source (valid, but why??). See github issue #199 and bugzil.la/1188982.
    .map(function (source) {
      return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source)
        ? util.relative(sourceRoot, source)
        : source;
    });

  // Pass `true` below to allow duplicate names and sources. While source maps
  // are intended to be compressed and deduplicated, the TypeScript compiler
  // sometimes generates source maps with duplicates in them. See Github issue
  // #72 and bugzil.la/889492.
  this._names = ArraySet$2.fromArray(names.map(String), true);
  this._sources = ArraySet$2.fromArray(sources, true);

  this._absoluteSources = this._sources.toArray().map(function (s) {
    return util.computeSourceURL(sourceRoot, s, aSourceMapURL);
  });

  this.sourceRoot = sourceRoot;
  this.sourcesContent = sourcesContent;
  this._mappings = mappings;
  this._sourceMapURL = aSourceMapURL;
  this.file = file;
}

BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;

/**
 * Utility function to find the index of a source.  Returns -1 if not
 * found.
 */
BasicSourceMapConsumer.prototype._findSourceIndex = function(aSource) {
  var relativeSource = aSource;
  if (this.sourceRoot != null) {
    relativeSource = util.relative(this.sourceRoot, relativeSource);
  }

  if (this._sources.has(relativeSource)) {
    return this._sources.indexOf(relativeSource);
  }

  // Maybe aSource is an absolute URL as returned by |sources|.  In
  // this case we can't simply undo the transform.
  var i;
  for (i = 0; i < this._absoluteSources.length; ++i) {
    if (this._absoluteSources[i] == aSource) {
      return i;
    }
  }

  return -1;
};

/**
 * Create a BasicSourceMapConsumer from a SourceMapGenerator.
 *
 * @param SourceMapGenerator aSourceMap
 *        The source map that will be consumed.
 * @param String aSourceMapURL
 *        The URL at which the source map can be found (optional)
 * @returns BasicSourceMapConsumer
 */
BasicSourceMapConsumer.fromSourceMap =
  function SourceMapConsumer_fromSourceMap(aSourceMap, aSourceMapURL) {
    var smc = Object.create(BasicSourceMapConsumer.prototype);

    var names = smc._names = ArraySet$2.fromArray(aSourceMap._names.toArray(), true);
    var sources = smc._sources = ArraySet$2.fromArray(aSourceMap._sources.toArray(), true);
    smc.sourceRoot = aSourceMap._sourceRoot;
    smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                            smc.sourceRoot);
    smc.file = aSourceMap._file;
    smc._sourceMapURL = aSourceMapURL;
    smc._absoluteSources = smc._sources.toArray().map(function (s) {
      return util.computeSourceURL(smc.sourceRoot, s, aSourceMapURL);
    });

    // Because we are modifying the entries (by converting string sources and
    // names to indices into the sources and names ArraySets), we have to make
    // a copy of the entry or else bad things happen. Shared mutable state
    // strikes again! See github issue #191.

    var generatedMappings = aSourceMap._mappings.toArray().slice();
    var destGeneratedMappings = smc.__generatedMappings = [];
    var destOriginalMappings = smc.__originalMappings = [];

    for (var i = 0, length = generatedMappings.length; i < length; i++) {
      var srcMapping = generatedMappings[i];
      var destMapping = new Mapping;
      destMapping.generatedLine = srcMapping.generatedLine;
      destMapping.generatedColumn = srcMapping.generatedColumn;

      if (srcMapping.source) {
        destMapping.source = sources.indexOf(srcMapping.source);
        destMapping.originalLine = srcMapping.originalLine;
        destMapping.originalColumn = srcMapping.originalColumn;

        if (srcMapping.name) {
          destMapping.name = names.indexOf(srcMapping.name);
        }

        destOriginalMappings.push(destMapping);
      }

      destGeneratedMappings.push(destMapping);
    }

    quickSort$1(smc.__originalMappings, util.compareByOriginalPositions);

    return smc;
  };

/**
 * The version of the source mapping spec that we are consuming.
 */
BasicSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(BasicSourceMapConsumer.prototype, 'sources', {
  get: function () {
    return this._absoluteSources.slice();
  }
});

/**
 * Provide the JIT with a nice shape / hidden class.
 */
function Mapping() {
  this.generatedLine = 0;
  this.generatedColumn = 0;
  this.source = null;
  this.originalLine = null;
  this.originalColumn = null;
  this.name = null;
}

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
BasicSourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    var generatedLine = 1;
    var previousGeneratedColumn = 0;
    var previousOriginalLine = 0;
    var previousOriginalColumn = 0;
    var previousSource = 0;
    var previousName = 0;
    var length = aStr.length;
    var index = 0;
    var cachedSegments = {};
    var temp = {};
    var originalMappings = [];
    var generatedMappings = [];
    var mapping, str, segment, end, value;

    while (index < length) {
      if (aStr.charAt(index) === ';') {
        generatedLine++;
        index++;
        previousGeneratedColumn = 0;
      }
      else if (aStr.charAt(index) === ',') {
        index++;
      }
      else {
        mapping = new Mapping();
        mapping.generatedLine = generatedLine;

        // Because each offset is encoded relative to the previous one,
        // many segments often have the same encoding. We can exploit this
        // fact by caching the parsed variable length fields of each segment,
        // allowing us to avoid a second parse if we encounter the same
        // segment again.
        for (end = index; end < length; end++) {
          if (this._charIsMappingSeparator(aStr, end)) {
            break;
          }
        }
        str = aStr.slice(index, end);

        segment = cachedSegments[str];
        if (segment) {
          index += str.length;
        } else {
          segment = [];
          while (index < end) {
            base64Vlq.decode(aStr, index, temp);
            value = temp.value;
            index = temp.rest;
            segment.push(value);
          }

          if (segment.length === 2) {
            throw new Error('Found a source, but no line and column');
          }

          if (segment.length === 3) {
            throw new Error('Found a source and line, but no column');
          }

          cachedSegments[str] = segment;
        }

        // Generated column.
        mapping.generatedColumn = previousGeneratedColumn + segment[0];
        previousGeneratedColumn = mapping.generatedColumn;

        if (segment.length > 1) {
          // Original source.
          mapping.source = previousSource + segment[1];
          previousSource += segment[1];

          // Original line.
          mapping.originalLine = previousOriginalLine + segment[2];
          previousOriginalLine = mapping.originalLine;
          // Lines are stored 0-based
          mapping.originalLine += 1;

          // Original column.
          mapping.originalColumn = previousOriginalColumn + segment[3];
          previousOriginalColumn = mapping.originalColumn;

          if (segment.length > 4) {
            // Original name.
            mapping.name = previousName + segment[4];
            previousName += segment[4];
          }
        }

        generatedMappings.push(mapping);
        if (typeof mapping.originalLine === 'number') {
          originalMappings.push(mapping);
        }
      }
    }

    quickSort$1(generatedMappings, util.compareByGeneratedPositionsDeflated);
    this.__generatedMappings = generatedMappings;

    quickSort$1(originalMappings, util.compareByOriginalPositions);
    this.__originalMappings = originalMappings;
  };

/**
 * Find the mapping that best matches the hypothetical "needle" mapping that
 * we are searching for in the given "haystack" of mappings.
 */
BasicSourceMapConsumer.prototype._findMapping =
  function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                         aColumnName, aComparator, aBias) {
    // To return the position we are searching for, we must first find the
    // mapping for the given position and then return the opposite position it
    // points to. Because the mappings are sorted, we can use binary search to
    // find the best mapping.

    if (aNeedle[aLineName] <= 0) {
      throw new TypeError('Line must be greater than or equal to 1, got '
                          + aNeedle[aLineName]);
    }
    if (aNeedle[aColumnName] < 0) {
      throw new TypeError('Column must be greater than or equal to 0, got '
                          + aNeedle[aColumnName]);
    }

    return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
  };

/**
 * Compute the last column for each generated mapping. The last column is
 * inclusive.
 */
BasicSourceMapConsumer.prototype.computeColumnSpans =
  function SourceMapConsumer_computeColumnSpans() {
    for (var index = 0; index < this._generatedMappings.length; ++index) {
      var mapping = this._generatedMappings[index];

      // Mappings do not contain a field for the last generated columnt. We
      // can come up with an optimistic estimate, however, by assuming that
      // mappings are contiguous (i.e. given two consecutive mappings, the
      // first mapping ends where the second one starts).
      if (index + 1 < this._generatedMappings.length) {
        var nextMapping = this._generatedMappings[index + 1];

        if (mapping.generatedLine === nextMapping.generatedLine) {
          mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
          continue;
        }
      }

      // The last mapping for each line spans the entire line.
      mapping.lastGeneratedColumn = Infinity;
    }
  };

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.  The line number
 *     is 1-based.
 *   - column: The column number in the generated source.  The column
 *     number is 0-based.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the original source, or null.  The
 *     column number is 0-based.
 *   - name: The original identifier, or null.
 */
BasicSourceMapConsumer.prototype.originalPositionFor =
  function SourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._generatedMappings,
      "generatedLine",
      "generatedColumn",
      util.compareByGeneratedPositionsDeflated,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._generatedMappings[index];

      if (mapping.generatedLine === needle.generatedLine) {
        var source = util.getArg(mapping, 'source', null);
        if (source !== null) {
          source = this._sources.at(source);
          source = util.computeSourceURL(this.sourceRoot, source, this._sourceMapURL);
        }
        var name = util.getArg(mapping, 'name', null);
        if (name !== null) {
          name = this._names.at(name);
        }
        return {
          source: source,
          line: util.getArg(mapping, 'originalLine', null),
          column: util.getArg(mapping, 'originalColumn', null),
          name: name
        };
      }
    }

    return {
      source: null,
      line: null,
      column: null,
      name: null
    };
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
BasicSourceMapConsumer.prototype.hasContentsOfAllSources =
  function BasicSourceMapConsumer_hasContentsOfAllSources() {
    if (!this.sourcesContent) {
      return false;
    }
    return this.sourcesContent.length >= this._sources.size() &&
      !this.sourcesContent.some(function (sc) { return sc == null; });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
BasicSourceMapConsumer.prototype.sourceContentFor =
  function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    if (!this.sourcesContent) {
      return null;
    }

    var index = this._findSourceIndex(aSource);
    if (index >= 0) {
      return this.sourcesContent[index];
    }

    var relativeSource = aSource;
    if (this.sourceRoot != null) {
      relativeSource = util.relative(this.sourceRoot, relativeSource);
    }

    var url;
    if (this.sourceRoot != null
        && (url = util.urlParse(this.sourceRoot))) {
      // XXX: file:// URIs and absolute paths lead to unexpected behavior for
      // many users. We can help them out when they expect file:// URIs to
      // behave like it would if they were running a local HTTP server. See
      // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
      var fileUriAbsPath = relativeSource.replace(/^file:\/\//, "");
      if (url.scheme == "file"
          && this._sources.has(fileUriAbsPath)) {
        return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
      }

      if ((!url.path || url.path == "/")
          && this._sources.has("/" + relativeSource)) {
        return this.sourcesContent[this._sources.indexOf("/" + relativeSource)];
      }
    }

    // This function is used recursively from
    // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
    // don't want to throw if we can't find the source - we just want to
    // return null, so we provide a flag to exit gracefully.
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + relativeSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number
 *     is 1-based.
 *   - column: The column number in the original source.  The column
 *     number is 0-based.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the generated source, or null.
 *     The column number is 0-based.
 */
BasicSourceMapConsumer.prototype.generatedPositionFor =
  function SourceMapConsumer_generatedPositionFor(aArgs) {
    var source = util.getArg(aArgs, 'source');
    source = this._findSourceIndex(source);
    if (source < 0) {
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    }

    var needle = {
      source: source,
      originalLine: util.getArg(aArgs, 'line'),
      originalColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._originalMappings,
      "originalLine",
      "originalColumn",
      util.compareByOriginalPositions,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (mapping.source === needle.source) {
        return {
          line: util.getArg(mapping, 'generatedLine', null),
          column: util.getArg(mapping, 'generatedColumn', null),
          lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
        };
      }
    }

    return {
      line: null,
      column: null,
      lastColumn: null
    };
  };

var BasicSourceMapConsumer_1 = BasicSourceMapConsumer;

/**
 * An IndexedSourceMapConsumer instance represents a parsed source map which
 * we can query for information. It differs from BasicSourceMapConsumer in
 * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
 * input.
 *
 * The first parameter is a raw source map (either as a JSON string, or already
 * parsed to an object). According to the spec for indexed source maps, they
 * have the following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - file: Optional. The generated file this source map is associated with.
 *   - sections: A list of section definitions.
 *
 * Each value under the "sections" field has two fields:
 *   - offset: The offset into the original specified at which this section
 *       begins to apply, defined as an object with a "line" and "column"
 *       field.
 *   - map: A source map definition. This source map could also be indexed,
 *       but doesn't have to be.
 *
 * Instead of the "map" field, it's also possible to have a "url" field
 * specifying a URL to retrieve a source map from, but that's currently
 * unsupported.
 *
 * Here's an example source map, taken from the source map spec[0], but
 * modified to omit a section which uses the "url" field.
 *
 *  {
 *    version : 3,
 *    file: "app.js",
 *    sections: [{
 *      offset: {line:100, column:10},
 *      map: {
 *        version : 3,
 *        file: "section.js",
 *        sources: ["foo.js", "bar.js"],
 *        names: ["src", "maps", "are", "fun"],
 *        mappings: "AAAA,E;;ABCDE;"
 *      }
 *    }],
 *  }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
 */
function IndexedSourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util.parseSourceMapInput(aSourceMap);
  }

  var version = util.getArg(sourceMap, 'version');
  var sections = util.getArg(sourceMap, 'sections');

  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  this._sources = new ArraySet$2();
  this._names = new ArraySet$2();

  var lastOffset = {
    line: -1,
    column: 0
  };
  this._sections = sections.map(function (s) {
    if (s.url) {
      // The url field will require support for asynchronicity.
      // See https://github.com/mozilla/source-map/issues/16
      throw new Error('Support for url field in sections not implemented.');
    }
    var offset = util.getArg(s, 'offset');
    var offsetLine = util.getArg(offset, 'line');
    var offsetColumn = util.getArg(offset, 'column');

    if (offsetLine < lastOffset.line ||
        (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
      throw new Error('Section offsets must be ordered and non-overlapping.');
    }
    lastOffset = offset;

    return {
      generatedOffset: {
        // The offset fields are 0-based, but we use 1-based indices when
        // encoding/decoding from VLQ.
        generatedLine: offsetLine + 1,
        generatedColumn: offsetColumn + 1
      },
      consumer: new SourceMapConsumer(util.getArg(s, 'map'), aSourceMapURL)
    }
  });
}

IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;

/**
 * The version of the source mapping spec that we are consuming.
 */
IndexedSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(IndexedSourceMapConsumer.prototype, 'sources', {
  get: function () {
    var sources = [];
    for (var i = 0; i < this._sections.length; i++) {
      for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
        sources.push(this._sections[i].consumer.sources[j]);
      }
    }
    return sources;
  }
});

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.  The line number
 *     is 1-based.
 *   - column: The column number in the generated source.  The column
 *     number is 0-based.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the original source, or null.  The
 *     column number is 0-based.
 *   - name: The original identifier, or null.
 */
IndexedSourceMapConsumer.prototype.originalPositionFor =
  function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    // Find the section containing the generated position we're trying to map
    // to an original position.
    var sectionIndex = binarySearch.search(needle, this._sections,
      function(needle, section) {
        var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
        if (cmp) {
          return cmp;
        }

        return (needle.generatedColumn -
                section.generatedOffset.generatedColumn);
      });
    var section = this._sections[sectionIndex];

    if (!section) {
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    }

    return section.consumer.originalPositionFor({
      line: needle.generatedLine -
        (section.generatedOffset.generatedLine - 1),
      column: needle.generatedColumn -
        (section.generatedOffset.generatedLine === needle.generatedLine
         ? section.generatedOffset.generatedColumn - 1
         : 0),
      bias: aArgs.bias
    });
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
IndexedSourceMapConsumer.prototype.hasContentsOfAllSources =
  function IndexedSourceMapConsumer_hasContentsOfAllSources() {
    return this._sections.every(function (s) {
      return s.consumer.hasContentsOfAllSources();
    });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
IndexedSourceMapConsumer.prototype.sourceContentFor =
  function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      var content = section.consumer.sourceContentFor(aSource, true);
      if (content) {
        return content;
      }
    }
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + aSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number
 *     is 1-based.
 *   - column: The column number in the original source.  The column
 *     number is 0-based.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *     line number is 1-based. 
 *   - column: The column number in the generated source, or null.
 *     The column number is 0-based.
 */
IndexedSourceMapConsumer.prototype.generatedPositionFor =
  function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      // Only consider this section if the requested source is in the list of
      // sources of the consumer.
      if (section.consumer._findSourceIndex(util.getArg(aArgs, 'source')) === -1) {
        continue;
      }
      var generatedPosition = section.consumer.generatedPositionFor(aArgs);
      if (generatedPosition) {
        var ret = {
          line: generatedPosition.line +
            (section.generatedOffset.generatedLine - 1),
          column: generatedPosition.column +
            (section.generatedOffset.generatedLine === generatedPosition.line
             ? section.generatedOffset.generatedColumn - 1
             : 0)
        };
        return ret;
      }
    }

    return {
      line: null,
      column: null
    };
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
IndexedSourceMapConsumer.prototype._parseMappings =
  function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    this.__generatedMappings = [];
    this.__originalMappings = [];
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];
      var sectionMappings = section.consumer._generatedMappings;
      for (var j = 0; j < sectionMappings.length; j++) {
        var mapping = sectionMappings[j];

        var source = section.consumer._sources.at(mapping.source);
        source = util.computeSourceURL(section.consumer.sourceRoot, source, this._sourceMapURL);
        this._sources.add(source);
        source = this._sources.indexOf(source);

        var name = null;
        if (mapping.name) {
          name = section.consumer._names.at(mapping.name);
          this._names.add(name);
          name = this._names.indexOf(name);
        }

        // The mappings coming from the consumer for the section have
        // generated positions relative to the start of the section, so we
        // need to offset them to be relative to the start of the concatenated
        // generated file.
        var adjustedMapping = {
          source: source,
          generatedLine: mapping.generatedLine +
            (section.generatedOffset.generatedLine - 1),
          generatedColumn: mapping.generatedColumn +
            (section.generatedOffset.generatedLine === mapping.generatedLine
            ? section.generatedOffset.generatedColumn - 1
            : 0),
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: name
        };

        this.__generatedMappings.push(adjustedMapping);
        if (typeof adjustedMapping.originalLine === 'number') {
          this.__originalMappings.push(adjustedMapping);
        }
      }
    }

    quickSort$1(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
    quickSort$1(this.__originalMappings, util.compareByOriginalPositions);
  };

var IndexedSourceMapConsumer_1 = IndexedSourceMapConsumer;

var sourceMapConsumer = {
	SourceMapConsumer: SourceMapConsumer_1,
	BasicSourceMapConsumer: BasicSourceMapConsumer_1,
	IndexedSourceMapConsumer: IndexedSourceMapConsumer_1
};

var SourceMapConsumer$1 = sourceMapConsumer.SourceMapConsumer;

// tslint:disable:no-conditional-assignment
var ErrorMapper = /** @class */ (function () {
    function ErrorMapper() {
    }
    Object.defineProperty(ErrorMapper, "consumer", {
        get: function () {
            if (this._consumer == null) {
                this._consumer = new SourceMapConsumer$1(require("main.js.map"));
            }
            return this._consumer;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Generates a stack trace using a source map generate original symbol names.
     *
     * WARNING - EXTREMELY high CPU cost for first call after reset - >30 CPU! Use sparingly!
     * (Consecutive calls after a reset are more reasonable, ~0.1 CPU/ea)
     *
     * @param {Error | string} error The error or original stack trace
     * @returns {string} The source-mapped stack trace
     */
    ErrorMapper.sourceMappedStackTrace = function (error) {
        var stack = error instanceof Error ? error.stack : error;
        if (this.cache.hasOwnProperty(stack)) {
            return this.cache[stack];
        }
        var re = /^\s+at\s+(.+?\s+)?\(?([0-z._\-\\\/]+):(\d+):(\d+)\)?$/gm;
        var match;
        var outStack = error.toString();
        while (match = re.exec(stack)) {
            if (match[2] === "main") {
                var pos = this.consumer.originalPositionFor({
                    column: parseInt(match[4], 10),
                    line: parseInt(match[3], 10)
                });
                if (pos.line != null) {
                    if (pos.name) {
                        outStack += "\n    at " + pos.name + " (" + pos.source + ":" + pos.line + ":" + pos.column + ")";
                    }
                    else {
                        if (match[1]) {
                            // no original source file name known - use file name from given trace
                            outStack += "\n    at " + match[1] + " (" + pos.source + ":" + pos.line + ":" + pos.column + ")";
                        }
                        else {
                            // no original source file name known or in given trace - omit name
                            outStack += "\n    at " + pos.source + ":" + pos.line + ":" + pos.column;
                        }
                    }
                }
                else {
                    // no known position
                    break;
                }
            }
            else {
                // no more parseable lines
                break;
            }
        }
        this.cache[stack] = outStack;
        return outStack;
    };
    ErrorMapper.wrapLoop = function (loop) {
        var _this = this;
        return function () {
            try {
                loop();
            }
            catch (e) {
                if (e instanceof Error) {
                    if ("sim" in Game.rooms) {
                        var message = "Source maps don't work in the simulator - displaying original error";
                        console.log("<span style='color:red'>" + message + "<br>" + _.escape(e.stack) + "</span>");
                    }
                    else {
                        console.log("<span style='color:red'>" + _.escape(_this.sourceMappedStackTrace(e)) + "</span>");
                    }
                }
                else {
                    // can't handle it
                    throw e;
                }
            }
        };
    };
    // Cache previously mapped traces to improve performance
    ErrorMapper.cache = {};
    return ErrorMapper;
}());

var MemoryVersion = 0;
function m() {
    return Memory;
}
function initRoomMemory(roomName) {
    var room = Game.rooms[roomName];
    var rm = m().rooms[room.name];
    rm.harvestLocations = [];
    rm.test = [];
    rm.activeWorkerTaskCount = 0;
    rm.activeStructureRequestCount = 0;
    rm.activeWorkerRequests = {};
    rm.pendingWorkerRequests = [];
    //rm.activeStructureRequests = {};
    //rm.pendingStructureRequests = []
    rm.smartStructures = [];
}
function cleanupCreeps() {
    for (var name_1 in Memory.creeps) {
        if (!Game.creeps[name_1]) {
            console.log("Clearing dead creeps from memory.");
            for (var roomName in Game.rooms) {
                var room = Game.rooms[roomName];
                var roomMemory = room.memory;
                var sites = roomMemory.harvestLocations;
                for (var id in sites) {
                    var site = sites[id];
                    if (site.assignedTo == name_1) {
                        console.log("unassiging harvest spot for " + name_1 + " source: " + site.sourceID);
                        site.assignedTo = null;
                    }
                }
            }
            delete Memory.creeps[name_1];
        }
    }
}

function findSpawns(roomName, onlyNonSpawning) {
    if (onlyNonSpawning === void 0) { onlyNonSpawning = true; }
    var room = Game.rooms[roomName];
    return room.find(FIND_MY_STRUCTURES, {
        filter: function (structure) {
            if (structure.structureType == STRUCTURE_SPAWN) {
                var spawner = structure;
                m().spawns[spawner.id] = spawner;
                return onlyNonSpawning ? spawner.spawning === null : true;
            }
            return false;
        }
    });
}
function findIdleCreeps(roomName, role) {
    if (role === void 0) { role = 1 /* ROLE_ALL */; }
    return Game.rooms[roomName].find(FIND_MY_CREEPS, {
        filter: function (creep) {
            var memory = creep.memory;
            return memory.idle && (memory.role == role || role == 1 /* ROLE_ALL */);
        }
    });
}
function findClosestContainer(roomName, targetID, fullOK, emptyOK) {
    var target = Game.getObjectById(targetID);
    if (target == null) {
        console.log("container target was null.");
        return;
    }
    var roomContainers = findAllContainers(roomName)
        .sort(function (a, b) { return a.pos.getRangeTo(target) - b.pos.getRangeTo(target); });
    for (var id in roomContainers) {
        var container = roomContainers[id];
        if (container == null)
            continue;
        if (!fullOK && container.store.energy == container.storeCapacity)
            continue; //has room
        if (!emptyOK && container.store.energy == 0)
            continue; //can't be empty
        return container;
    }
    return undefined;
}
function creepIDsByRole(roomName, role) {
    var room = Game.rooms[roomName];
    var creeps = room.find(FIND_MY_CREEPS);
    var found = [];
    for (var key in creeps) {
        if (creeps.hasOwnProperty(key)) {
            var creep = creeps[key];
            var mem = creep.memory;
            if (mem.role == role || role == undefined)
                found.push(creep.id);
        }
    }
    return found;
}
function creepNamesByRole(roomName, role) {
    var room = Game.rooms[roomName];
    var creeps = room.find(FIND_MY_CREEPS);
    var found = [];
    for (var key in creeps) {
        if (creeps.hasOwnProperty(key)) {
            var creep = creeps[key];
            var mem = creep.memory;
            if (mem.role == role || role == undefined)
                found.push(creep.name);
        }
    }
    return found;
}
function creepCount(roomName, role) {
    var creeps = Game.rooms[roomName].find(FIND_MY_CREEPS);
    if (role == undefined)
        return creeps.length;
    else {
        return creepIDsByRole(roomName, role).length;
    }
}
function roomSources(roomName) {
    return Game.rooms[roomName].find(FIND_SOURCES);
}
function sourceCount(roomName) {
    return roomSources(roomName).length;
}
function findAllContainers(roomName) {
    return Game.rooms[roomName].find(FIND_STRUCTURES).filter(function (i) {
        return i.structureType == STRUCTURE_CONTAINER;
    });
}
function getRestockables(roomName) {
    var room = Game.rooms[roomName];
    return room.find(FIND_STRUCTURES, {
        filter: function (structure) {
            return (structure.structureType == STRUCTURE_EXTENSION
                || structure.structureType == STRUCTURE_SPAWN)
                && structure.energy < structure.energyCapacity;
        }
    });
}
function getRole(creepName) {
    if (creepName.search(getRoleString(2 /* ROLE_MINER */)) != -1)
        return 2 /* ROLE_MINER */;
    if (creepName.search(getRoleString(3 /* ROLE_WORKER */)) != -1)
        return 3 /* ROLE_WORKER */;
    if (creepName.search(getRoleString(4 /* ROLE_UPGRADER */)) != -1)
        return 4 /* ROLE_UPGRADER */;
    return 0 /* ROLE_UNASSIGNED */;
}
function getRoleString(job) {
    switch (job) {
        // case CreepRoles.ROLE_BUILDER: return "ROLE_BUILDER";
        case 2 /* ROLE_MINER */: return "ROLE_MINER";
        // case CreepRoles.ROLE_MINEHAULER: return "ROLE_MINEHAULER";
        // case CreepRoles.ROLE_HEALER: return "ROLE_HEALER";
        // case CreepRoles.ROLE_FIGHTER: return "ROLE_FIGHTER";
        // case CreepRoles.ROLE_RANGER: return "ROLE_RANGER";
        // case CreepRoles.ROLE_CLAIMER: return "ROLE_CLAIMER";
        // case CreepRoles.ROLE_REMOTEMINER: return "ROLE_REMOTEMINER";
        // case CreepRoles.ROLE_REMOTEMINEHAULER: return "ROLE_REMOTEMINEHAULER";
        // case CreepRoles.ROLE_CUSTOMCONTROL: return "ROLE_CUSTOMCONTROL";
        case 4 /* ROLE_UPGRADER */: return "ROLE_UPGRADER";
        case 3 /* ROLE_WORKER */: return "ROLE_WORKER";
        case 0 /* ROLE_UNASSIGNED */: return "ROLE_UNASSIGNED";
        case 1 /* ROLE_ALL */: return "ROLE_ALL";
        default: return "unknown role";
    }
}
var CantBuildReasons;
(function (CantBuildReasons) {
    CantBuildReasons[CantBuildReasons["NotTheOwner"] = -1] = "NotTheOwner";
    CantBuildReasons[CantBuildReasons["NameAlreadyExists"] = -3] = "NameAlreadyExists";
    CantBuildReasons[CantBuildReasons["BuildingBusy"] = -4] = "BuildingBusy";
    CantBuildReasons[CantBuildReasons["NotEnoughEnergy"] = -6] = "NotEnoughEnergy";
    CantBuildReasons[CantBuildReasons["InvalidArguments"] = -10] = "InvalidArguments";
    CantBuildReasons[CantBuildReasons["RCLNotHighEnough"] = -14] = "RCLNotHighEnough";
})(CantBuildReasons || (CantBuildReasons = {}));
// export function sendCreepsHome(roomName: string, creeps: Creep[]): void
// {
// 	let spawn = findStructureSpawns(roomName)[0];
// 	console.log(`There are ${creeps.length} idle creeps.`)
// 	for (const creep of creeps)
// 	{
// 		let mem = creep.memory as CreepMemory;
// 		if (mem.idle) creep.moveTo(spawn);
// 	}
// }

var CreepManager = /** @class */ (function () {
    function CreepManager() {
    }
    CreepManager.trySpawnCreep = function (spawn, bodyParts, role) {
        var spawned = false;
        if (!spawned) {
            if (this.spawnCreep(spawn, bodyParts, role) === OK) {
                spawned = true;
            }
        }
        return spawned;
    };
    CreepManager.spawnCreep = function (spawn, bodyParts, role) {
        var uuid = Memory.uuid;
        var creepName = spawn.room.name + "-" + getRoleString(role) + "-" + (uuid + 1);
        var status = spawn.spawnCreep(bodyParts, creepName, { dryRun: true });
        status = _.isString(status) ? OK : status;
        while (status == -3) {
            uuid++;
            creepName = spawn.room.name + "-" + getRoleString(role) + "-" + (uuid + 1);
            status = spawn.spawnCreep(bodyParts, creepName, { dryRun: true });
            status = _.isString(status) ? OK : status;
        }
        if (status === OK && spawn.spawning == null) {
            Memory.uuid = uuid + 1;
            var creepName_1 = spawn.room.name + "-" + getRoleString(role) + "-" + uuid;
            var memory = {
                spawnID: spawn.id,
                idle: true,
                currentTask: "",
                alive: true,
                role: role
            };
            console.log("Started creating new creep: " + creepName_1);
            status = spawn.spawnCreep(bodyParts, creepName_1, { memory: memory });
            return _.isString(status) ? OK : status;
        }
        else {
            //console.log("Coudldn't spawn: " + Utils.errorToString(status))
            // if (Config.ENABLE_DEBUG_MODE && status !== ERR_NOT_ENOUGH_ENERGY)
            // {
            // 	log.info("Failed creating new creep: " + status);
            // }
            return status;
        }
    };
    return CreepManager;
}());

var TaskStatus;
(function (TaskStatus) {
    TaskStatus[TaskStatus["PENDING"] = 0] = "PENDING";
    TaskStatus[TaskStatus["INIT"] = 1] = "INIT";
    TaskStatus[TaskStatus["PREPARE"] = 2] = "PREPARE";
    TaskStatus[TaskStatus["PRE_RUN"] = 3] = "PRE_RUN";
    TaskStatus[TaskStatus["IN_PROGRESS"] = 4] = "IN_PROGRESS";
    TaskStatus[TaskStatus["POST_RUN"] = 5] = "POST_RUN";
    TaskStatus[TaskStatus["FINISHED"] = 6] = "FINISHED";
})(TaskStatus || (TaskStatus = {}));
var Task = /** @class */ (function () {
    function Task(taskInfo) {
        this.request = taskInfo;
    }
    Task.prototype.run = function () {
        //console.log(`RUN: ${this.request.name} + ${this.request.assignedTo} + ${Task.getStatus(this.request.status)} `)
        if (Game.creeps[this.request.assignedTo] == undefined)
            console.log("creep was null during run - should handle.");
        var oldStatus = this.request.status;
        switch (this.request.status) {
            // case TaskState.PENDING: this.pending();
            case TaskStatus.INIT:
                this.init();
                break;
            case TaskStatus.PREPARE:
                this.prepare();
                break;
            //case TaskStatus.PRE_RUN: this.p(); break;
            case TaskStatus.IN_PROGRESS:
                this.continue();
                break;
            case TaskStatus.FINISHED:
                this.finish();
                break;
            // case TaskState.POST_RUN: this.preRun();
        }
        if (this.request != null && oldStatus != this.request.status)
            this.run();
    };
    Task.getStatus = function (state) {
        if (state == TaskStatus.PENDING)
            return "PENDING";
        if (state == TaskStatus.INIT)
            return "INIT";
        if (state == TaskStatus.PREPARE)
            return "PREPARE";
        if (state == TaskStatus.PRE_RUN)
            return "PRE_RUN";
        if (state == TaskStatus.IN_PROGRESS)
            return "IN_PROGRESS";
        if (state == TaskStatus.POST_RUN)
            return "POST_RUN";
        if (state == TaskStatus.FINISHED)
            return "FINISHED";
        return state + " is unknown...";
    };
    return Task;
}());

var CreepTaskQueue = /** @class */ (function () {
    function CreepTaskQueue() {
    }
    CreepTaskQueue.addPendingRequest = function (request) {
        var totalCurrent = CreepTaskQueue.totalCount(request.roomName, request.name);
        if (totalCurrent < request.maxConcurrent) {
            var roomMem = Game.rooms[request.roomName].memory;
            roomMem.pendingWorkerRequests.push(request);
        }
    };
    CreepTaskQueue.startPendingRequest = function (creepName, roomName) {
        var roomMem = Game.rooms[roomName].memory;
        if (roomMem.pendingWorkerRequests.length == 0)
            return;
        var creep = Game.creeps[creepName];
        var mem = creep.memory;
        var validTasks = roomMem.pendingWorkerRequests.filter(function (r) { return r.requiredRole == mem.role; });
        if (validTasks.length == 0)
            return;
        var sortedValidTasks = _.sortByAll(validTasks, ['priority', function (t) { return creep.pos.getRangeTo(Game.getObjectById(validTasks[0].targetID)); }]);
        //let debug: string = ""
        //for (const key in sorted) {
        //  let task = sorted[key];
        //  if (task != undefined) debug += task.priority + ", "
        //}
        //console.log("Debug: " + debug);
        for (var key in sortedValidTasks) {
            if (sortedValidTasks.hasOwnProperty(key)) {
                var task = sortedValidTasks[key];
                var nextTask = _.find(roomMem.pendingWorkerRequests, task);
                if (nextTask != undefined) {
                    nextTask.assignedTo = creepName;
                    mem.idle = false;
                    mem.currentTask = nextTask.name;
                    roomMem.activeWorkerRequests[creepName] = nextTask;
                    _.remove(roomMem.pendingWorkerRequests, nextTask);
                    //console.log(JSON.stringify(nextTask))
                    nextTask.status = TaskStatus.INIT;
                    break;
                }
                else {
                    console.log("ARGH!!!.");
                }
            }
        }
    };
    CreepTaskQueue.allActive = function (roomName) {
        var roomMem = Game.rooms[roomName].memory;
        return roomMem.activeWorkerRequests;
    };
    CreepTaskQueue.totalCount = function (roomName, taskName) {
        if (taskName === void 0) { taskName = ""; }
        return CreepTaskQueue.activeCount(roomName, taskName)
            + CreepTaskQueue.pendingCount(roomName, taskName);
    };
    CreepTaskQueue.pendingCount = function (roomName, taskName) {
        if (taskName === void 0) { taskName = ""; }
        var roomMem = Game.rooms[roomName].memory;
        if (taskName == "") {
            return roomMem.pendingWorkerRequests.length;
        }
        else {
            var count = 0;
            var tasks = roomMem.pendingWorkerRequests;
            for (var id in tasks) {
                var task = tasks[id];
                if (task.name == taskName)
                    count++;
            }
            return count;
        }
    };
    CreepTaskQueue.activeCount = function (roomName, taskName) {
        if (taskName === void 0) { taskName = ""; }
        var roomMem = Game.rooms[roomName].memory;
        var count = 0;
        for (var i in roomMem.activeWorkerRequests) {
            var request = roomMem.activeWorkerRequests[i];
            if (request.status == TaskStatus.PENDING)
                count++;
        }
        return count;
        //return Object.keys(roomMem.activeWorkerRequests).length;
    };
    return CreepTaskQueue;
}());

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var CreepTaskRequest = /** @class */ (function () {
    function CreepTaskRequest(roomName, wingDing, targetID) {
        if (targetID === void 0) { targetID = ""; }
        this.isCreepTask = true;
        this.assignedTo = "";
        this.targetID = targetID;
        this.roomName = roomName;
        this.wingDing = wingDing;
        this.status = TaskStatus.PENDING;
    }
    return CreepTaskRequest;
}());

var CreepTask = /** @class */ (function (_super) {
    __extends(CreepTask, _super);
    function CreepTask(request) {
        var _this = _super.call(this, request) || this;
        _this.request = request;
        _this.creep = Game.creeps[_this.request.assignedTo];
        if (_this.creep == undefined || _this.creep.memory == undefined) {
            //console.log("You cant create a task with an undefined creep.")
            _this.request.status == TaskStatus.FINISHED;
            return _this;
        }
        _this.creepMemory = _this.creep.memory;
        return _this;
    }
    CreepTask.prototype.init = function () {
        this.creep = Game.creeps[this.request.assignedTo];
        if (this.creep == undefined || this.creep.memory == undefined) {
            //console.log("You cant create a task with an undefined creep.")
            this.request.status == TaskStatus.FINISHED;
            return;
        }
    };
    CreepTask.prototype.prepare = function () {
        this.creep = Game.creeps[this.request.assignedTo];
        if (this.creep == undefined || this.creep.memory == undefined) {
            //console.log("during prep, creep was undefined - finishing task")
            this.request.status = TaskStatus.FINISHED;
        }
        else {
            this.creepMemory = this.creep.memory;
        }
    };
    CreepTask.prototype.continue = function () {
        this.creep = Game.creeps[this.request.assignedTo];
        if (this.creep == undefined || this.creep.memory == undefined) {
            //console.log("during continue, creep was undefined - finishing task")
            this.request.status = TaskStatus.FINISHED;
        }
        else {
            this.creepMemory = this.creep.memory;
            if (Game.time % 5 == 0)
                this.creep.say("" + this.request.wingDing);
        }
    };
    CreepTask.prototype.finish = function () {
        var creep = Game.creeps[this.request.assignedTo];
        if (creep != undefined && creep.memory != undefined) {
            var creepMemory = creep.memory;
            creepMemory.idle = true;
            creepMemory.currentTask = "";
            creep.say("✔");
        }
    };
    CreepTask.prototype.collectFromDroppedEnergy = function (roomName) {
        var room = Game.rooms[roomName];
        if (this.creep.carry.energy == this.creep.carryCapacity)
            return false;
        var resources = room.find(FIND_DROPPED_RESOURCES);
        if (resources.length > 0) {
            for (var key in resources) {
                if (!resources.hasOwnProperty(key))
                    continue;
                var resource = resources[key];
                if (resource.resourceType != RESOURCE_ENERGY)
                    continue;
                var result = this.creep.pickup(resource);
                if (result == ERR_NOT_IN_RANGE) {
                    this.creep.moveTo(resource);
                }
                else if (result == OK)
                    return true;
            }
        }
        return false;
    };
    CreepTask.prototype.collectFromTombstone = function (roomName) {
        var room = Game.rooms[roomName];
        if (this.creep.carry.energy == this.creep.carryCapacity)
            return;
        var tombstones = room.find(FIND_TOMBSTONES);
        if (tombstones.length > 0) {
            for (var key in tombstones) {
                if (!tombstones.hasOwnProperty(key))
                    continue;
                var tombstone = tombstones[key];
                if (tombstone.store.energy == 0)
                    continue;
                var result = this.creep.withdraw(tombstone, RESOURCE_ENERGY);
                if (result == ERR_NOT_IN_RANGE) {
                    this.creep.moveTo(tombstone);
                }
                else if (result == OK)
                    return;
            }
        }
    };
    CreepTask.prototype.collectFromSource = function (roomName) {
        var roomMem = Game.rooms[roomName].memory;
        var sourceID = _.first(roomMem.harvestLocations).sourceID;
        var source = Game.getObjectById(sourceID);
        var result = this.creep.harvest(source);
        if (result == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(source);
        }
    };
    return CreepTask;
}(Task));

var MineRequest = /** @class */ (function (_super) {
    __extends(MineRequest, _super);
    function MineRequest(roomName, sourceID) {
        var _this = _super.call(this, roomName, "\uD83D\uDCB2", sourceID) || this;
        _this.priority = 1;
        _this.requiredRole = 2 /* ROLE_MINER */;
        _this.name = "Mine";
        var roomMem = Game.rooms[roomName].memory;
        //console.log("source id in mine req ctor: " + sourceID)
        _this.source = _.find(roomMem.harvestLocations, function (h) { return h.sourceID == sourceID; });
        if (_this.source == undefined)
            console.log("You cant init a mine request with an undefined source.");
        //console.log("after finding source: " + this.source.sourceID)
        _this.id = _.random(0, 10);
        _this.maxConcurrent = sourceCount(_this.roomName);
        return _this;
    }
    return MineRequest;
}(CreepTaskRequest));
var Mine = /** @class */ (function (_super) {
    __extends(Mine, _super);
    function Mine(taskInfo) {
        return _super.call(this, taskInfo) || this;
    }
    Mine.prototype.init = function () {
        _super.prototype.init.call(this);
        //console.log("mine init assigned to " + this.request.assignedTo)
        var request = this.request;
        var source = request.source;
        source.assignedTo = request.assignedTo;
        this.request.status = TaskStatus.PREPARE;
    };
    Mine.prototype.prepare = function () {
        _super.prototype.prepare.call(this);
        if (this.request.status == TaskStatus.FINISHED)
            return;
        this.request.status = TaskStatus.IN_PROGRESS;
    };
    Mine.prototype.continue = function () {
        _super.prototype.continue.call(this);
        if (this.request.status == TaskStatus.FINISHED)
            return;
        if (this.creep.carry.energy < this.creep.carryCapacity)
            this.harvest();
        else
            this.deliver();
    };
    Mine.addRequests = function (roomName) {
        var room = Game.rooms[roomName];
        var mem = room.memory;
        var unassigned = _.filter(mem.harvestLocations, function (h) { return h.assignedTo === null; });
        if (unassigned.length === 0)
            return;
        for (var key in unassigned) {
            var smartSource = unassigned[key];
            //console.log("about to add source for this id: " + smartSource.sourceID)
            var request = new MineRequest(roomName, smartSource.sourceID);
            CreepTaskQueue.addPendingRequest(request);
        }
    };
    Mine.prototype.harvest = function () {
        var creep = Game.creeps[this.request.assignedTo];
        var source = Game.getObjectById(this.request.targetID);
        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
            creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
    };
    Mine.prototype.deliver = function () {
        var creep = Game.creeps[this.request.assignedTo];
        var container = findClosestContainer(this.request.roomName, creep.id, true, true);
        if (container == undefined) {
            creep.drop(RESOURCE_ENERGY);
            return;
        }
        if (container.store.energy == container.storeCapacity)
            return;
        if (creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(container, { visualizePathStyle: { stroke: '#ffffff' } });
        }
    };
    return Mine;
}(CreepTask));

var PickUpEnergyRequest = /** @class */ (function (_super) {
    __extends(PickUpEnergyRequest, _super);
    function PickUpEnergyRequest(roomName, resourceID, resourceType) {
        var _this = _super.call(this, roomName, "😍", resourceID) || this;
        _this.priority = 0;
        _this.name = "PickupEnergy";
        _this.requiredRole = 3 /* ROLE_WORKER */;
        _this.maxConcurrent = 2;
        _this.resourceType = resourceType;
        return _this;
    }
    return PickUpEnergyRequest;
}(CreepTaskRequest));
var PickupEnergy = /** @class */ (function (_super) {
    __extends(PickupEnergy, _super);
    //private deliver() {
    //  let creep = Game.creeps[this.request.assignedTo];
    //  let container = utils.findClosestContainer(this.request.roomName, creep.id, false, true) as StructureContainer;
    //  if (container == undefined) throw "Error!";
    //  if (container.store.energy == container.storeCapacity) return;
    //  if (creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
    //    creep.moveTo(container, { visualizePathStyle: { stroke: '#ffffff' } });
    //  }
    //}
    function PickupEnergy(taskInfo) {
        return _super.call(this, taskInfo) || this;
    }
    PickupEnergy.prototype.init = function () {
        _super.prototype.init.call(this);
        //console.log("mine init assigned to " + this.request.assignedTo)
        this.request.status = TaskStatus.PREPARE;
    };
    PickupEnergy.prototype.prepare = function () {
        _super.prototype.prepare.call(this);
        if (this.request.status == TaskStatus.FINISHED)
            return;
        this.request.status = TaskStatus.IN_PROGRESS;
    };
    PickupEnergy.prototype.continue = function () {
        var requestInfo = this.request;
        var resource = Game.getObjectById(this.request.targetID);
        if (resource == null) {
            this.request.status = TaskStatus.FINISHED;
            return;
        }
        if (requestInfo.resourceType == "tombstone") {
            var tombstone = resource;
            if (this.creep.withdraw(tombstone, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(tombstone);
            }
            else
                this.request.status = TaskStatus.FINISHED;
        }
        else if (requestInfo.resourceType == "resource") {
            var droppedResource = resource;
            if (this.creep.pickup(droppedResource) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(droppedResource);
            }
            else
                this.request.status = TaskStatus.FINISHED;
        }
    };
    PickupEnergy.addRequests = function (roomName) {
        var room = Game.rooms[roomName];
        var resources = room.find(FIND_DROPPED_RESOURCES);
        var tombstones = room.find(FIND_TOMBSTONES);
        var workers = creepNamesByRole(roomName, 3 /* ROLE_WORKER */).filter(function (name) {
            var worker = Game.creeps[name];
            return worker.carry.energy < worker.carryCapacity;
        });
        if (workers.length == 0)
            return;
        if (resources.length > 0) {
            //console.log("found " + resources.length + " dropped resources")
            for (var key in resources) {
                if (!resources.hasOwnProperty(key))
                    continue;
                var resource = resources[key];
                if (resource.resourceType != RESOURCE_ENERGY)
                    continue;
                var droppedReq = new PickUpEnergyRequest(roomName, resource.id, "resource");
                CreepTaskQueue.addPendingRequest(droppedReq);
            }
        }
        if (tombstones.length > 0) {
            for (var key in tombstones) {
                if (!tombstones.hasOwnProperty(key))
                    continue;
                var tombstone = tombstones[key];
                if (tombstone.store.energy == 0)
                    continue;
                console.log("found " + resources.length + " tombstones with energy");
                var ts = new PickUpEnergyRequest(roomName, tombstone.id, "resource");
                if (CreepTaskQueue.totalCount(roomName, ts.name) < ts.maxConcurrent) {
                    CreepTaskQueue.addPendingRequest(ts);
                }
            }
        }
    };
    return PickupEnergy;
}(CreepTask));

var RestockRequest = /** @class */ (function (_super) {
    __extends(RestockRequest, _super);
    function RestockRequest(roomName, restockID) {
        var _this = _super.call(this, roomName, "\uD83D\uDED2", restockID) || this;
        _this.priority = 1;
        _this.name = "Restock";
        _this.requiredRole = 3 /* ROLE_WORKER */;
        _this.maxConcurrent = 3;
        return _this;
    }
    return RestockRequest;
}(CreepTaskRequest));
var Restock = /** @class */ (function (_super) {
    __extends(Restock, _super);
    function Restock(taskInfo) {
        var _this = _super.call(this, taskInfo) || this;
        _this.sources = [];
        return _this;
    }
    Restock.prototype.init = function () {
        _super.prototype.init.call(this);
        var restock = this.request;
        //console.log("status after init" + Task.getStatus(this.request.status))
        this.request.status = TaskStatus.PREPARE;
    };
    Restock.prototype.prepare = function () {
        _super.prototype.prepare.call(this);
        if (this.request.status == TaskStatus.FINISHED)
            return;
        var restockInfo = this.request;
        var room = Game.rooms[this.request.roomName];
        var roomMem = room.memory;
        //this.collectFromContainer(this.request.roomName, creep.id);
        //temp code...
        if (this.creep.carry.energy < this.creep.carryCapacity) {
            var resources = room.find(FIND_DROPPED_RESOURCES);
            if (resources.length > 0) {
                for (var key in resources) {
                    if (!resources.hasOwnProperty(key))
                        continue;
                    var resource = resources[key];
                    if (resource.resourceType != RESOURCE_ENERGY)
                        continue;
                    if (this.creep.pickup(resource) == ERR_NOT_IN_RANGE) {
                        this.creep.moveTo(resource);
                    }
                }
            }
            else {
                var sourceID = _.first(roomMem.harvestLocations).sourceID;
                var source = Game.getObjectById(sourceID);
                if (this.creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    this.creep.moveTo(source);
                }
            }
        }
        else {
            this.request.status = TaskStatus.IN_PROGRESS;
        }
    };
    Restock.prototype.continue = function () {
        _super.prototype.continue.call(this);
        if (this.request.status == TaskStatus.FINISHED)
            return;
        var creep = Game.creeps[this.request.assignedTo];
        var targets = creep.room.find(FIND_STRUCTURES, {
            filter: function (structure) {
                return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                    structure.energy < structure.energyCapacity;
            }
        }).sort(function (structureA, structureB) { return creep.pos.getRangeTo(structureA) - creep.pos.getRangeTo(structureB); });
        //console.log("restock targets: " + targets.length);
        if (targets.length == 0) {
            this.request.status = TaskStatus.FINISHED;
        }
        else {
            var result = creep.transfer(targets[0], RESOURCE_ENERGY);
            var target = targets[0];
            if (result == ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            }
            else if (result == OK) {
                this.request.status = TaskStatus.FINISHED;
            }
            else {
                //console.log(`${creep.name} couldn't restock: ${result}`)
                this.request.status = TaskStatus.FINISHED;
            }
        }
    };
    Restock.addRequests = function (roomName) {
        var restockables = getRestockables(roomName);
        //let workers = utils.creepNamesByRole(roomName, CreepRole.ROLE_WORKER).filter(name => {
        //  const worker = Game.creeps[name] as Creep;
        //  return worker.carry.energy > 0;
        //})
        //if (workers.length == 0) return;
        for (var targetID in restockables) {
            var restockable = restockables[targetID];
            var request = new RestockRequest(roomName, restockable.id);
            var existingTaskCount = CreepTaskQueue.totalCount(roomName, request.name);
            var maxConcurrentCount = request.maxConcurrent;
            if (existingTaskCount < maxConcurrentCount) {
                CreepTaskQueue.addPendingRequest(request);
            }
        }
    };
    return Restock;
}(CreepTask));

var BuildRequest = /** @class */ (function (_super) {
    __extends(BuildRequest, _super);
    function BuildRequest(roomName, siteID) {
        var _this = _super.call(this, roomName, "\uD83D\uDEA7", siteID) || this;
        _this.priority = 2;
        _this.requiredRole = 3 /* ROLE_WORKER */;
        _this.name = "Build";
        _this.maxConcurrent = 2;
        return _this;
    }
    return BuildRequest;
}(CreepTaskRequest));
var Build = /** @class */ (function (_super) {
    __extends(Build, _super);
    function Build(taskInfo) {
        return _super.call(this, taskInfo) || this;
    }
    Build.prototype.init = function () {
        _super.prototype.init.call(this);
        this.request.status = TaskStatus.PREPARE;
    };
    Build.prototype.prepare = function () {
        _super.prototype.prepare.call(this);
        if (this.request.status == TaskStatus.FINISHED)
            return;
        var room = Game.rooms[this.request.roomName];
        var roomMem = room.memory;
        if (this.creep.carry.energy < this.creep.carryCapacity) {
            this.collectFromDroppedEnergy(room.name);
            this.collectFromTombstone(room.name);
            this.collectFromSource(room.name);
            //let resources = room.find(FIND_DROPPED_RESOURCES) as Resource[];
            //if (resources.length > 0) {
            //  for (const key in resources) {
            //    if (!resources.hasOwnProperty(key)) continue;
            //    const resource = resources[key] as Resource;
            //    if (resource.resourceType != RESOURCE_ENERGY) continue;
            //    if (this.creep.pickup(resource) == ERR_NOT_IN_RANGE) {
            //      this.creep.moveTo(resource);
            //    }
            //  }
            //}
            //else {
            //  var sourceID = _.first(roomMem.harvestLocations).sourceID;
            //  var source = Game.getObjectById(sourceID) as Source
            //  if (this.creep.harvest(source) == ERR_NOT_IN_RANGE) {
            //    this.creep.moveTo(source);
            //  }
            //}
        }
        else
            this.request.status = TaskStatus.IN_PROGRESS;
    };
    Build.prototype.continue = function () {
        _super.prototype.continue.call(this);
        if (this.request.status == TaskStatus.FINISHED)
            return;
        var creep = Game.creeps[this.request.assignedTo];
        var info = this.request;
        var site = Game.getObjectById(info.targetID);
        if (site == null || site.progressTotal - site.progress == 0) {
            this.request.status = TaskStatus.FINISHED;
            return;
        }
        var result = creep.build(site);
        if (result == ERR_NOT_IN_RANGE) {
            creep.moveTo(site, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        else if (creep.carry.energy == 0) {
            this.request.status = TaskStatus.FINISHED;
        }
        //this caused huge errors!! BE CAREFUL ABOUT THIS...
        //else if(status !== undefined) {
        //  console.log(`${creep.name} couldn't build: ${status}`);
        //}
    };
    Build.addRequests = function (roomName) {
        var room = Game.rooms[roomName];
        var sites = room.find(FIND_CONSTRUCTION_SITES);
        //console.log("adding " + sites.length + " build site requests.")
        _.each(sites, function (site) {
            if (site.progressTotal > 0) {
                CreepTaskQueue.addPendingRequest(new BuildRequest(roomName, site.id));
            }
        });
    };
    return Build;
}(CreepTask));

var TaskManager = /** @class */ (function () {
    function TaskManager() {
    }
    TaskManager.runTask = function (task) {
        if (task.request.status == TaskStatus.FINISHED) {
            TaskManager.removeTask(task.request);
            return;
        }
        task.run();
    };
    TaskManager.removeTask = function (request) {
        var roomMem = Game.rooms[request.roomName].memory;
        delete roomMem.activeWorkerRequests[request.assignedTo];
    };
    TaskManager.continueActiveRequests = function (roomName) {
        var activeWorkerTasks = CreepTaskQueue.allActive(roomName);
        //console.log(Object.keys(activeWorkerTasks).length);
        _.each(activeWorkerTasks, function (request) {
            if (Game.creeps[request.assignedTo] === undefined) {
                request.status == TaskStatus.FINISHED;
            }
            if (request.status == TaskStatus.FINISHED) {
                TaskManager.removeTask(request);
                return;
            }
            if (request.name == "Mine")
                TaskManager.runTask(new Mine(request));
            else if (request.name == "PickupEnergy")
                TaskManager.runTask(new PickupEnergy(request));
            else if (request.name == "Restock")
                TaskManager.runTask(new Restock(request));
            else if (request.name == "Build")
                TaskManager.runTask(new Build(request));
            else {
                console.log("Reqiest" + request.name);
            }
        });
        //let activeStructureTasks = StructureTaskQueue.allActive(roomName);
        //for (let buildingID in activeStructureTasks)
        //{
        //	let structureTaskInfo = activeStructureTasks[buildingID];
        //	if (structureTaskInfo.assignedTo != buildingID) structureTaskInfo.assignedTo = buildingID;
        //	if (structureTaskInfo.name == "TowerRepair") (new TowerRepair(structureTaskInfo)).run();
        //	if (structureTaskInfo.name == "TowerAttack") (new TowerAttack(structureTaskInfo)).run();
        //}
    };
    TaskManager.addBuildingTasks = function (roomName) {
        //TowerAttack.addTask(roomName);
        //TowerRepair.addTask(roomName);
        //console.log("finished building tasks")
    };
    TaskManager.addPendingRequests = function (roomName) {
        PickupEnergy.addRequests(roomName);
        Restock.addRequests(roomName);
        Mine.addRequests(roomName);
        //TransferEnergy.addRequests(roomName);
        //FillTower.addRequests(roomName);
        Build.addRequests(roomName);
        //Upgrade.addRequests(roomName);
    };
    TaskManager.Run = function (roomName) {
        //this.addBuildingTasks(roomName);
        this.continueActiveRequests(roomName);
        this.addPendingRequests(roomName);
        this.assignPendingRequests(roomName);
    };
    TaskManager.assignPendingRequests = function (roomName) {
        var idleCreeps = findIdleCreeps(roomName);
        for (var id in idleCreeps) {
            var creep = idleCreeps[id];
            if (creep != undefined) {
                var mem = creep.memory;
                //if (mem.role == CreepRole.ROLE_MINER) {
                //  console.log("found a miner: " + creep.name);
                //  console.log("idle: " + mem.idle);
                //}
                if (mem.idle) {
                    CreepTaskQueue.startPendingRequest(creep.name, roomName);
                }
            }
        }
        //let idleStructures = utils.findIdleSmartStructures(roomName);
        //for (let id in idleStructures) {
        //  let structure = idleStructures[id] as SmartStructure;
        //  if (structure != undefined) {
        //    let memory = structure.memory as StructureMemory;
        //    if (memory.idle) {
        //      StructureTaskQueue.startTask(structure.id, roomName);
        //    }
        //  }
        //}
        // let stillIdleCreeps = utils.findIdleCreeps(roomName);
        // for (let id in stillIdleCreeps)
        // {
        // 	let creep = stillIdleCreeps[id];
        // 	let m = creep.memory as CreepMemory
        // 	creep.moveTo(Game.getObjectById(m.spawnID) as StructureSpawn)
        // }
    };
    return TaskManager;
}());

var creeps;
var creepCount$1 = 0;
var RoomManager = /** @class */ (function () {
    function RoomManager() {
        this.creeps = [];
        this.creepCount = 0;
        this.minerCount = 0;
    }
    //taskManager: TaskManager = new TaskManager();
    RoomManager.prototype.Run = function (roomName) {
        RoomManager.loadHarvestingSpots(roomName);
        this.loadCreeps(roomName);
        this.loadStructures(roomName);
        this.spawnMissingMiners(roomName);
        this.spawnMissingWorkers(roomName);
        //this.spawnMissingUpgraders(roomName);
        //TaskManager.processRoomTasks(roomName);
        TaskManager.Run(roomName);
    };
    RoomManager.prototype.loadCreeps = function (roomName) {
        var room = Game.rooms[roomName];
        creeps = room.find(FIND_MY_CREEPS);
        var spawn = room.find(FIND_MY_SPAWNS)[0];
        creepCount$1 = creeps.length;
        for (var id in creeps) {
            var creep = creeps[id];
            var mem = creep.memory;
            if (mem.alive === undefined || mem.alive == false) {
                var memory = {
                    spawnID: spawn.id,
                    idle: true,
                    alive: true,
                    role: getRole(creep.name),
                    currentTask: "",
                };
                creep.memory = memory;
            }
        }
    };
    RoomManager.prototype.loadStructures = function (roomName) {
        var room = Game.rooms[roomName];
        var memory = room.memory;
        if (memory.smartStructures.length == 0) {
            memory.smartStructures = [];
            var structures = room.find(FIND_STRUCTURES);
            var smartStructures = _.filter(structures, function (structure) {
                return (structure.structureType == "tower");
            });
            for (var id in smartStructures) {
                var structure = smartStructures[id];
                var newStructureMemory = {
                    idle: true,
                    alive: true,
                    currentTask: ""
                };
                var smartStructure = {
                    id: structure.id,
                    memory: newStructureMemory
                };
                memory.smartStructures.push(smartStructure);
            }
        }
    };
    RoomManager.prototype.spawnMissingWorkers = function (roomID) {
        var _this = this;
        var miners = creepCount(roomID, 2 /* ROLE_MINER */);
        var currentWorkerCount = creepCount(roomID, 3 /* ROLE_WORKER */);
        if (miners < RoomManager.minimumMinerCount - 1 && currentWorkerCount > 0) {
            console.log("skipping workers for now.");
            return;
        }
        //console.log("miners: " + miners + " , workers: " + currentWorkerCount)
        var spawns = findSpawns(roomID);
        // let currentWorkers = creeps.filter(c =>
        // {
        // 	let mem = c.memory as CreepMemory;
        // 	return mem.role == CreepRole.ROLE_WORKER;
        // });
        var workersNeeded = RoomManager.maxWorkersPerRoom - currentWorkerCount;
        if (workersNeeded === 0) {
            //console.log("no workers needed.")
            return;
        }
        var workersSpawned = 0;
        _.each(spawns, function (spawn) {
            if (workersSpawned < workersNeeded) {
                var spawner = spawn;
                if (CreepManager.trySpawnCreep(spawner, _this.getWorkerBodyParts(roomID), 3 /* ROLE_WORKER */)) {
                    workersSpawned++;
                }
            }
        });
    };
    RoomManager.prototype.spawnMissingUpgraders = function (roomID) {
        var _this = this;
        var workers = creepCount(roomID, 3 /* ROLE_WORKER */);
        if (workers < RoomManager.minimumWorkerCount + 1)
            return;
        var miners = creepCount(roomID, 2 /* ROLE_MINER */);
        if (miners < RoomManager.minimumMinerCount)
            return;
        var spawns = findSpawns(roomID);
        var currentCount = creepCount(roomID, 4 /* ROLE_UPGRADER */);
        // let currentWorkers = creeps.filter(c =>
        // {
        // 	let mem = c.memory as CreepMemory;
        // 	return mem.role == CreepRole.ROLE_WORKER;
        // });
        var needed = RoomManager.maxUpgradersPerRoom - currentCount;
        if (needed === 0)
            return;
        var spawned = 0;
        _.each(spawns, function (spawn) {
            if (spawned < needed) {
                var spawner = spawn;
                if (CreepManager.trySpawnCreep(spawner, _this.getUpgraderBodyParts(roomID), 4 /* ROLE_UPGRADER */)) {
                    spawned++;
                }
            }
        });
    };
    RoomManager.prototype.spawnMissingMiners = function (roomName) {
        var _this = this;
        //console.log("spawning miners")
        var spawns = findSpawns(roomName);
        var currentMiners = creeps.filter(function (c) {
            var mem = c.memory;
            return mem.role == 2 /* ROLE_MINER */;
        });
        var room = Game.rooms[roomName];
        var sources = room.find(FIND_SOURCES);
        this.minerCount = sources.length;
        var minersNeeded = this.minerCount - currentMiners.length;
        // console.log("Miners needed: " + minersNeeded)
        if (minersNeeded === 0)
            return;
        var minersSpawned = 0;
        _.each(spawns, function (spawn) {
            if (minersSpawned < minersNeeded) {
                var spawner = spawn;
                //console.log("spawning miner!")
                if (CreepManager.trySpawnCreep(spawner, _this.getMinerBodyParts(roomName, _this.getRoomEnergyLevel(roomName)), 2 /* ROLE_MINER */)) {
                    minersSpawned++;
                }
            }
        });
    };
    RoomManager.prototype.getWorkerBodyParts = function (roomID) {
        var energyLevel = this.getRoomEnergyLevel(roomID);
        var room = Game.rooms[roomID];
        var currentEnergy = room.energyAvailable;
        //if we run out of creeps for any reason, this will keep us respawning automatically.
        if (creeps.length < 3 && currentEnergy < 800)
            energyLevel = 1;
        //console.log("Room energy level: " + energyLevel)
        switch (energyLevel) {
            case 1: return [WORK, MOVE, MOVE, CARRY];
            //case 2: return [WORK, WORK, MOVE, MOVE, CARRY, CARRY];
            case 2: return [WORK, WORK, MOVE, MOVE, CARRY, CARRY];
            //case 3: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY]
            case 3: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY];
            default: return [WORK, MOVE, MOVE, CARRY];
        }
    };
    RoomManager.prototype.getUpgraderBodyParts = function (roomID) {
        var energyLevel = this.getRoomEnergyLevel(roomID);
        var room = Game.rooms[roomID];
        var currentEnergy = room.energyAvailable;
        //if we run out of creeps for any reason, this will keep us respawning automatically.
        if (creeps.length < 3 && currentEnergy < 800)
            energyLevel = 1;
        //console.log("Room energy level: " + energyLevel)
        switch (energyLevel) {
            case 1: return [WORK, WORK, MOVE, CARRY];
            //case 2: return [WORK, WORK, MOVE, MOVE, CARRY, CARRY];
            case 2: return [WORK, WORK, MOVE, MOVE, CARRY, CARRY];
            //case 3: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY]
            case 3: return [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY];
            default: return [WORK, MOVE, MOVE, CARRY];
        }
    };
    RoomManager.prototype.getMinerBodyParts = function (roomID, energyLevel) {
        //let energyLevel = this.getRoomEnergyLevel(roomID);
        var room = Game.rooms[roomID];
        var currentEnergy = room.energyAvailable;
        //if we run out of creeps for any reason, this will keep us respawning automatically.
        if (creeps.length < 3 && currentEnergy < 800)
            energyLevel = 1;
        //console.log("Room energy level: " + energyLevel)
        switch (energyLevel) {
            case 1: return [WORK, WORK, MOVE, CARRY];
            //case 2: return [WORK, WORK, MOVE, MOVE, CARRY, CARRY];
            case 2: return [WORK, WORK, WORK, WORK, MOVE, CARRY];
            //case 3: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY]
            case 3: return [WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY];
            default: return [WORK, MOVE, MOVE, CARRY];
        }
    };
    RoomManager.prototype.getRoomEnergyLevel = function (roomID) {
        var room = Game.rooms[roomID];
        var cap = room.energyCapacityAvailable;
        if (cap < 500)
            return 1;
        else if (cap <= 800)
            return 2;
        else
            return 3;
    };
    RoomManager.loadHarvestingSpots = function (roomName) {
        var room = Game.rooms[roomName];
        var roomMemory = room.memory;
        if (roomMemory.harvestLocations.length > 0)
            return;
        var sources = room.find(FIND_SOURCES);
        var spots = [];
        for (var sourceID in sources) {
            var source = sources[sourceID];
            var spot = {
                sourceID: source.id,
                roomName: roomName,
                assignedTo: null,
            };
            spots.push(spot);
            roomMemory.harvestLocations = spots;
        }
        // 	let sourcePosition = source.pos as RoomPosition;
        // 	let right = room.getPositionAt(sourcePosition.x + 1, sourcePosition.y);
        // 	if (right != null) possibles.push(new HarvestSpot(source.id, right));
        // 	let left = room.getPositionAt(sourcePosition.x - 1, sourcePosition.y)
        // 	if (left != null) possibles.push(new HarvestSpot(source.id, left));
        // 	let top = room.getPositionAt(sourcePosition.x, sourcePosition.y - 1)
        // 	if (top != null) possibles.push(new HarvestSpot(source.id, top));
        // 	let bot = room.getPositionAt(sourcePosition.x, sourcePosition.y + 1)
        // 	if (bot != null) possibles.push(new HarvestSpot(source.id, bot));
        // 	let tr = room.getPositionAt(sourcePosition.x + 1, sourcePosition.y - 1)
        // 	if (tr != null) possibles.push(new HarvestSpot(source.id, tr));
        // 	let tl = room.getPositionAt(sourcePosition.x - 1, sourcePosition.y - 1)
        // 	if (tl != null) possibles.push(new HarvestSpot(source.id, tl));
        // 	let br = room.getPositionAt(sourcePosition.x + 1, sourcePosition.y + 1)
        // 	if (br != null) possibles.push(new HarvestSpot(source.id, br));
        // 	let bl = room.getPositionAt(sourcePosition.x - 1, sourcePosition.y + 1)
        // 	if (bl != null) possibles.push(new HarvestSpot(source.id, bl));
        // }
        // for (const id in possibles)
        // {
        // 	let possible = possibles[id];
        // 	if (possible.pos !== null)
        // 	{
        // 		const found: string = possible.pos.lookFor(LOOK_TERRAIN) as any;
        // 		if (found != "wall")
        // 		{
        // 			spots.push(possible);
        // 		}
        // 	}
        // }
    };
    RoomManager.GetClosestOrAssignedHarvestLocation = function (roomName, creepID, locationID) {
        if (locationID === void 0) { locationID = ""; }
        var creep = Game.getObjectById(creepID);
        var room = Game.rooms[roomName];
        var roomMemory = room.memory;
        if (locationID == "") {
            locationID = creep.id;
        }
        var locObj = Game.getObjectById(locationID);
        if (roomMemory.harvestLocations == []) {
            console.log("this should never happen...");
            this.loadHarvestingSpots(roomName);
        }
        var harvestingSpots = roomMemory.harvestLocations.filter(function (spot) {
            var source = Game.getObjectById(spot.sourceID);
            return source.energy > 0;
        });
        var assignedSpot = harvestingSpots.filter(function (spot) {
            return spot.assignedTo == creep.name;
        })[0];
        if (assignedSpot !== undefined)
            return assignedSpot;
        else {
            var openSpots = harvestingSpots.filter(function (spot) {
                return spot.assignedTo == null;
            });
            _.sortBy(openSpots, function (spot) {
                var sourceID = spot.sourceID;
                var source = Game.getObjectById(sourceID);
                return locObj.pos.getRangeTo(source);
            }).reverse();
            if (openSpots == undefined)
                return undefined;
            var firstOpen = openSpots[0];
            if (firstOpen == undefined)
                return undefined;
            firstOpen.assignedTo = creep.name;
            return firstOpen;
        }
    };
    RoomManager.minimumWorkerCount = 1;
    RoomManager.minimumMinerCount = 2;
    RoomManager.maxWorkersPerRoom = 2;
    RoomManager.maxUpgradersPerRoom = 5;
    return RoomManager;
}());

var rm = new RoomManager();
var initialized = false;
function memoryInit() {
    console.log("Initializing Game");
    delete Memory.flags;
    delete Memory.spawns;
    delete Memory.creeps;
    delete Memory.rooms;
    var mem = m();
    mem.creeps = {};
    mem.rooms = {};
    mem.spawns = {};
    mem.uuid = getTotalCreepCount();
    mem.memVersion = MemoryVersion;
}
function getTotalCreepCount() {
    var totalcreepCount = 0;
    for (var i in Game.rooms) {
        var room = Game.rooms[i];
        var creeps$$1 = room.find(FIND_MY_CREEPS);
        totalcreepCount += creeps$$1.length;
    }
    return totalcreepCount;
}
function InitializeGame() {
    if (m().memVersion === undefined ||
        m().memVersion !== MemoryVersion ||
        (m().memVersion == 0 && !initialized)) {
        initialized = true;
        memoryInit();
    }
    if (!m().uuid || m().uuid > 1000) {
        m().uuid = getTotalCreepCount();
    }
}
function mainLoop() {
    InitializeGame();
    //console.log("main loop.")
    for (var i in Game.rooms) {
        var room = Game.rooms[i];
        var mem = m();
        var roomMemory = mem.rooms[room.name];
        if (roomMemory === undefined) {
            console.log("Init room memory for " + room.name + ".");
            Memory.rooms[room.name] = {};
            initRoomMemory(room.name);
            roomMemory = mem.rooms[room.name];
        }
        rm.Run(room.name);
    }
    cleanupCreeps();
}
var loop = ErrorMapper.wrapLoop(mainLoop);

exports.loop = loop;
//# sourceMappingURL=main.js.map
