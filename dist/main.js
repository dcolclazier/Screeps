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

/**
 * To start using Traveler, require it in main.js:
 * Example: var Traveler = require('Traveler.js');
 */
var Traveler = /** @class */ (function () {
    function Traveler() {
    }
    /**
     * move creep to destination
     * @param creep
     * @param destination
     * @param options
     * @returns {number}
     */
    Traveler.travelTo = function (creep, destination, options) {
        if (options === void 0) { options = {}; }
        // uncomment if you would like to register hostile rooms entered
        // this.updateRoomStatus(creep.room);
        if (!destination) {
            return ERR_INVALID_ARGS;
        }
        if (creep.fatigue > 0) {
            Traveler.circle(creep.pos, "aqua", .3);
            return ERR_TIRED;
        }
        destination = this.normalizePos(destination);
        // manage case where creep is nearby destination
        var rangeToDestination = creep.pos.getRangeTo(destination);
        if (options.range && rangeToDestination <= options.range) {
            return OK;
        }
        else if (rangeToDestination <= 1) {
            if (rangeToDestination === 1 && !options.range) {
                var direction = creep.pos.getDirectionTo(destination);
                if (options.returnData) {
                    options.returnData.nextPos = destination;
                    options.returnData.path = direction.toString();
                }
                return creep.move(direction);
            }
            return OK;
        }
        // initialize data object
        if (!creep.memory._trav) {
            delete creep.memory._travel;
            creep.memory._trav = {};
        }
        var travelData = creep.memory._trav;
        var state = this.deserializeState(travelData, destination);
        // uncomment to visualize destination
        // this.circle(destination.pos, "orange");
        // check if creep is stuck
        if (this.isStuck(creep, state)) {
            state.stuckCount++;
            Traveler.circle(creep.pos, "magenta", state.stuckCount * .2);
        }
        else {
            state.stuckCount = 0;
        }
        // handle case where creep is stuck
        if (!options.stuckValue) {
            options.stuckValue = DEFAULT_STUCK_VALUE;
        }
        if (state.stuckCount >= options.stuckValue && Math.random() > .5) {
            options.ignoreCreeps = false;
            options.freshMatrix = true;
            delete travelData.path;
        }
        // TODO:handle case where creep moved by some other function, but destination is still the same
        // delete path cache if destination is different
        if (!this.samePos(state.destination, destination)) {
            if (options.movingTarget && state.destination.isNearTo(destination)) {
                travelData.path += state.destination.getDirectionTo(destination);
                state.destination = destination;
            }
            else {
                delete travelData.path;
            }
        }
        if (options.repath && Math.random() < options.repath) {
            // add some chance that you will find a new path randomly
            delete travelData.path;
        }
        // pathfinding
        var newPath = false;
        if (!travelData.path) {
            newPath = true;
            if (creep.spawning) {
                return ERR_BUSY;
            }
            state.destination = destination;
            var cpu = Game.cpu.getUsed();
            var ret = this.findTravelPath(creep.pos, destination, options);
            var cpuUsed = Game.cpu.getUsed() - cpu;
            state.cpu = _.round(cpuUsed + state.cpu);
            if (state.cpu > REPORT_CPU_THRESHOLD) {
                // see note at end of file for more info on this
                console.log("TRAVELER: heavy cpu use: " + creep.name + ", cpu: " + state.cpu + " origin: " + creep.pos + ", dest: " + destination);
            }
            var color = "orange";
            if (ret.incomplete) {
                // uncommenting this is a great way to diagnose creep behavior issues
                // console.log(`TRAVELER: incomplete path for ${creep.name}`);
                color = "red";
            }
            if (options.returnData) {
                options.returnData.pathfinderReturn = ret;
            }
            travelData.path = Traveler.serializePath(creep.pos, ret.path, color);
            state.stuckCount = 0;
        }
        this.serializeState(creep, destination, state, travelData);
        if (!travelData.path || travelData.path.length === 0) {
            return ERR_NO_PATH;
        }
        // consume path
        if (state.stuckCount === 0 && !newPath) {
            travelData.path = travelData.path.substr(1);
        }
        var nextDirection = parseInt(travelData.path[0], 10);
        if (options.returnData) {
            if (nextDirection) {
                var nextPos = Traveler.positionAtDirection(creep.pos, nextDirection);
                if (nextPos) {
                    options.returnData.nextPos = nextPos;
                }
            }
            options.returnData.state = state;
            options.returnData.path = travelData.path;
        }
        return creep.move(nextDirection);
    };
    /**
     * make position objects consistent so that either can be used as an argument
     * @param destination
     * @returns {any}
     */
    Traveler.normalizePos = function (destination) {
        if (!(destination instanceof RoomPosition)) {
            return destination.pos;
        }
        return destination;
    };
    /**
     * check if room should be avoided by findRoute algorithm
     * @param roomName
     * @returns {RoomMemory|number}
     */
    Traveler.checkAvoid = function (roomName) {
        return Memory.rooms && Memory.rooms[roomName] && Memory.rooms[roomName].avoid;
    };
    /**
     * check if a position is an exit
     * @param pos
     * @returns {boolean}
     */
    Traveler.isExit = function (pos) {
        return pos.x === 0 || pos.y === 0 || pos.x === 49 || pos.y === 49;
    };
    /**
     * check two coordinates match
     * @param pos1
     * @param pos2
     * @returns {boolean}
     */
    Traveler.sameCoord = function (pos1, pos2) {
        return pos1.x === pos2.x && pos1.y === pos2.y;
    };
    /**
     * check if two positions match
     * @param pos1
     * @param pos2
     * @returns {boolean}
     */
    Traveler.samePos = function (pos1, pos2) {
        return this.sameCoord(pos1, pos2) && pos1.roomName === pos2.roomName;
    };
    /**
     * draw a circle at position
     * @param pos
     * @param color
     * @param opacity
     */
    Traveler.circle = function (pos, color, opacity) {
        new RoomVisual(pos.roomName).circle(pos, {
            radius: .45, fill: "transparent", stroke: color, strokeWidth: .15, opacity: opacity
        });
    };
    /**
     * update memory on whether a room should be avoided based on controller owner
     * @param room
     */
    Traveler.updateRoomStatus = function (room) {
        if (!room) {
            return;
        }
        if (room.controller) {
            if (room.controller.owner && !room.controller.my) {
                room.memory.avoid = 1;
            }
            else {
                delete room.memory.avoid;
            }
        }
    };
    /**
     * find a path from origin to destination
     * @param origin
     * @param destination
     * @param options
     * @returns {PathfinderReturn}
     */
    Traveler.findTravelPath = function (origin, destination, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        _.defaults(options, {
            ignoreCreeps: true,
            maxOps: DEFAULT_MAXOPS,
            range: 1,
        });
        if (options.movingTarget) {
            options.range = 0;
        }
        origin = this.normalizePos(origin);
        destination = this.normalizePos(destination);
        var originRoomName = origin.roomName;
        var destRoomName = destination.roomName;
        // check to see whether findRoute should be used
        var roomDistance = Game.map.getRoomLinearDistance(origin.roomName, destination.roomName);
        var allowedRooms = options.route;
        if (!allowedRooms && (options.useFindRoute || (options.useFindRoute === undefined && roomDistance > 2))) {
            var route = this.findRoute(origin.roomName, destination.roomName, options);
            if (route) {
                allowedRooms = route;
            }
        }
        var callback = function (roomName) {
            if (allowedRooms) {
                if (!allowedRooms[roomName]) {
                    return false;
                }
            }
            else if (!options.allowHostile && Traveler.checkAvoid(roomName)
                && roomName !== destRoomName && roomName !== originRoomName) {
                return false;
            }
            var matrix;
            var room = Game.rooms[roomName];
            if (room) {
                if (options.ignoreStructures) {
                    matrix = new PathFinder.CostMatrix();
                    if (!options.ignoreCreeps) {
                        Traveler.addCreepsToMatrix(room, matrix);
                    }
                }
                else if (options.ignoreCreeps || roomName !== originRoomName) {
                    matrix = _this.getStructureMatrix(room, options.freshMatrix);
                }
                else {
                    matrix = _this.getCreepMatrix(room);
                }
                if (options.obstacles) {
                    matrix = matrix.clone();
                    for (var _i = 0, _a = options.obstacles; _i < _a.length; _i++) {
                        var obstacle = _a[_i];
                        if (obstacle.pos.roomName !== roomName) {
                            continue;
                        }
                        matrix.set(obstacle.pos.x, obstacle.pos.y, 0xff);
                    }
                }
            }
            if (options.roomCallback) {
                if (!matrix) {
                    matrix = new PathFinder.CostMatrix();
                }
                var outcome = options.roomCallback(roomName, matrix.clone());
                if (outcome !== undefined) {
                    return outcome;
                }
            }
            return matrix;
        };
        var ret = PathFinder.search(origin, { pos: destination, range: options.range }, {
            maxOps: options.maxOps,
            maxRooms: options.maxRooms,
            plainCost: options.offRoad ? 1 : options.ignoreRoads ? 1 : 2,
            swampCost: options.offRoad ? 1 : options.ignoreRoads ? 5 : 10,
            roomCallback: callback,
        });
        if (ret.incomplete && options.ensurePath) {
            if (options.useFindRoute === undefined) {
                // handle case where pathfinder failed at a short distance due to not using findRoute
                // can happen for situations where the creep would have to take an uncommonly indirect path
                // options.allowedRooms and options.routeCallback can also be used to handle this situation
                if (roomDistance <= 2) {
                    console.log("TRAVELER: path failed without findroute, trying with options.useFindRoute = true");
                    console.log("from: " + origin + ", destination: " + destination);
                    options.useFindRoute = true;
                    ret = this.findTravelPath(origin, destination, options);
                    console.log("TRAVELER: second attempt was " + (ret.incomplete ? "not " : "") + "successful");
                    return ret;
                }
                // TODO: handle case where a wall or some other obstacle is blocking the exit assumed by findRoute
            }
        }
        return ret;
    };
    /**
     * find a viable sequence of rooms that can be used to narrow down pathfinder's search algorithm
     * @param origin
     * @param destination
     * @param options
     * @returns {{}}
     */
    Traveler.findRoute = function (origin, destination, options) {
        var _a;
        if (options === void 0) { options = {}; }
        var restrictDistance = options.restrictDistance || Game.map.getRoomLinearDistance(origin, destination) + 10;
        var allowedRooms = (_a = {}, _a[origin] = true, _a[destination] = true, _a);
        var highwayBias = 1;
        if (options.preferHighway) {
            highwayBias = 2.5;
            if (options.highwayBias) {
                highwayBias = options.highwayBias;
            }
        }
        var ret = Game.map.findRoute(origin, destination, {
            routeCallback: function (roomName) {
                if (options.routeCallback) {
                    var outcome = options.routeCallback(roomName);
                    if (outcome !== undefined) {
                        return outcome;
                    }
                }
                var rangeToRoom = Game.map.getRoomLinearDistance(origin, roomName);
                if (rangeToRoom > restrictDistance) {
                    // room is too far out of the way
                    return Number.POSITIVE_INFINITY;
                }
                if (!options.allowHostile && Traveler.checkAvoid(roomName) &&
                    roomName !== destination && roomName !== origin) {
                    // room is marked as "avoid" in room memory
                    return Number.POSITIVE_INFINITY;
                }
                var parsed;
                if (options.preferHighway) {
                    parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
                    var isHighway = (parsed[1] % 10 === 0) || (parsed[2] % 10 === 0);
                    if (isHighway) {
                        return 1;
                    }
                }
                // SK rooms are avoided when there is no vision in the room, harvested-from SK rooms are allowed
                if (!options.allowSK && !Game.rooms[roomName]) {
                    if (!parsed) {
                        parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
                    }
                    var fMod = parsed[1] % 10;
                    var sMod = parsed[2] % 10;
                    var isSK = !(fMod === 5 && sMod === 5) &&
                        ((fMod >= 4) && (fMod <= 6)) &&
                        ((sMod >= 4) && (sMod <= 6));
                    if (isSK) {
                        return 10 * highwayBias;
                    }
                }
                return highwayBias;
            },
        });
        if (!_.isArray(ret)) {
            console.log("couldn't findRoute to " + destination);
            return;
        }
        for (var _i = 0, ret_1 = ret; _i < ret_1.length; _i++) {
            var value = ret_1[_i];
            allowedRooms[value.room] = true;
        }
        return allowedRooms;
    };
    /**
     * check how many rooms were included in a route returned by findRoute
     * @param origin
     * @param destination
     * @returns {number}
     */
    Traveler.routeDistance = function (origin, destination) {
        var linearDistance = Game.map.getRoomLinearDistance(origin, destination);
        if (linearDistance >= 32) {
            return linearDistance;
        }
        var allowedRooms = this.findRoute(origin, destination);
        if (allowedRooms) {
            return Object.keys(allowedRooms).length;
        }
    };
    /**
     * build a cost matrix based on structures in the room. Will be cached for more than one tick. Requires vision.
     * @param room
     * @param freshMatrix
     * @returns {any}
     */
    Traveler.getStructureMatrix = function (room, freshMatrix) {
        if (!this.structureMatrixCache[room.name] || (freshMatrix && Game.time !== this.structureMatrixTick)) {
            this.structureMatrixTick = Game.time;
            var matrix = new PathFinder.CostMatrix();
            this.structureMatrixCache[room.name] = Traveler.addStructuresToMatrix(room, matrix, 1);
        }
        return this.structureMatrixCache[room.name];
    };
    /**
     * build a cost matrix based on creeps and structures in the room. Will be cached for one tick. Requires vision.
     * @param room
     * @returns {any}
     */
    Traveler.getCreepMatrix = function (room) {
        if (!this.creepMatrixCache[room.name] || Game.time !== this.creepMatrixTick) {
            this.creepMatrixTick = Game.time;
            this.creepMatrixCache[room.name] = Traveler.addCreepsToMatrix(room, this.getStructureMatrix(room, true).clone());
        }
        return this.creepMatrixCache[room.name];
    };
    /**
     * add structures to matrix so that impassible structures can be avoided and roads given a lower cost
     * @param room
     * @param matrix
     * @param roadCost
     * @returns {CostMatrix}
     */
    Traveler.addStructuresToMatrix = function (room, matrix, roadCost) {
        var impassibleStructures = [];
        for (var _i = 0, _a = room.find(FIND_STRUCTURES); _i < _a.length; _i++) {
            var structure = _a[_i];
            if (structure instanceof StructureRampart) {
                if (!structure.my && !structure.isPublic) {
                    impassibleStructures.push(structure);
                }
            }
            else if (structure instanceof StructureRoad) {
                matrix.set(structure.pos.x, structure.pos.y, roadCost);
            }
            else if (structure instanceof StructureContainer) {
                matrix.set(structure.pos.x, structure.pos.y, 5);
            }
            else {
                impassibleStructures.push(structure);
            }
        }
        for (var _b = 0, _c = room.find(FIND_MY_CONSTRUCTION_SITES); _b < _c.length; _b++) {
            var site = _c[_b];
            if (site.structureType === STRUCTURE_CONTAINER || site.structureType === STRUCTURE_ROAD
                || site.structureType === STRUCTURE_RAMPART) {
                continue;
            }
            matrix.set(site.pos.x, site.pos.y, 0xff);
        }
        for (var _d = 0, impassibleStructures_1 = impassibleStructures; _d < impassibleStructures_1.length; _d++) {
            var structure = impassibleStructures_1[_d];
            matrix.set(structure.pos.x, structure.pos.y, 0xff);
        }
        return matrix;
    };
    /**
     * add creeps to matrix so that they will be avoided by other creeps
     * @param room
     * @param matrix
     * @returns {CostMatrix}
     */
    Traveler.addCreepsToMatrix = function (room, matrix) {
        room.find(FIND_CREEPS).forEach(function (creep) { return matrix.set(creep.pos.x, creep.pos.y, 0xff); });
        return matrix;
    };
    /**
     * serialize a path, traveler style. Returns a string of directions.
     * @param startPos
     * @param path
     * @param color
     * @returns {string}
     */
    Traveler.serializePath = function (startPos, path, color) {
        if (color === void 0) { color = "orange"; }
        var serializedPath = "";
        var lastPosition = startPos;
        this.circle(startPos, color);
        for (var _i = 0, path_1 = path; _i < path_1.length; _i++) {
            var position = path_1[_i];
            if (position.roomName === lastPosition.roomName) {
                new RoomVisual(position.roomName)
                    .line(position, lastPosition, { color: color, lineStyle: "dashed" });
                serializedPath += lastPosition.getDirectionTo(position);
            }
            lastPosition = position;
        }
        return serializedPath;
    };
    /**
     * returns a position at a direction relative to origin
     * @param origin
     * @param direction
     * @returns {RoomPosition}
     */
    Traveler.positionAtDirection = function (origin, direction) {
        var offsetX = [0, 0, 1, 1, 1, 0, -1, -1, -1];
        var offsetY = [0, -1, -1, 0, 1, 1, 1, 0, -1];
        var x = origin.x + offsetX[direction];
        var y = origin.y + offsetY[direction];
        if (x > 49 || x < 0 || y > 49 || y < 0) {
            return;
        }
        return new RoomPosition(x, y, origin.roomName);
    };
    /**
     * convert room avoidance memory from the old pattern to the one currently used
     * @param cleanup
     */
    Traveler.patchMemory = function (cleanup) {
        if (cleanup === void 0) { cleanup = false; }
        if (!Memory.empire) {
            return;
        }
        if (!Memory.empire.hostileRooms) {
            return;
        }
        var count = 0;
        for (var roomName in Memory.empire.hostileRooms) {
            if (Memory.empire.hostileRooms[roomName]) {
                if (!Memory.rooms[roomName]) {
                    Memory.rooms[roomName] = {};
                }
                Memory.rooms[roomName].avoid = 1;
                count++;
            }
            if (cleanup) {
                delete Memory.empire.hostileRooms[roomName];
            }
        }
        if (cleanup) {
            delete Memory.empire.hostileRooms;
        }
        console.log("TRAVELER: room avoidance data patched for " + count + " rooms");
    };
    Traveler.deserializeState = function (travelData, destination) {
        var state = {};
        if (travelData.state) {
            state.lastCoord = { x: travelData.state[STATE_PREV_X], y: travelData.state[STATE_PREV_Y] };
            state.cpu = travelData.state[STATE_CPU];
            state.stuckCount = travelData.state[STATE_STUCK];
            state.destination = new RoomPosition(travelData.state[STATE_DEST_X], travelData.state[STATE_DEST_Y], travelData.state[STATE_DEST_ROOMNAME]);
        }
        else {
            state.cpu = 0;
            state.destination = destination;
        }
        return state;
    };
    Traveler.serializeState = function (creep, destination, state, travelData) {
        travelData.state = [creep.pos.x, creep.pos.y, state.stuckCount, state.cpu, destination.x, destination.y,
            destination.roomName];
    };
    Traveler.isStuck = function (creep, state) {
        var stuck = false;
        if (state.lastCoord !== undefined) {
            if (this.sameCoord(creep.pos, state.lastCoord)) {
                // didn't move
                stuck = true;
            }
            else if (this.isExit(creep.pos) && this.isExit(state.lastCoord)) {
                // moved against exit
                stuck = true;
            }
        }
        return stuck;
    };
    Traveler.structureMatrixCache = {};
    Traveler.creepMatrixCache = {};
    return Traveler;
}());
// this might be higher than you wish, setting it lower is a great way to diagnose creep behavior issues. When creeps
// need to repath to often or they aren't finding valid paths, it can sometimes point to problems elsewhere in your code
var REPORT_CPU_THRESHOLD = 1000;
var DEFAULT_MAXOPS = 20000;
var DEFAULT_STUCK_VALUE = 2;
var STATE_PREV_X = 0;
var STATE_PREV_Y = 1;
var STATE_STUCK = 2;
var STATE_CPU = 3;
var STATE_DEST_X = 4;
var STATE_DEST_Y = 5;
var STATE_DEST_ROOMNAME = 6;
// assigns a function to Creep.prototype: creep.travelTo(destination)
Creep.prototype.travelTo = function (destination, options) {
    return Traveler.travelTo(this, destination, options);
};

//import { SmartSource, SmartContainer, SmartLink } from "utils/memory";
var RoomManager = /** @class */ (function () {
    function RoomManager() {
        //creeps: Array<Creep> = [];
        this._defaultSpawn = "";
        this.creeps2 = {};
        this._sources2 = {};
        this._links2 = {};
        this._containers2 = {};
        this._towers2 = {};
        console.log("Global reset!!");
    }
    RoomManager.prototype.getSources2 = function (roomName) {
        var room = Memory.rooms[roomName];
        if (room == undefined) {
            console.log("ERROR_getSources2 - undefined room in memory? how? " + roomName);
            return [];
        }
        if (this._sources2[roomName] == undefined) {
            this._sources2[roomName] = this.loadSources2(roomName);
            this.initializeSources(roomName);
        }
        return this._sources2[roomName];
    };
    RoomManager.prototype.getContainers2 = function (roomName) {
        var room = Memory.rooms[roomName];
        if (room == undefined) {
            console.log("ERROR_getContainers2 - undefined room in memory? how? " + roomName);
            return [];
        }
        if (this._containers2[roomName] == undefined) {
            this._containers2[roomName] = this.loadContainers2(roomName);
            this.initializeContainers(roomName);
        }
        return this._containers2[roomName];
    };
    RoomManager.prototype.getLinks2 = function (roomName) {
        var room = Memory.rooms[roomName];
        if (room == undefined) {
            console.log("ERROR_getLinks2 - undefined room in memory? how?" + roomName);
            return [];
        }
        var links = this._links2[roomName];
        if (links == undefined) {
            links = this._links2[roomName] = this.loadLinks2(roomName);
        }
        return links;
    };
    RoomManager.prototype.getTowers2 = function (roomName) {
        var room = Memory.rooms[roomName];
        if (room == undefined) {
            console.log("ERROR_getLinks2 - undefined room in memory? how?" + roomName);
            return [];
        }
        var towers = this._towers2[roomName];
        if (towers == undefined) {
            towers = this._towers2[roomName] = this.loadTowers2(roomName);
        }
        return towers;
    };
    RoomManager.prototype.Run = function (roomName) {
        this.loadCreeps(roomName);
        this.loadResources(roomName);
        this.getTowers2(roomName);
        this.getContainers2(roomName);
    };
    /* Initialization methods - runs after loaded*/
    RoomManager.prototype.initializeContainers = function (roomName) {
        var _this = this;
        //var test = this.getContainers2(roomName);
        _.forEach(this._containers2[roomName], function (c) {
            if (c.shouldRefill == undefined || c.allowedWithdrawRoles == undefined) {
                var rangeToSources = _.map(_this.getSources2(roomName), function (s) { return c.pos.getRangeTo(s); });
                var closestRange = _.min(rangeToSources, function (s) { return s; });
                if (closestRange <= 2) {
                    //miner depository
                    c.allowedWithdrawRoles = ["ROLE_WORKER", "ROLE_CARRIER"];
                }
                else {
                    //probably container withdraw point
                    c.allowedWithdrawRoles = ["ROLE_UPGRADER"];
                    c.shouldRefill = true;
                }
            }
        });
        //this._containers2[roomName] = test;
        //const sources = this.sources;
    };
    RoomManager.prototype.initializeSources = function (roomName) {
        var _this = this;
        _.forEach(this._sources2[roomName], function (source) {
            if (source.linkID == "" && source.containerID == "") {
                if (source.linkID == "") {
                    var closestLinks = _.filter(_this.getLinks2(roomName), function (l) { return source.pos.getRangeTo(l) <= 2; });
                    if (closestLinks.length > 0) {
                        source.linkID = closestLinks[0].id;
                    }
                }
                if (source.containerID == "") {
                    var test = _this.getContainers2(roomName);
                    var closestContainers = _.filter(test, function (c) { return source.pos.getRangeTo(c.pos) <= 2; });
                    if (closestContainers.length > 0) {
                        source.containerID = closestContainers[0].id;
                    }
                }
            }
        });
    };
    /* Loading methods - should refactor eventually...*/
    RoomManager.prototype.loadCreeps = function (roomName) {
        var room = Game.rooms[roomName];
        this.creeps2[roomName] = room.find(FIND_MY_CREEPS);
        var creeps = this.creeps2[roomName];
        var spawn = room.find(FIND_MY_SPAWNS)[0];
        if (spawn != undefined)
            this._defaultSpawn = spawn.id;
        for (var id in creeps) {
            var creep = creeps[id];
            if (creep.memory === undefined || creep.memory.alive === undefined) {
                creep.memory = {
                    spawnID: (spawn != undefined ? spawn.id : this._defaultSpawn),
                    idle: true,
                    alive: true,
                    role: getRole(creep.name),
                    currentTask: "",
                    homeRoom: room.name,
                    _trav: 0,
                    _travel: 0
                };
            }
        }
    };
    RoomManager.prototype.loadContainers2 = function (roomName) {
        var roomMem = Memory.rooms[roomName];
        if (roomMem == undefined) {
            console.log("ERROR_loadSources2 - need to handle undefined room " + roomName);
            return [];
        }
        var room = Game.rooms[roomName];
        if (room == undefined) {
            console.log("WARNING_loadSources2 - don't have visibility to room " + roomName);
            return [];
        }
        var containers = room.find(FIND_STRUCTURES).filter(function (s) { return s.structureType == "container"; });
        var containerMems = [];
        _.forEach(containers, function (container) {
            var mem = {
                type: container.structureType,
                roomName: roomName,
                currentTask: "",
                pos: container.pos,
                id: container.id,
                shouldRefill: false,
                allowedWithdrawRoles: undefined,
            };
            if (roomMem.structures[container.id] == undefined)
                roomMem.structures[container.id] = mem;
            containerMems.push(mem);
        });
        return containerMems;
    };
    RoomManager.prototype.loadTowers2 = function (roomName) {
        var roomMem = Memory.rooms[roomName];
        if (roomMem == undefined) {
            console.log("ERROR_loadSources2 - need to handle undefined room " + roomName);
            return [];
        }
        var room = Game.rooms[roomName];
        if (room == undefined) {
            console.log("WARNING_loadSources2 - don't have visibility to room " + roomName);
            return [];
        }
        var towers = room.find(FIND_MY_STRUCTURES).filter(function (s) { return s.structureType == "tower"; });
        var sourceMems = [];
        _.forEach(towers, function (tower) {
            var mem = {
                pos: tower.pos,
                towerMode: "IDLE",
                id: tower.id,
                currentTask: "",
                type: tower.structureType,
                roomName: tower.room.name,
            };
            if (roomMem.structures[tower.id] == undefined)
                roomMem.structures[tower.id] = mem;
            sourceMems.push(mem);
        });
        return sourceMems;
    };
    RoomManager.prototype.loadSources2 = function (roomName) {
        var roomMem = Memory.rooms[roomName];
        if (roomMem == undefined) {
            console.log("ERROR_loadSources2 - need to handle undefined room " + roomName);
            return [];
        }
        var room = Game.rooms[roomName];
        if (room == undefined) {
            console.log("WARNING_loadSources2 - don't have visibility to room " + roomName);
            return [];
        }
        var sources = room.find(FIND_SOURCES);
        var sourceMems = [];
        _.forEach(sources, function (source) {
            var mem = {
                id: source.id,
                pos: source.pos,
                linkID: "",
                currentTask: "",
                assignedTo: [],
                type: "source",
                roomName: source.room.name,
                containerID: "",
            };
            if (roomMem.structures[source.id] == undefined)
                roomMem.structures[source.id] = mem;
            sourceMems.push(mem);
        });
        return sourceMems;
    };
    RoomManager.prototype.loadLinks2 = function (roomName) {
        var roomMem = Memory.rooms[roomName];
        if (roomMem == undefined) {
            console.log("ERROR_loadLinks2 - need to handle undefined room " + roomName);
            return [];
        }
        var room = Game.rooms[roomName];
        if (room == undefined) {
            console.log("WARNING_loadLinks2 - don't have visibility to room " + roomName);
            return [];
        }
        var links = room.find(FIND_MY_STRUCTURES).filter(function (s) { return s.structureType == "link"; });
        var sourceMems = [];
        _.forEach(links, function (link) {
            var linkMode = "SLAVE_RECEIVE";
            if (room.storage != undefined) {
                var rangeToStorage = room.storage.pos.getRangeTo(link);
                if (rangeToStorage == 1)
                    linkMode = "MASTER_RECEIVE";
            }
            else if (room.controller != undefined) {
                var rangeToController = room.controller.pos.getRangeTo(link);
                if (rangeToController <= 2)
                    linkMode = "SEND";
            }
            var mem = {
                pos: link.pos,
                linkMode: linkMode,
                id: link.id,
                currentTask: "",
                type: link.structureType,
                roomName: link.room.name,
            };
            if (roomMem.structures[link.id] == undefined)
                roomMem.structures[link.id] = mem;
            sourceMems.push(mem);
        });
        return sourceMems;
    };
    RoomManager.prototype.loadResources = function (roomName) {
        var room = Game.rooms[roomName];
        var roomMem = room.memory;
        var resources = room.find(FIND_DROPPED_RESOURCES);
        var sorted = _.sortBy(resources, function (r) { return r.amount; });
        roomMem.activeResourcePileIDs = sorted.map(function (u) { return u.id; });
    };
    return RoomManager;
}());
var roomManager = new RoomManager();
//export class $ { // $ = cash = cache... get it? :D
//  static structures<T extends Structure>(saver: { ref: string }, key: string, callback: () => T[],
//    timeout = CACHE_TIMEOUT): T[] {
//    let cacheKey = saver.ref + ':' + key;
//    if (!_cache.structures[cacheKey] || Game.time > _cache.expiration[cacheKey]) {
//      // Recache if new entry or entry is expired
//      _cache.structures[cacheKey] = callback();
//      _cache.expiration[cacheKey] = getCacheExpiration(timeout, Math.ceil(timeout / 10));
//    } else {
//      // Refresh structure list by ID if not already done on current tick
//      if (_cache.accessed[cacheKey] < Game.time) {
//        _cache.structures[cacheKey] = _.compact(_.map(_cache.structures[cacheKey],
//          s => Game.getObjectById(s.id))) as Structure[];
//        _cache.accessed[cacheKey] = Game.time;
//      }
//    }
//    return _cache.structures[cacheKey] as T[];
//  }
//  static number(saver: { ref: string }, key: string, callback: () => number, timeout = SHORT_CACHE_TIMEOUT): number {
//    let cacheKey = saver.ref + ':' + key;
//    if (_cache.numbers[cacheKey] == undefined || Game.time > _cache.expiration[cacheKey]) {
//      // Recache if new entry or entry is expired
//      _cache.numbers[cacheKey] = callback();
//      _cache.expiration[cacheKey] = getCacheExpiration(timeout, Math.ceil(timeout / 10));
//    }
//    return _cache.numbers[cacheKey];
//  }
//  static list<T>(saver: { ref: string }, key: string, callback: () => T[], timeout = CACHE_TIMEOUT): T[] {
//    let cacheKey = saver.ref + ':' + key;
//    if (_cache.lists[cacheKey] == undefined || Game.time > _cache.expiration[cacheKey]) {
//      // Recache if new entry or entry is expired
//      _cache.lists[cacheKey] = callback();
//      _cache.expiration[cacheKey] = getCacheExpiration(timeout, Math.ceil(timeout / 10));
//    }
//    return _cache.lists[cacheKey];
//  }
//  static costMatrix(roomName: string, key: string, callback: () => CostMatrix,
//    timeout = SHORT_CACHE_TIMEOUT): CostMatrix {
//    let cacheKey = roomName + ':' + key;
//    if (_cache.costMatrices[cacheKey] == undefined || Game.time > _cache.expiration[cacheKey]) {
//      // Recache if new entry or entry is expired
//      _cache.costMatrices[cacheKey] = callback();
//      _cache.expiration[cacheKey] = getCacheExpiration(timeout, Math.ceil(timeout / 10));
//    }
//    return _cache.costMatrices[cacheKey];
//  }
//  static costMatrixRecall(roomName: string, key: string): CostMatrix | undefined {
//    let cacheKey = roomName + ':' + key;
//    return _cache.costMatrices[cacheKey];
//  }
//  static set<T extends HasRef, K extends keyof T>(thing: T, key: K,
//    callback: () => (T[K] & (undefined | HasID | HasID[])),
//    timeout = CACHE_TIMEOUT) {
//    let cacheKey = thing.ref + '$' + key;
//    if (!_cache.things[cacheKey] || Game.time > _cache.expiration[cacheKey]) {
//      // Recache if new entry or entry is expired
//      _cache.things[cacheKey] = callback();
//      _cache.expiration[cacheKey] = getCacheExpiration(timeout, Math.ceil(timeout / 10));
//    } else {
//      // Refresh structure list by ID if not already done on current tick
//      if (_cache.accessed[cacheKey] < Game.time) {
//        if (_.isArray(_cache.things[cacheKey])) {
//          _cache.things[cacheKey] = _.compact(_.map(_cache.things[cacheKey] as HasID[],
//            s => Game.getObjectById(s.id))) as HasID[];
//        } else {
//          _cache.things[cacheKey] = Game.getObjectById((<HasID>_cache.things[cacheKey]).id) as HasID;
//        }
//        _cache.accessed[cacheKey] = Game.time;
//      }
//    }
//    thing[key] = _cache.things[cacheKey] as T[K] & (undefined | HasID | HasID[]);
//  }
//}

function closestOwnedRoom(targetRoomName) {
    var ownedRooms = _.filter(Memory.rooms, function (room) { return room.roomType === "OWNED"; });
    var min = 99;
    var winner = "";
    for (var roomName in ownedRooms) {
        var distance = Traveler.findRoute(roomName, targetRoomName);
        if (distance != undefined && Object.keys(distance).length < min) {
            min = Object.keys(distance).length;
            winner = roomName;
        }
    }
    return winner;
}
function findFlags(roomName, primaryColor, flagName) {
    if (primaryColor === void 0) { primaryColor = undefined; }
    if (flagName === void 0) { flagName = undefined; }
    var found = [];
    var flags = Game.flags;
    for (var id in flags) {
        var flag = flags[id];
        if ((flag.pos.roomName == roomName || roomName == undefined)
            && (flag.color == primaryColor || primaryColor == undefined)
            && (flag.name == flagName || flagName == undefined))
            found.push(flag);
    }
    return found;
}
function uniqueID() {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return '_' + Math.random().toString(36).substr(2, 9);
}
var Search2 = /** @class */ (function () {
    function Search2() {
        this.toFind = "rampart";
        this.roomMatrix = new PathFinder.CostMatrix();
        this.outerRampartsAndWalls = {};
    }
    Search2.prototype.getRoomPosition = function (roomName, friendly) {
        var split = friendly.split(",");
        return new RoomPosition(Number(split[0]), Number(split[1]), roomName);
    };
    //public findBaseArea(roomName: string): RoomPosition[] {
    //  var room = Game.rooms[roomName];
    //  if (room == undefined) throw Error("Cant get neighbors on a non-visible room...");
    //  this.initialize(roomName);
    //}
    Search2.prototype.initialize = function (roomName) {
        var room = Game.rooms[roomName];
        if (room == undefined)
            throw Error("Cant get neighbors on a non-visible room...");
        this.roomMatrix = new PathFinder.CostMatrix();
        for (var i = 0; i < 50; i++) {
            for (var j = 0; j < 50; j++) {
                this.roomMatrix.set(i, j, Game.map.getTerrainAt(i, j, roomName) == "wall" ? 1 : 0);
            }
        }
    };
    Search2.prototype.findEntrances = function (roomName, toFind) {
        this.toFind = toFind;
        var room = Game.rooms[roomName];
        if (room == undefined)
            throw Error("Cant get neighbors on a non-visible room...");
        this.initialize(roomName);
        var rampartsAndWalls = room.find(FIND_STRUCTURES).filter(function (s) { return s != undefined && (s.structureType == "rampart" || s.structureType == "constructedWall"); });
        for (var id in rampartsAndWalls) {
            var r = rampartsAndWalls[id];
            this.roomMatrix.set(r.pos.x, r.pos.y, r.structureType == "constructedWall" ? 2 : 3);
        }
        //flood from every entry point in room until no unvisited nodes
        for (var i_1 = 0; i_1 < 50; i_1++) {
            if (this.roomMatrix.get(0, i_1) == 0) {
                this.floodFill(0, i_1);
            }
            if (this.roomMatrix.get(49, i_1) == 0) {
                this.floodFill(49, i_1);
            }
            if (this.roomMatrix.get(i_1, 0) == 0) {
                this.floodFill(i_1, 0);
            }
            if (this.roomMatrix.get(i_1, 49) == 0) {
                this.floodFill(i_1, 49);
            }
        }
        var foundEdges = [];
        for (var i in this.outerRampartsAndWalls) {
            var thing = this.outerRampartsAndWalls[i];
            if (thing == toFind)
                foundEdges.push(this.getRoomPosition(roomName, i));
        }
        return foundEdges;
    };
    Search2.prototype.floodFill = function (i, j) {
        if (this.roomMatrix.get(i, j) == 0) {
            this.roomMatrix.set(i, j, 1);
            for (var x = -1; x <= 1; x++) {
                if (i + x < 0 || i + x >= 50)
                    continue;
                for (var y = -1; y <= 1; y++) {
                    if (j + y < 0 || j + y >= 50)
                        continue;
                    if (x == 0 && y == 0)
                        continue;
                    this.floodFill(i + x, j + y);
                }
            }
        }
        else if (this.roomMatrix.get(i, j) == 2) {
            this.roomMatrix.set(i, j, 4);
            //console.log("found wall");
            this.outerRampartsAndWalls[i + "," + j] = "constructedWall";
        }
        else if (this.roomMatrix.get(i, j) == 3) {
            this.roomMatrix.set(i, j, 4);
            //console.log("found rampart");
            this.outerRampartsAndWalls[i + "," + j] = "rampart";
        }
    };
    return Search2;
}());
function findIdleCreeps(homeRoomName, role) {
    if (role === void 0) { role = "ROLE_ALL"; }
    var creeps = Game.creeps;
    var idle = [];
    for (var i in creeps) {
        var creep = creeps[i];
        if (creep.memory.homeRoom != homeRoomName)
            continue;
        if (!creep.memory.idle)
            continue;
        if (creep.memory.role != role && role != "ROLE_ALL")
            continue;
        idle.push(creep);
    }
    return idle;
}
function findIdleStructures(roomName, type) {
    var room = Game.rooms[roomName];
    if (room == undefined)
        return [];
    var test = _.filter(room.memory.structures, function (s) { return s.currentTask == "" && (type == undefined || s.type == type); });
    return _.map(test, function (s) { return s.id; });
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
    var room = Game.rooms[roomName];
    if (room == undefined)
        return 0;
    var creeps = room.find(FIND_MY_CREEPS);
    if (role == undefined)
        return creeps.length;
    else {
        return creepIDsByRole(roomName, role).length;
    }
}
function creepCountAllRooms(role) {
    var count = 0;
    var rooms = Game.rooms;
    for (var id in rooms) {
        var room = rooms[id];
        var creeps = room.find(FIND_MY_CREEPS);
        count += creepIDsByRole(room.name, role).length;
    }
    return count;
}
function getRoomEnergyLevel(roomName) {
    //var roomCreeps = _.filter(Game.creeps, c => c.memory.homeRoom = roomName)
    var room = Game.rooms[roomName];
    var creeps = room.find(FIND_MY_CREEPS);
    if (creeps.length < 3 && room.energyAvailable < 800)
        return 1;
    var cap = room.energyCapacityAvailable;
    if (cap < 550)
        return 1;
    else if (cap <= 950)
        return 2;
    else if (cap <= 1500)
        return 3;
    else if (cap <= 3500)
        return 4;
    else
        return 5;
}
function findClosestSourceID(roomName, targetPos, energyAmount) {
    if (energyAmount === void 0) { energyAmount = 0; }
    var sources = roomManager.getSources2(roomName);
    var withEnergy2 = [];
    _.forEach(sources, function (sourceMem) {
        var source = Game.getObjectById(sourceMem.id);
        if (source.energy > energyAmount)
            withEnergy2.push(source);
    });
    return _.min(withEnergy2, function (source) { return targetPos.getRangeTo(source); }).id;
}
function findSpawns(roomName, onlyNonSpawning) {
    if (onlyNonSpawning === void 0) { onlyNonSpawning = true; }
    var room = Game.rooms[roomName];
    return room.find(FIND_MY_STRUCTURES, {
        filter: function (structure) {
            if (structure.structureType == STRUCTURE_SPAWN) {
                var spawner = structure;
                Memory.spawns[spawner.id] = spawner.memory;
                return onlyNonSpawning ? spawner.spawning === null : true;
            }
            return false;
        }
    });
}
function getTotalCreepCount() {
    var totalcreepCount = 0;
    for (var i in Game.rooms) {
        var room = Game.rooms[i];
        var creeps = room.find(FIND_MY_CREEPS);
        totalcreepCount += creeps.length;
    }
    return totalcreepCount;
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
    if (creepName.search("ROLE_MINER") != -1)
        return "ROLE_MINER";
    if (creepName.search("ROLE_WORKER") != -1)
        return "ROLE_WORKER";
    if (creepName.search("ROLE_UPGRADER") != -1)
        return "ROLE_UPGRADER";
    if (creepName.search("ROLE_CARRIER") != -1)
        return "ROLE_CARRIER";
    if (creepName.search("ROLE_SCOUT") != -1)
        return "ROLE_SCOUT";
    if (creepName.search("ROLE_REMOTE_UPGRADER") != -1)
        return "ROLE_REMOTE_UPGRADER";
    if (creepName.search("ROLE_DEFENDER") != -1)
        return "ROLE_DEFENDER";
    if (creepName.search("ROLE_DISMANTLER") != -1)
        return "ROLE_DISMANTLER";
    if (creepName.search("unknown role") != -1)
        return "ROLE_DISMANTLER";
    return "ROLE_UNASSIGNED";
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

//import { SmartSource, SmartContainer, SmartLink } from "utils/memory";
var RoomManager$1 = /** @class */ (function () {
    function RoomManager() {
        //creeps: Array<Creep> = [];
        this._defaultSpawn = "";
        this.creeps2 = {};
        this._sources2 = {};
        this._links2 = {};
        this._containers2 = {};
        this._towers2 = {};
        console.log("Global reset!!");
    }
    RoomManager.prototype.getSources2 = function (roomName) {
        var room = Memory.rooms[roomName];
        if (room == undefined) {
            console.log("ERROR_getSources2 - undefined room in memory? how? " + roomName);
            return [];
        }
        if (this._sources2[roomName] == undefined) {
            this._sources2[roomName] = this.loadSources2(roomName);
            this.initializeSources(roomName);
        }
        return this._sources2[roomName];
    };
    RoomManager.prototype.getContainers2 = function (roomName) {
        var room = Memory.rooms[roomName];
        if (room == undefined) {
            console.log("ERROR_getContainers2 - undefined room in memory? how? " + roomName);
            return [];
        }
        if (this._containers2[roomName] == undefined) {
            this._containers2[roomName] = this.loadContainers2(roomName);
            this.initializeContainers(roomName);
        }
        return this._containers2[roomName];
    };
    RoomManager.prototype.getLinks2 = function (roomName) {
        var room = Memory.rooms[roomName];
        if (room == undefined) {
            console.log("ERROR_getLinks2 - undefined room in memory? how?" + roomName);
            return [];
        }
        var links = this._links2[roomName];
        if (links == undefined) {
            links = this._links2[roomName] = this.loadLinks2(roomName);
        }
        return links;
    };
    RoomManager.prototype.getTowers2 = function (roomName) {
        var room = Memory.rooms[roomName];
        if (room == undefined) {
            console.log("ERROR_getLinks2 - undefined room in memory? how?" + roomName);
            return [];
        }
        var towers = this._towers2[roomName];
        if (towers == undefined) {
            towers = this._towers2[roomName] = this.loadTowers2(roomName);
        }
        return towers;
    };
    RoomManager.prototype.Run = function (roomName) {
        this.loadCreeps(roomName);
        this.loadResources(roomName);
        this.getTowers2(roomName);
        this.getContainers2(roomName);
    };
    /* Initialization methods - runs after loaded*/
    RoomManager.prototype.initializeContainers = function (roomName) {
        var _this = this;
        //var test = this.getContainers2(roomName);
        _.forEach(this._containers2[roomName], function (c) {
            if (c.shouldRefill == undefined || c.allowedWithdrawRoles == undefined) {
                var rangeToSources = _.map(_this.getSources2(roomName), function (s) { return c.pos.getRangeTo(s); });
                var closestRange = _.min(rangeToSources, function (s) { return s; });
                if (closestRange <= 2) {
                    //miner depository
                    c.allowedWithdrawRoles = ["ROLE_WORKER", "ROLE_CARRIER"];
                }
                else {
                    //probably container withdraw point
                    c.allowedWithdrawRoles = ["ROLE_UPGRADER"];
                    c.shouldRefill = true;
                }
            }
        });
        //this._containers2[roomName] = test;
        //const sources = this.sources;
    };
    RoomManager.prototype.initializeSources = function (roomName) {
        var _this = this;
        _.forEach(this._sources2[roomName], function (source) {
            if (source.linkID == "" && source.containerID == "") {
                if (source.linkID == "") {
                    var closestLinks = _.filter(_this.getLinks2(roomName), function (l) { return source.pos.getRangeTo(l) <= 2; });
                    if (closestLinks.length > 0) {
                        source.linkID = closestLinks[0].id;
                    }
                }
                if (source.containerID == "") {
                    var test = _this.getContainers2(roomName);
                    var closestContainers = _.filter(test, function (c) { return source.pos.getRangeTo(c.pos) <= 2; });
                    if (closestContainers.length > 0) {
                        source.containerID = closestContainers[0].id;
                    }
                }
            }
        });
    };
    /* Loading methods - should refactor eventually...*/
    RoomManager.prototype.loadCreeps = function (roomName) {
        var room = Game.rooms[roomName];
        this.creeps2[roomName] = room.find(FIND_MY_CREEPS);
        var creeps = this.creeps2[roomName];
        var spawn = room.find(FIND_MY_SPAWNS)[0];
        if (spawn != undefined)
            this._defaultSpawn = spawn.id;
        for (var id in creeps) {
            var creep = creeps[id];
            if (creep.memory === undefined || creep.memory.alive === undefined) {
                creep.memory = {
                    spawnID: (spawn != undefined ? spawn.id : this._defaultSpawn),
                    idle: true,
                    alive: true,
                    role: getRole(creep.name),
                    currentTask: "",
                    homeRoom: room.name,
                    _trav: 0,
                    _travel: 0
                };
            }
        }
    };
    RoomManager.prototype.loadContainers2 = function (roomName) {
        var roomMem = Memory.rooms[roomName];
        if (roomMem == undefined) {
            console.log("ERROR_loadSources2 - need to handle undefined room " + roomName);
            return [];
        }
        var room = Game.rooms[roomName];
        if (room == undefined) {
            console.log("WARNING_loadSources2 - don't have visibility to room " + roomName);
            return [];
        }
        var containers = room.find(FIND_STRUCTURES).filter(function (s) { return s.structureType == "container"; });
        var containerMems = [];
        _.forEach(containers, function (container) {
            var mem = {
                type: container.structureType,
                roomName: roomName,
                currentTask: "",
                pos: container.pos,
                id: container.id,
                shouldRefill: false,
                allowedWithdrawRoles: undefined,
            };
            if (roomMem.structures[container.id] == undefined)
                roomMem.structures[container.id] = mem;
            containerMems.push(mem);
        });
        return containerMems;
    };
    RoomManager.prototype.loadTowers2 = function (roomName) {
        var roomMem = Memory.rooms[roomName];
        if (roomMem == undefined) {
            console.log("ERROR_loadSources2 - need to handle undefined room " + roomName);
            return [];
        }
        var room = Game.rooms[roomName];
        if (room == undefined) {
            console.log("WARNING_loadSources2 - don't have visibility to room " + roomName);
            return [];
        }
        var towers = room.find(FIND_MY_STRUCTURES).filter(function (s) { return s.structureType == "tower"; });
        var sourceMems = [];
        _.forEach(towers, function (tower) {
            var mem = {
                pos: tower.pos,
                towerMode: "IDLE",
                id: tower.id,
                currentTask: "",
                type: tower.structureType,
                roomName: tower.room.name,
            };
            if (roomMem.structures[tower.id] == undefined)
                roomMem.structures[tower.id] = mem;
            sourceMems.push(mem);
        });
        return sourceMems;
    };
    RoomManager.prototype.loadSources2 = function (roomName) {
        var roomMem = Memory.rooms[roomName];
        if (roomMem == undefined) {
            console.log("ERROR_loadSources2 - need to handle undefined room " + roomName);
            return [];
        }
        var room = Game.rooms[roomName];
        if (room == undefined) {
            console.log("WARNING_loadSources2 - don't have visibility to room " + roomName);
            return [];
        }
        var sources = room.find(FIND_SOURCES);
        var sourceMems = [];
        _.forEach(sources, function (source) {
            var mem = {
                id: source.id,
                pos: source.pos,
                linkID: "",
                currentTask: "",
                assignedTo: [],
                type: "source",
                roomName: source.room.name,
                containerID: "",
            };
            if (roomMem.structures[source.id] == undefined)
                roomMem.structures[source.id] = mem;
            sourceMems.push(mem);
        });
        return sourceMems;
    };
    RoomManager.prototype.loadLinks2 = function (roomName) {
        var roomMem = Memory.rooms[roomName];
        if (roomMem == undefined) {
            console.log("ERROR_loadLinks2 - need to handle undefined room " + roomName);
            return [];
        }
        var room = Game.rooms[roomName];
        if (room == undefined) {
            console.log("WARNING_loadLinks2 - don't have visibility to room " + roomName);
            return [];
        }
        var links = room.find(FIND_MY_STRUCTURES).filter(function (s) { return s.structureType == "link"; });
        var sourceMems = [];
        _.forEach(links, function (link) {
            var linkMode = "SLAVE_RECEIVE";
            if (room.storage != undefined) {
                var rangeToStorage = room.storage.pos.getRangeTo(link);
                if (rangeToStorage == 1)
                    linkMode = "MASTER_RECEIVE";
            }
            else if (room.controller != undefined) {
                var rangeToController = room.controller.pos.getRangeTo(link);
                if (rangeToController <= 2)
                    linkMode = "SEND";
            }
            var mem = {
                pos: link.pos,
                linkMode: linkMode,
                id: link.id,
                currentTask: "",
                type: link.structureType,
                roomName: link.room.name,
            };
            if (roomMem.structures[link.id] == undefined)
                roomMem.structures[link.id] = mem;
            sourceMems.push(mem);
        });
        return sourceMems;
    };
    RoomManager.prototype.loadResources = function (roomName) {
        var room = Game.rooms[roomName];
        var roomMem = room.memory;
        var resources = room.find(FIND_DROPPED_RESOURCES);
        var sorted = _.sortBy(resources, function (r) { return r.amount; });
        roomMem.activeResourcePileIDs = sorted.map(function (u) { return u.id; });
    };
    return RoomManager;
}());
var roomManager$1 = new RoomManager$1();
//export class $ { // $ = cash = cache... get it? :D
//  static structures<T extends Structure>(saver: { ref: string }, key: string, callback: () => T[],
//    timeout = CACHE_TIMEOUT): T[] {
//    let cacheKey = saver.ref + ':' + key;
//    if (!_cache.structures[cacheKey] || Game.time > _cache.expiration[cacheKey]) {
//      // Recache if new entry or entry is expired
//      _cache.structures[cacheKey] = callback();
//      _cache.expiration[cacheKey] = getCacheExpiration(timeout, Math.ceil(timeout / 10));
//    } else {
//      // Refresh structure list by ID if not already done on current tick
//      if (_cache.accessed[cacheKey] < Game.time) {
//        _cache.structures[cacheKey] = _.compact(_.map(_cache.structures[cacheKey],
//          s => Game.getObjectById(s.id))) as Structure[];
//        _cache.accessed[cacheKey] = Game.time;
//      }
//    }
//    return _cache.structures[cacheKey] as T[];
//  }
//  static number(saver: { ref: string }, key: string, callback: () => number, timeout = SHORT_CACHE_TIMEOUT): number {
//    let cacheKey = saver.ref + ':' + key;
//    if (_cache.numbers[cacheKey] == undefined || Game.time > _cache.expiration[cacheKey]) {
//      // Recache if new entry or entry is expired
//      _cache.numbers[cacheKey] = callback();
//      _cache.expiration[cacheKey] = getCacheExpiration(timeout, Math.ceil(timeout / 10));
//    }
//    return _cache.numbers[cacheKey];
//  }
//  static list<T>(saver: { ref: string }, key: string, callback: () => T[], timeout = CACHE_TIMEOUT): T[] {
//    let cacheKey = saver.ref + ':' + key;
//    if (_cache.lists[cacheKey] == undefined || Game.time > _cache.expiration[cacheKey]) {
//      // Recache if new entry or entry is expired
//      _cache.lists[cacheKey] = callback();
//      _cache.expiration[cacheKey] = getCacheExpiration(timeout, Math.ceil(timeout / 10));
//    }
//    return _cache.lists[cacheKey];
//  }
//  static costMatrix(roomName: string, key: string, callback: () => CostMatrix,
//    timeout = SHORT_CACHE_TIMEOUT): CostMatrix {
//    let cacheKey = roomName + ':' + key;
//    if (_cache.costMatrices[cacheKey] == undefined || Game.time > _cache.expiration[cacheKey]) {
//      // Recache if new entry or entry is expired
//      _cache.costMatrices[cacheKey] = callback();
//      _cache.expiration[cacheKey] = getCacheExpiration(timeout, Math.ceil(timeout / 10));
//    }
//    return _cache.costMatrices[cacheKey];
//  }
//  static costMatrixRecall(roomName: string, key: string): CostMatrix | undefined {
//    let cacheKey = roomName + ':' + key;
//    return _cache.costMatrices[cacheKey];
//  }
//  static set<T extends HasRef, K extends keyof T>(thing: T, key: K,
//    callback: () => (T[K] & (undefined | HasID | HasID[])),
//    timeout = CACHE_TIMEOUT) {
//    let cacheKey = thing.ref + '$' + key;
//    if (!_cache.things[cacheKey] || Game.time > _cache.expiration[cacheKey]) {
//      // Recache if new entry or entry is expired
//      _cache.things[cacheKey] = callback();
//      _cache.expiration[cacheKey] = getCacheExpiration(timeout, Math.ceil(timeout / 10));
//    } else {
//      // Refresh structure list by ID if not already done on current tick
//      if (_cache.accessed[cacheKey] < Game.time) {
//        if (_.isArray(_cache.things[cacheKey])) {
//          _cache.things[cacheKey] = _.compact(_.map(_cache.things[cacheKey] as HasID[],
//            s => Game.getObjectById(s.id))) as HasID[];
//        } else {
//          _cache.things[cacheKey] = Game.getObjectById((<HasID>_cache.things[cacheKey]).id) as HasID;
//        }
//        _cache.accessed[cacheKey] = Game.time;
//      }
//    }
//    thing[key] = _cache.things[cacheKey] as T[K] & (undefined | HasID | HasID[]);
//  }
//}

//import { StructureTaskRequest } from "tasks/StructureTaskRequest";
var MemoryVersion = 0;
var OwnerName = "KeyserSoze";
var initialized = false;
function memoryInit() {
    console.log("Initializing Game");
    delete Memory.flags;
    delete Memory.spawns;
    delete Memory.creeps;
    delete Memory.rooms;
    var mem = Memory;
    mem.owner = OwnerName;
    mem.creeps = {};
    mem.rooms = {};
    mem.spawns = {};
    mem.flags = {};
    mem.scoutTargets = [];
    mem.creepTasks = {};
    mem.structureTasks = {};
    mem.uuid = getTotalCreepCount();
    mem.memVersion = MemoryVersion;
}
function InitializeGame() {
    if (Memory.memVersion === undefined ||
        Memory.memVersion !== MemoryVersion ||
        (Memory.memVersion == 0 && !initialized)) {
        memoryInit();
        initialized = true;
    }
    if (!Memory.uuid || Memory.uuid > 10000) {
        Memory.uuid = getTotalCreepCount();
    }
    InitializeRoomMemory();
}
function InitializeRoomMemory() {
    for (var i in Game.rooms) {
        var room = Game.rooms[i];
        var roomMemory = Memory.rooms[room.name];
        if (roomMemory === undefined || roomMemory.initialized === false) {
            initRoomMemory(room.name);
            //roomMemory = Memory.rooms[room.name];
        }
    }
}
function initRoomMemory(roomName) {
    var room = Game.rooms[roomName];
    var rm = Memory.rooms[room.name];
    console.log("Init room memory for " + room.name + ".");
    rm = {};
    rm.structures = {};
    rm.activeResourcePileIDs = [];
    rm.settingsMap = SetupRoomSettings(roomName);
    //let start = Game.cpu.getUsed()
    var s = new Search2();
    rm.baseEntranceRamparts = s.findEntrances(roomName, "rampart");
    rm.baseEntranceWalls = s.findEntrances(roomName, "constructedWall");
    //console.log("CPU USAGE: " + (Game.cpu.getUsed() - start))
    rm.initialized = true;
    Memory.rooms[room.name] = rm;
}
function SetupRoomSettings(roomName) {
    var settingsMap = {};
    var level1Settings = new RoomSettings(roomName);
    level1Settings.minersPerSource = 2;
    level1Settings.maxWorkerCount = 2;
    level1Settings.maxUpgraderCount = 1;
    settingsMap[1] = level1Settings;
    var level2Settings = new RoomSettings(roomName);
    level2Settings.minersPerSource = 2;
    level2Settings.maxUpgraderCount = 4;
    level2Settings.maxWorkerCount = 3;
    settingsMap[2] = level2Settings;
    var level3Settings = new RoomSettings(roomName);
    level3Settings.minersPerSource = 1;
    level3Settings.maxCarrierCount = 2;
    level3Settings.maxUpgraderCount = 1;
    settingsMap[3] = level3Settings;
    var level4Settings = new RoomSettings(roomName);
    level4Settings.minersPerSource = 1;
    level4Settings.maxCarrierCount = 2;
    level4Settings.maxUpgraderCount = 1;
    settingsMap[4] = level4Settings;
    var level5Settings = new RoomSettings(roomName);
    level5Settings.minersPerSource = 1;
    level5Settings.maxCarrierCount = 1;
    level5Settings.maxUpgraderCount = 1;
    settingsMap[5] = level5Settings;
    return settingsMap;
}
function cleanupCreeps() {
    var _loop_1 = function (creepName) {
        if (!Game.creeps[creepName]) {
            console.log("Clearing dead creeps from memory.");
            for (var roomName in Game.rooms) {
                //let sources = <SourceMemory[]>_.filter(Game.rooms[roomName].memory.structures, s => {
                //  s.type == "source"
                //});
                _.forEach(roomManager.getSources2(roomName), function (source) {
                    console.log(source.assignedTo);
                    if (_.includes(source.assignedTo, creepName)) {
                        console.log("unassiging harvest spot for " + creepName + " source: " + source);
                        source.assignedTo = source.assignedTo.filter(function (s) { return s != creepName; });
                    }
                });
            }
            delete Memory.creeps[creepName];
        }
    };
    for (var creepName in Memory.creeps) {
        _loop_1(creepName);
    }
}
var RoomSettings = /** @class */ (function () {
    function RoomSettings(roomName) {
        this.minimumWorkerCount = 1;
        this.minersPerSource = 2;
        this.minimumCarrierCount = 1;
        this.maxCarrierCount = 3;
        this.minimumMinerCount = 2;
        this.maxWorkerCount = 1;
        this.maxUpgraderCount = 3;
        this.roomName = roomName;
    }
    return RoomSettings;
}());

var CreepTaskQueue = /** @class */ (function () {
    function CreepTaskQueue() {
    }
    CreepTaskQueue.removeFinished = function () {
        var finished = _.filter(Memory.creepTasks, function (req) { return req.status == "FINISHED"; });
        for (var id in finished) {
            this.removeTask(id);
        }
    };
    CreepTaskQueue.addPendingRequest = function (request) {
        if (request == undefined) {
            console.log("In CreepTaskQueue.addPendingRequest, request was undefined");
            return;
        }
        if (Memory.creepTasks == undefined) {
            console.log("In CreepTaskQueue.addPendingRequest, creepTasks was undefined");
            return;
        }
        Memory.creepTasks[request.id] = request;
        //console.log("task added.")
        //console.log(Object.keys(Memory.creepTasks).length)
    };
    CreepTaskQueue.count = function (roomName, taskName, targetID, status, creepRole) {
        if (taskName === void 0) { taskName = ""; }
        if (targetID === void 0) { targetID = ""; }
        if (status === void 0) { status = "ANY"; }
        if (creepRole === void 0) { creepRole = "ROLE_ALL"; }
        return CreepTaskQueue.getTasks(roomName, taskName, targetID, status, creepRole).length;
    };
    CreepTaskQueue.getTasks = function (roomName, taskName, targetID, status, creepRole) {
        if (taskName === void 0) { taskName = ""; }
        if (targetID === void 0) { targetID = ""; }
        if (status === void 0) { status = "ANY"; }
        if (creepRole === void 0) { creepRole = "ROLE_ALL"; }
        var matchingRequests = _.filter(Memory.creepTasks, function (req) {
            return req.originatingRoomName == roomName &&
                (taskName == "" || req.name == taskName) &&
                (targetID == "" || targetID == req.targetID) &&
                (status == "ANY" || req.status == status) &&
                (creepRole == "ROLE_ALL" || _.includes(req.validRoles, creepRole));
        });
        return _.map(matchingRequests, function (request) { return request.id; });
    };
    CreepTaskQueue.activeTasks = function (roomName, taskName, targetID) {
        if (taskName === void 0) { taskName = ""; }
        if (targetID === void 0) { targetID = ""; }
        return _.filter(Memory.creepTasks, function (task) {
            return task.originatingRoomName == roomName &&
                task.status != "PENDING" &&
                task.status != "FINISHED" &&
                task.name == taskName || taskName == "" &&
                targetID == task.targetID || targetID == "";
        });
    };
    CreepTaskQueue.removeTask = function (id) {
        //console.log("Deleting task")
        var task = Memory.creepTasks[id];
        var creep = Game.getObjectById(task.assignedToID);
        if (creep != undefined && creep.memory.currentTask == id) {
            creep.memory.idle = true;
            creep.memory.currentTask = "";
        }
        delete Memory.creepTasks[id];
    };
    CreepTaskQueue.getTask = function (id) {
        var request = Memory.creepTasks[id];
        if (request == undefined) {
            console.log("ERROR: Invalid Task ID (CreepTaskQueue.getTask)");
        }
        return request;
    };
    CreepTaskQueue.assignRequest = function (creepName, originatingRoomName) {
        var creep = Game.creeps[creepName];
        if (creep == undefined) {
            console.log("ERROR: assignPendingRequest -> creep cannot be undefined!");
            return;
        }
        if (creep.spawning)
            return;
        if (creep == undefined)
            return;
        //console.log("Assiging task to " + creepName);
        var nextTaskID = CreepTaskQueue.getNextTaskID(creepName, originatingRoomName);
        if (nextTaskID == "")
            return;
        //console.log(JSON.stringify(Memory.creepTasks[nextTaskID]))
        //console.log("Next task ID: " + nextTaskID)
        var nextTask = Memory.creepTasks[nextTaskID];
        if (nextTask == undefined) {
            console.log("ERROR: assignPendingRequest -> nextTask cannot be undefined!");
            return;
        }
        creep.memory.idle = false;
        creep.memory.currentTask = nextTask.id;
        nextTask.assignedToID = creep.id;
        nextTask.status = "INIT";
    };
    CreepTaskQueue.getNextTaskID = function (creepName, originatingRoomName) {
        var creep = Game.creeps[creepName];
        var tasks = CreepTaskQueue.getTasks(originatingRoomName, "", "", "PENDING", creep.memory.role);
        if (tasks.length == 0)
            return "";
        var sortedByPriority = _.sortByAll(_.map(tasks, function (id) { return Memory.creepTasks[id]; }), [
            'priority',
            function (t) { return creep.pos.getRangeTo(Game.getObjectById(t.targetID)); }
        ]);
        //console.log(JSON.stringify(sortedByPriority));
        if (sortedByPriority.length == 0)
            return "";
        return sortedByPriority[0].id;
    };
    return CreepTaskQueue;
}());
//export class CreepTaskQueue {
//  static addPendingRequest(request: CreepTaskRequest): any {
//    var totalCurrent = CreepTaskQueue.totalCount(request.requestingRoomName, request.name);
//    if (totalCurrent < request.maxConcurrent) {
//      let roomMem = Game.rooms[request.requestingRoomName].memory as RoomMemory;
//      roomMem.pendingWorkerRequests.push(request);
//    }
//  }
//  static startPendingRequest(creepName: string, roomName: string): void {
//    let roomMem = Game.rooms[roomName].memory as RoomMemory;
//    if (roomMem.pendingWorkerRequests.length == 0) return;
//    const creep = Game.creeps[creepName] as Creep;
//    const mem = creep.memory as CreepMemory;
//    const validTasks = roomMem.pendingWorkerRequests.filter(r => _.includes(r.validRoles, mem.role));
//    if (validTasks.length == 0) return;
//    //console.log("valid: " + mem.role + " , " + validTasks[0].validRoles)
//    const sortedValidTasks = _.sortByAll(validTasks, ['priority', t => creep.pos.getRangeTo(Game.getObjectById(validTasks[0].targetID) as AnyStructure | Creep | RoomObject)]);
//    //let debug: string = ""
//    //for (const key in sortedValidTasks) {
//    //  let task = sortedValidTasks[key];
//    //  if (task != undefined) debug += task.priority + ", "
//    //}
//    //console.log("Debug: " + debug);
//    for (const key in sortedValidTasks)
//    {
//      if (sortedValidTasks.hasOwnProperty(key))
//      {
//        const task = sortedValidTasks[key];
//        var nextTask = _.find(roomMem.pendingWorkerRequests, task)
//        if (nextTask != undefined)
//        {
//          nextTask.assignedTo = creepName;
//          mem.idle = false;
//          mem.currentTask = nextTask.name;
//          roomMem.activeWorkerRequests[creepName] = nextTask;
//          _.remove(roomMem.pendingWorkerRequests, nextTask);
//          //console.log(JSON.stringify(nextTask))
//          nextTask.status = "INIT";
//          break;
//        }
//        else {
//          //console.log("ARGH!!!.")
//        }
//      }
//    }
//  }
//  static allActive(roomName: string): { [index: string]: CreepTaskRequest } {
//    let roomMem = Game.rooms[roomName].memory as RoomMemory;
//    return roomMem.activeWorkerRequests as { [index: string]: CreepTaskRequest };
//  }
//  static getActiveRequest(roomName: string, creepName: string): CreepTaskRequest | undefined {
//    let roomMem = Game.rooms[roomName].memory as RoomMemory;
//    var request = roomMem.activeWorkerRequests[creepName];
//    return request;
//  }
//  //}
//  //static getPendingRequest(roomName: string, creepName: string): CreepTaskRequest | undefined {
//  //  let roomMem = Game.rooms[roomName].memory as RoomMemory;
//  //  var request = roomMem.activeWorkerRequests[creepName];
//  //  return request;
//  //}
//  static totalCount(roomName: string, taskName: string = "") {
//    return CreepTaskQueue.activeCount(roomName, taskName)
//      + CreepTaskQueue.pendingCount(roomName, taskName)
//  }
//  static pendingCount(roomName: string, taskName: string = ""): number {
//    let roomMem = Game.rooms[roomName].memory as RoomMemory;
//    if (taskName == "") {
//      return roomMem.pendingWorkerRequests.length;
//    }
//    else {
//      let count = 0;
//      const tasks = roomMem.pendingWorkerRequests;
//      for (const id in tasks) {
//        const task = tasks[id];
//        if (task.name == taskName) count++;
//      }
//      return count;
//    }
//  }
//  static activeCountAllRooms(taskName: string): number {
//    var count: number = 0;
//    for (var i in Game.rooms) {
//      var room = Game.rooms[i];
//      if (room == undefined) continue;
//      count += this.activeCount(room.name, taskName);
//    }
//    return count;
//  }
//  static pendingCountAllRooms(taskName: string): number {
//    var count: number = 0;
//    for (var i in Game.rooms) {
//      var room = Game.rooms[i];
//      if (room == undefined) continue;
//      count += this.pendingCount(room.name, taskName);
//    }
//    return count;
//  }
//  static activeCount(roomName: string, taskName: string = ""): number {
//    let roomMem = Game.rooms[roomName].memory as RoomMemory;
//    var count: number = 0;
//    for (var i in roomMem.activeWorkerRequests) {
//      var request = roomMem.activeWorkerRequests[i];
//      if (request.name == taskName || taskName == "")
//        count++;
//    }
//    return count;
//    //return Object.keys(roomMem.activeWorkerRequests).length;
//  }
//  static active(roomName: string, taskName: string = "", targetID: string = ""): CreepTaskRequest[] {
//    let room = Game.rooms[roomName];
//    if (room == undefined) return [];
//    let roomMem = room.memory as RoomMemory;
//    var requests: CreepTaskRequest[] = [];
//    for (var i in roomMem.activeWorkerRequests) {
//      var request = roomMem.activeWorkerRequests[i];
//      if (taskName != "" && request.name != taskName) continue;
//      if (targetID != "" && request.targetID != targetID) continue;
//      requests.push(request);
//    }
//    return requests;
//  }
//  static pending(roomName: string, taskName: string = "", targetID: string = ""): CreepTaskRequest[] {
//    let room = Game.rooms[roomName];
//    if (room == undefined) return [];
//    let roomMem = room.memory as RoomMemory;
//    var requests: CreepTaskRequest[] = [];
//    for (var i in roomMem.pendingWorkerRequests) {
//      var request = roomMem.pendingWorkerRequests[i];
//      if (taskName != "" && request.name != taskName) continue;
//      if (targetID != "" && request.targetID != targetID) continue;
//      requests.push(request);
//    }
//    return requests;
//    //return Object.keys(roomMem.activeWorkerRequests).length;
//  }
//}

var StructureTaskQueue = /** @class */ (function () {
    function StructureTaskQueue() {
    }
    StructureTaskQueue.removeTask = function (id) {
        delete Memory.structureTasks[id];
    };
    StructureTaskQueue.addPendingRequest = function (request) {
        if (request == undefined) {
            console.log("In StructureTaskQueue.addPendingRequest, request was undefined");
            return;
        }
        if (Memory.structureTasks == undefined) {
            console.log("In StructureTaskQueue.addPendingRequest, creepTasks was undefined");
            return;
        }
        Memory.structureTasks[request.id] = request;
    };
    StructureTaskQueue.count = function (roomName, taskName, status, structureType) {
        if (taskName === void 0) { taskName = ""; }
        if (status === void 0) { status = "ANY"; }
        if (structureType === void 0) { structureType = undefined; }
        return StructureTaskQueue.getTasks(roomName, taskName, status, structureType).length;
    };
    StructureTaskQueue.getTasks = function (roomName, taskName, status, structureType) {
        if (taskName === void 0) { taskName = ""; }
        if (status === void 0) { status = "ANY"; }
        if (structureType === void 0) { structureType = undefined; }
        var matchingRequests = _.filter(Memory.structureTasks, function (req) {
            return req.originatingRoomName == roomName &&
                (taskName == "" || req.name == taskName) &&
                (status == "ANY" || req.status == status) &&
                (structureType == undefined || _.includes(req.validStructureTypes, structureType));
        });
        return _.map(matchingRequests, function (request) { return request.id; });
    };
    StructureTaskQueue.activeTasks = function (roomName, taskName, targetID) {
        if (taskName === void 0) { taskName = ""; }
        if (targetID === void 0) { targetID = ""; }
        return _.filter(Memory.structureTasks, function (task) {
            return task.originatingRoomName == roomName &&
                task.status != "PENDING" && task.status != "FINISHED" &&
                task.name == taskName || taskName == "" &&
                targetID == task.targetID || targetID == "";
        });
    };
    StructureTaskQueue.getTask = function (id) {
        var request = Memory.structureTasks[id];
        if (request == undefined) {
            console.log("ERROR: Invalid Task ID (StructureTaskQueue.getTask)");
        }
        return request;
    };
    StructureTaskQueue.assignRequest = function (structureID, originatingRoomName) {
        var room = Memory.rooms[originatingRoomName];
        if (room == undefined)
            return;
        var structure = room.structures[structureID];
        if (structure == undefined) {
            console.log("ERROR: assignPendingRequest -> structure cannot be undefined!");
            return;
        }
        var nextTaskID = StructureTaskQueue.getNextTaskID(structureID, originatingRoomName);
        ////console.log(`Next Task ID: ${nextTaskID}`)
        if (nextTaskID == "")
            return;
        var nextTask = Memory.structureTasks[nextTaskID];
        if (nextTask == undefined) {
            console.log("ERROR: assignPendingRequest -> nextTask cannot be undefined!");
            return;
        }
        nextTask.assignedToID = structure.id;
        nextTask.status = "INIT";
        //console.log(`Next task ${nextTask.name} assigned to ${structure.structureType} - ${structure.id}`);
    };
    StructureTaskQueue.getNextTaskID = function (structureID, originatingRoomName) {
        //const structure = <OwnedStructure>Game.getObjectById(structureID);
        var room = Game.rooms[originatingRoomName];
        var structure = room.memory.structures[structureID];
        var tasks = StructureTaskQueue.getTasks(originatingRoomName, "", "PENDING", structure.type);
        if (tasks.length == 0)
            return "";
        var sortedByPriority = _.sortByAll(_.map(tasks, function (id) { return Memory.structureTasks[id]; }), [
            'priority',
        ]);
        if (sortedByPriority.length == 0)
            return "";
        return sortedByPriority[0].id;
    };
    return StructureTaskQueue;
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

var Task = /** @class */ (function () {
    function Task(taskInfo) {
        this.request = taskInfo;
    }
    Task.prototype.run = function () {
        var oldStatus = this.request.status;
        switch (this.request.status) {
            case "INIT":
                this.init();
                break;
            case "PREPARE":
                this.prepare();
                break;
            case "IN_PROGRESS":
                this.work();
                break;
            case "WIND_DOWN":
                this.windDown();
                break;
            case "FINISHED":
                this.finish();
                break;
        }
        if (this.request != null && oldStatus != this.request.status)
            this.run();
    };
    return Task;
}());

var CreepTask = /** @class */ (function (_super) {
    __extends(CreepTask, _super);
    function CreepTask(request) {
        var _this = _super.call(this, request) || this;
        _this.creepSayDelay = 5;
        _this.request = request;
        _this.creep = Game.getObjectById(_this.request.assignedToID);
        return _this;
    }
    CreepTask.prototype.init = function () {
        if (this.creep == undefined || this.creep.memory == undefined || this.creep == null) {
            this.request.status == "FINISHED";
            return;
        }
        else if (Game.time % this.creepSayDelay == 0)
            this.creep.say("" + this.request.wingDing);
    };
    CreepTask.prototype.prepare = function () {
        if (this.creep == undefined || this.creep.memory == undefined || this.creep == null) {
            this.request.status = "FINISHED";
            return;
        }
        if (Game.time % this.creepSayDelay == 0)
            this.creep.say("" + this.request.wingDing);
        if (this.creep.room.name != this.request.targetRoomName) {
            this.creep.travelTo(new RoomPosition(25, 25, this.request.targetRoomName));
        }
    };
    CreepTask.prototype.work = function () {
        if (this.creep == undefined || this.creep.memory == undefined || this.creep == null) {
            this.request.status = "FINISHED";
            return;
        }
        if (this.creep.room.name != this.request.targetRoomName) {
            this.request.status = "IN_PROGRESS";
            return;
        }
        if (Game.time % 5 == 0)
            this.creep.say("" + this.request.wingDing);
    };
    CreepTask.prototype.windDown = function () {
        if (this.creep == undefined || this.creep.memory == undefined || this.creep == null) {
            this.request.status = "FINISHED";
            return;
        }
        if (Game.time % 5 == 0)
            this.creep.say("" + this.request.wingDing);
    };
    CreepTask.prototype.finish = function () {
        if (this.creep != undefined && this.creep.memory != undefined) {
            this.creep.memory.idle = true;
            this.creep.memory.currentTask = "";
            //this.creep.say("✔")
        }
    };
    CreepTask.prototype.collectFromMasterLink = function (roomName) {
        var room = Game.rooms[roomName];
        if (room == undefined)
            return false;
        //const links = utils.findStructures<LinkMemory>(roomName, "link");
        var links = roomManager.getLinks2(roomName);
        var masterLinkID = _.find(links, function (linkMem) { return linkMem.linkMode == "MASTER_RECEIVE"; });
        if (masterLinkID == undefined)
            return false;
        var link = Game.getObjectById(masterLinkID.id);
        if (link.energy < link.energyCapacity / 2)
            return false;
        var result = this.creep.withdraw(link, RESOURCE_ENERGY);
        if (result == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(link);
        }
        return true;
    };
    CreepTask.prototype.collectFromDroppedEnergy = function (roomName) {
        var _this = this;
        var room = Game.rooms[roomName];
        if (room == undefined)
            return false;
        var resourcePileIDs = room.memory.activeResourcePileIDs
            .map(function (s) { return Game.getObjectById(s); })
            .filter(function (ss) { return ss.amount > 300; });
        if (resourcePileIDs.length == 0)
            return false;
        var sortedByRange = _.sortBy(resourcePileIDs, function (s) { return s.amount / _this.creep.pos.getRangeTo(s.pos); }).reverse();
        var closest = _.first(sortedByRange);
        var result = this.creep.pickup(closest);
        if (result == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(closest);
        }
        return true;
    };
    CreepTask.prototype.collectFromContainer = function (roomName) {
        var _this = this;
        var room = Game.rooms[roomName];
        var containers = roomManager.getContainers2(roomName);
        //console.log(JSON.stringify(containers));
        var filtered = _.filter(containers, function (c) {
            return _.includes(c.allowedWithdrawRoles, _this.creep.memory.role)
                && Game.getObjectById(c.id).store.energy > (_this.creep.carryCapacity - _this.creep.carry.energy) * .25;
        });
        var rangeToTarget = Game.getObjectById(this.creep.id);
        if (rangeToTarget == undefined)
            throw new Error("findContainers:rangeToTarget cannot be undefined");
        var sorted = _.sortBy(filtered, function (c) { return c.pos.getRangeTo(rangeToTarget); });
        var closest = _.first(sorted);
        if (sorted.length == 0)
            return false;
        //const closestContainerID = utils.findClosestContainerID(roomName, this.creep.memory.role, (this.creep.carryCapacity - this.creep.carry.energy) * .25, this.creep.id)
        //if (closestContainerID == undefined) return false;
        var container = Game.getObjectById(closest.id);
        var result = this.creep.withdraw(container, RESOURCE_ENERGY);
        if (result == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(container);
        }
        return true;
    };
    CreepTask.prototype.collectFromStorage = function (roomName) {
        var room = Game.rooms[roomName];
        if (room == undefined)
            return false;
        if (room.storage == undefined || room.storage.store.energy < 10000)
            return false;
        var result = this.creep.withdraw(room.storage, RESOURCE_ENERGY);
        if (result == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(room.storage);
        }
        return true;
    };
    CreepTask.prototype.collectFromTombstone = function (roomName) {
        var _this = this;
        var room = Game.rooms[roomName];
        if (room == undefined)
            return false;
        var tombstones = room.find(FIND_TOMBSTONES).filter(function (t) { return Object.keys(t.store).length > 1 || t.store.energy > 0; });
        if (tombstones.length == 0)
            return false;
        var byRange = _.sortBy(tombstones, function (t) { return _this.creep.pos.getRangeTo(t); });
        var tombstone = _.first(byRange);
        var result = this.creep.withdraw(tombstone, _.findKey(tombstone.store));
        if (result == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(tombstone);
        }
        return true;
    };
    CreepTask.prototype.collectFromSource = function (roomName) {
        var room = Game.rooms[roomName];
        if (room == undefined)
            return false;
        var closestSourceID = findClosestSourceID(roomName, this.creep.pos, 0);
        if (closestSourceID == undefined)
            return false;
        var source = Game.getObjectById(closestSourceID);
        var result = this.creep.harvest(source);
        if (result == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(source);
        }
        return true;
    };
    return CreepTask;
}(Task));

var CreepTaskRequest = /** @class */ (function () {
    function CreepTaskRequest(originatingRoomName, targetRoomName, targetID, wingDing) {
        this.status = "PENDING";
        this.category = "CREEP";
        this.originatingRoomName = "";
        this.assignedToID = "";
        this.targetRoomName = targetRoomName;
        this.targetID = targetID;
        this.originatingRoomName = originatingRoomName;
        this.wingDing = wingDing;
        this.status = "PENDING";
        this.id = uniqueID();
    }
    return CreepTaskRequest;
}());
//export abstract class CreepTaskRequest implements ITaskRequest {
//  status: TaskStatus;
//  wingDing: string;
//  isCreepTask: boolean = true;
//  targetID: string;
//  abstract name: string;
//  requestingRoomName: string;
//  targetRoomName: string;
//  assignedTo: string = "";
//  abstract priority: number;
//  abstract validRoles: CreepRole[];
//  abstract maxConcurrent: number;
//  constructor(roomName: string, wingDing: string, targetID: string = "", targetRoomName: string = "") {
//    this.targetRoomName = targetRoomName == "" ? roomName : targetRoomName;
//    this.targetID = targetID;
//    this.requestingRoomName = roomName;
//    this.wingDing = wingDing;
//    this.status = "PENDING"
//  }
//}

var BuildRequest = /** @class */ (function (_super) {
    __extends(BuildRequest, _super);
    function BuildRequest(originatingRoomName, targetRoomName, siteID) {
        var _this = _super.call(this, originatingRoomName, targetRoomName, siteID, "\uD83D\uDEA7") || this;
        _this.priority = 1;
        _this.validRoles = ["ROLE_WORKER", "ROLE_REMOTE_UPGRADER"];
        _this.name = "Build";
        _this.maxConcurrent = 5;
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
        this.request.status = "PREPARE";
    };
    Build.prototype.prepare = function () {
        _super.prototype.prepare.call(this);
        if (this.request.status == "FINISHED")
            return;
        var info = this.request;
        var site = Game.getObjectById(info.targetID);
        if (this.creep.carry.energy == this.creep.carryCapacity) {
            this.request.status = "IN_PROGRESS";
            return;
        }
        if (site == null || site.progressTotal - site.progress == 0) {
            this.request.status = "FINISHED";
            return;
        }
        var progressLeft = site.progressTotal - site.progress;
        if (this.creep.carry.energy < progressLeft) {
            var roomName = this.request.originatingRoomName;
            if (this.collectFromTombstone(roomName))
                return;
            if (this.collectFromDroppedEnergy(roomName))
                return;
            if (this.collectFromStorage(roomName))
                return;
            if (this.collectFromSource(roomName))
                return;
        }
        else
            this.request.status = "IN_PROGRESS";
    };
    Build.prototype.work = function () {
        _super.prototype.work.call(this);
        if (this.request.status == "FINISHED")
            return;
        //const creep = Game.creeps[this.request.assignedTo];
        var site = Game.getObjectById(this.request.targetID);
        if (site == null || site.progressTotal - site.progress == 0) {
            this.request.status = "FINISHED";
            return;
        }
        var result = this.creep.build(site);
        if (result == ERR_NOT_IN_RANGE) {
            Traveler.travelTo(this.creep, site);
        }
        else if (this.creep.carry.energy == 0) {
            this.request.status = "PREPARE";
        }
    };
    Build.addRequests = function (roomName) {
        for (var name in Game.rooms) {
            var sites = Game.rooms[name].find(FIND_CONSTRUCTION_SITES);
            var sorted = _.sortBy(sites, function (s) { return s.progress; }).reverse();
            _.each(sorted, function (site) {
                if (site.progressTotal > 0) {
                    if (CreepTaskQueue.count(roomName, "Build", site.id) == 0)
                        CreepTaskQueue.addPendingRequest(new BuildRequest(roomName, site.pos.roomName, site.id));
                }
            });
        }
    };
    Build.taskName = "Build";
    return Build;
}(CreepTask));

var MineRequest = /** @class */ (function (_super) {
    __extends(MineRequest, _super);
    //source: SmartSource;
    function MineRequest(originatingRoomName, targetRoomName, sourceID) {
        var _this = _super.call(this, originatingRoomName, targetRoomName, sourceID, "\uD83D\uDCB2") || this;
        _this.priority = 1;
        _this.validRoles = ["ROLE_MINER"];
        _this.name = "Mine";
        //console.log("source id in mine req ctor: " + sourceID)
        var source = Game.getObjectById(sourceID);
        //const source = roomMem.sources[sourceID] as SmartSource;
        //this.source = _.find(roomMem.harvestLocations, h => h.sourceID == sourceID) as SmartSource;
        if (source == undefined)
            console.log("You cant init a mine request with an undefined source.");
        //console.log("after finding source: " + this.source.sourceID)
        var minerCount = creepCount(targetRoomName, "ROLE_MINER");
        _this.maxConcurrent = minerCount;
        return _this;
        //console.log("max concurrent: " + this.maxConcurrent)
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
        //const source = Game.getObjectById(this.request.targetID) as Source;
        this.request.status = "PREPARE";
    };
    Mine.prototype.prepare = function () {
        var _this = this;
        _super.prototype.prepare.call(this);
        if (this.request.status != "PREPARE")
            return;
        if (this.creep.room.name != this.request.targetRoomName)
            return;
        var sources = roomManager.getSources2(this.request.targetRoomName);
        var source = _.find(sources, function (s) { return s.id == _this.request.targetID; });
        var source2 = Game.rooms[this.request.targetRoomName].memory.structures[this.request.targetID];
        source.assignedTo.push(this.creep.name);
        source2.assignedTo.push(this.creep.name);
        console.log("mine init assigned to " + source.assignedTo);
        this.request.status = "IN_PROGRESS";
    };
    Mine.prototype.work = function () {
        _super.prototype.work.call(this);
        if (this.request.status != "IN_PROGRESS")
            return;
        if (this.creep.carryCapacity == 0) {
            this.harvest();
        }
        else {
            if (this.creep.carry.energy >= this.creep.carryCapacity - 10)
                this.deliver();
            else
                this.harvest();
        }
        //else(this.creep.drop(RESOURCE_ENERGY))
    };
    Mine.prototype.finish = function () {
        _super.prototype.finish.call(this);
    };
    Mine.addRequests = function (roomName) {
        var room = Game.rooms[roomName];
        //const unassigned = _.filter(mem.harvestLocations, h => h.assignedTo === null) as SmartSource[];
        if (room == undefined)
            return;
        //if (unassigned.length === 0) return;
        var minersPerSource = 1;
        if (getRoomEnergyLevel(roomName) < 3) {
            minersPerSource = 2;
        }
        //var sources = room.find(FIND_SOURCES) as Source[];
        var originatingRoomName = "";
        var targetRoomName = "";
        if (room.controller == undefined || !room.controller.my) {
            originatingRoomName = closestOwnedRoom(room.name);
        }
        else {
            originatingRoomName = roomName;
        }
        targetRoomName = roomName;
        //const sources = utils.findStructures<SourceMemory>(roomName, "source");
        _.forEach(roomManager.getSources2(roomName), function (source) {
            //console.log(JSON.stringify(source))
            //console.log(`AssignedTo: ${source.assignedTo.length}, minersPer: ${minersPerSource}`);
            if (source.assignedTo.length != minersPerSource) {
                var needed = minersPerSource - source.assignedTo.length;
                //console.log("Needed: " + needed);
                for (var i = 0; i < needed; i++) {
                    var request = new MineRequest(originatingRoomName, targetRoomName, source.id);
                    var totalCurrent = CreepTaskQueue.count(request.targetRoomName, request.name);
                    //console.log("total current:" + totalCurrent)
                    if (totalCurrent < request.maxConcurrent) {
                        //console.log("about to add source for this id: " + smartSource.sourceID)
                        CreepTaskQueue.addPendingRequest(request);
                    }
                }
            }
        });
    };
    Mine.prototype.harvest = function () {
        var source = Game.getObjectById(this.request.targetID);
        //creep.say("moving")
        if (this.creep.harvest(source) == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(source);
        }
    };
    Mine.prototype.deliver = function () {
        var _this = this;
        var room = Game.rooms[this.request.targetRoomName];
        //const source = Game.getObjectById(this.request.targetID) as Source;
        var sources = roomManager.getSources2(this.request.targetRoomName);
        var source = _.find(sources, function (s) { return s.id == _this.request.targetID; });
        if (source == undefined) {
            console.log("ERROR:Mine::deliver -> source was undefined...");
            return;
        }
        //const source = <SourceMemory>room.memory.structures[this.request.targetID];
        //var smartSource = roomMemory.sources[this.request.targetID];
        //if (room.name == "W5S43") {
        //  console.log("smartsource id:" + smartSource.linkID)
        //}
        if (source.linkID != "") {
            var link = Game.getObjectById(source.linkID);
            if (this.creep.transfer(link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.creep.travelTo(link);
            }
        }
        else if (source.containerID != "") {
            var containers = roomManager.getContainers2(this.request.targetRoomName);
            var container = _.find(containers, function (c) { return c.id == source.containerID; });
            if (container == undefined) {
                console.log("ERROR:Mine::deliver -> container was undefined...");
                return;
            }
            var c = Game.getObjectById(container.id);
            var result = this.creep.transfer(c, RESOURCE_ENERGY);
            if (result == ERR_NOT_IN_RANGE) {
                this.creep.travelTo(container);
            }
            else if (result == ERR_FULL) {
                this.creep.drop(RESOURCE_ENERGY);
            }
        }
        else {
            this.creep.drop(RESOURCE_ENERGY);
        }
    };
    Mine.taskName = "Dismantle";
    return Mine;
}(CreepTask));

var PickUpEnergyRequest = /** @class */ (function (_super) {
    __extends(PickUpEnergyRequest, _super);
    function PickUpEnergyRequest(roomName, resourceID, resourceType) {
        var _this = _super.call(this, roomName, roomName, resourceID, "😍") || this;
        _this.priority = 0;
        _this.name = "PickupEnergy";
        _this.validRoles = ["ROLE_WORKER"];
        _this.maxConcurrent = 2;
        _this.resourceType = resourceType;
        return _this;
    }
    return PickUpEnergyRequest;
}(CreepTaskRequest));
var PickupEnergy = /** @class */ (function (_super) {
    __extends(PickupEnergy, _super);
    function PickupEnergy(taskInfo) {
        return _super.call(this, taskInfo) || this;
    }
    PickupEnergy.prototype.init = function () {
        _super.prototype.init.call(this);
        //console.log("mine init assigned to " + this.request.assignedTo)
        this.request.status = "PREPARE";
    };
    PickupEnergy.prototype.prepare = function () {
        _super.prototype.prepare.call(this);
        if (this.request.status == "FINISHED")
            return;
        this.request.status = "IN_PROGRESS";
    };
    PickupEnergy.prototype.work = function () {
        var requestInfo = this.request;
        var resource = Game.getObjectById(this.request.targetID);
        if (resource == null) {
            this.request.status = "FINISHED";
            return;
        }
        if (requestInfo.resourceType == "tombstone") {
            var tombstone = resource;
            if (this.creep.withdraw(tombstone, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(tombstone);
            }
            else
                this.request.status = "FINISHED";
        }
        else if (requestInfo.resourceType == "resource") {
            var droppedResource = resource;
            if (this.creep.pickup(droppedResource) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(droppedResource);
            }
            else
                this.request.status = "FINISHED";
        }
    };
    PickupEnergy.addRequests = function (roomName) {
        var room = Game.rooms[roomName];
        var resources = room.find(FIND_DROPPED_RESOURCES);
        var tombstones = room.find(FIND_TOMBSTONES);
        var workers = creepNamesByRole(roomName, "ROLE_WORKER").filter(function (name) {
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
                //console.log("found a tombstone with energy")
                var ts = new PickUpEnergyRequest(roomName, tombstone.id, "resource");
                if (CreepTaskQueue.count(roomName, ts.name) < ts.maxConcurrent) {
                    CreepTaskQueue.addPendingRequest(ts);
                }
            }
        }
    };
    PickupEnergy.taskName = "PickupEnergy";
    return PickupEnergy;
}(CreepTask));

var DismantleRequest = /** @class */ (function (_super) {
    __extends(DismantleRequest, _super);
    function DismantleRequest(originatingRoomName, targetRoomName, siteID) {
        var _this = _super.call(this, originatingRoomName, targetRoomName, siteID, "\uD83D\uDEA72") || this;
        _this.priority = 1;
        _this.validRoles = ["ROLE_WORKER", "ROLE_DISMANTLER"];
        _this.name = "Dismantle";
        _this.maxConcurrent = 2;
        var obj = Game.getObjectById(siteID);
        _this.position = obj.pos;
        return _this;
    }
    return DismantleRequest;
}(CreepTaskRequest));
var Dismantle = /** @class */ (function (_super) {
    __extends(Dismantle, _super);
    function Dismantle(taskInfo) {
        return _super.call(this, taskInfo) || this;
    }
    Dismantle.prototype.init = function () {
        _super.prototype.init.call(this);
        this.request.status = "PREPARE";
    };
    Dismantle.prototype.prepare = function () {
        _super.prototype.prepare.call(this);
        this.request.status = "IN_PROGRESS";
    };
    Dismantle.prototype.work = function () {
        _super.prototype.work.call(this);
        if (this.request.status == "FINISHED")
            return;
        var specificRequest = this.request;
        var site = Game.getObjectById(this.request.targetID);
        if (site == null) {
            this.request.status = "FINISHED";
            var flag = _.first(Game.rooms[this.request.originatingRoomName]
                .lookForAt("flag", specificRequest.position.x, specificRequest.position.y)
                .filter(function (f) { return f.color == COLOR_YELLOW && f.secondaryColor == COLOR_YELLOW; }));
            flag.remove();
            return;
        }
        var result = this.creep.dismantle(site);
        if (result == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(site);
        }
        if (this.creep.carry.energy == this.creep.carryCapacity) {
            this.creep.drop(RESOURCE_ENERGY);
        }
    };
    Dismantle.addRequests = function (roomName) {
        var room = Game.rooms[roomName];
        var flags = _.filter(Game.flags, function (f) { return f.color == COLOR_YELLOW
            && f.secondaryColor == COLOR_YELLOW
            && f.pos.roomName == roomName; });
        if (flags.length == 0)
            return;
        _.forEach(flags, function (flag) {
            var targetRoomName = flag.pos.roomName;
            var originatingRoomName = "";
            if (room.controller == undefined || !room.controller.my) {
                originatingRoomName = closestOwnedRoom(targetRoomName);
            }
            else {
                originatingRoomName = roomName;
            }
            var test = room.lookForAt("structure", flag.pos.x, flag.pos.y);
            var structureType = flag.name.replace(/[0-9]/g, '');
            if (structureType == undefined)
                throw new Error("Structure type for flag was undefined");
            var dismantle = _.first(test.filter(function (t) { return t.structureType == structureType; }));
            CreepTaskQueue.addPendingRequest(new DismantleRequest(originatingRoomName, targetRoomName, dismantle.id));
            //if (Game.rooms[targetRoomName] == undefined) {
            //  //we need visibility to this room in order to add this request...
            //  // todo: we need a visibility manager to handle this
            //  originatingRoomName = Utils.closestOwnedRoom(targetRoomName);
            //  //Memory.scoutTargets.push(targetRoomName);
            //  //return;
            //}
            //else {
            //  originatingRoomName = Memory.rooms[roomName].homeRoom;
            //}
            //let originatingRoomName = flag.name;
            //if (Game.rooms[originatingRoomName] == undefined) {
            //  throw new Error("Originating room cannot be undefined.")
            //}
            //var req = new DismantleRequest(originatingRoomName,targetRoomName)
        });
        //for (var i in flags) {
        //  var flag = flags[i];
        //  var targetRoomName = flag
        //  var structureType = flag.name as StructureConstant;
        //  var test = room.lookForAt("structure", flag.pos.x, flag.pos.y);
        //  var dismantle = _.first(test.filter(t => t.structureType == structureType));
        //  if (dismantle == undefined) return;
        //  var request = new DismantleRequest(roomName, dismantle.id)
        //  if (CreepTaskQueue.count(roomName, request.name, request.targetID, "ACTIVE").length < 2) {
        //    CreepTaskQueue.addPendingRequest(request);
        //  }
        //}
    };
    Dismantle.taskName = "Dismantle";
    return Dismantle;
}(CreepTask));

var FillTowerRequest = /** @class */ (function (_super) {
    __extends(FillTowerRequest, _super);
    function FillTowerRequest(roomName, towerID) {
        var _this = _super.call(this, roomName, roomName, towerID, "\u2697") || this;
        _this.priority = 1;
        _this.validRoles = ["ROLE_CARRIER"];
        _this.name = "FillTower";
        _this.maxConcurrent = 1;
        return _this;
        //super(roomName, `⚗`, towerID);
    }
    FillTowerRequest.RefillThreshold = .75;
    return FillTowerRequest;
}(CreepTaskRequest));
var FillTower = /** @class */ (function (_super) {
    __extends(FillTower, _super);
    function FillTower(taskInfo) {
        return _super.call(this, taskInfo) || this;
    }
    FillTower.prototype.init = function () {
        _super.prototype.init.call(this);
        this.request.status = "PREPARE";
    };
    FillTower.prototype.prepare = function () {
        _super.prototype.prepare.call(this);
        if (this.request.status == "FINISHED")
            return;
        var room = Game.rooms[this.request.originatingRoomName];
        var roomMem = room.memory;
        if (this.creep.carry.energy == 0) {
            if (this.collectFromTombstone(room.name))
                return;
            else if (this.collectFromDroppedEnergy(room.name))
                return;
            else if (this.collectFromMasterLink(room.name))
                return;
            else if (this.collectFromStorage(room.name))
                return;
            else if (this.collectFromContainer(room.name))
                return;
            //this.collectFromSource(room.name);
        }
        else
            this.request.status = "IN_PROGRESS";
    };
    FillTower.prototype.work = function () {
        _super.prototype.work.call(this);
        if (this.request.status == "FINISHED")
            return;
        var tower = Game.getObjectById(this.request.targetID);
        if (tower.energy == tower.energyCapacity) {
            this.request.status = "FINISHED";
            return;
        }
        var result = this.creep.transfer(tower, RESOURCE_ENERGY);
        if (result == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(tower, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        else if (result == OK) {
            this.request.status = "FINISHED";
        }
    };
    FillTower.addRequests = function (roomName) {
        var room = Game.rooms[roomName];
        var towers = room.find(FIND_MY_STRUCTURES)
            .filter(function (t) { return t.structureType == "tower"
            && t.energy < t.energyCapacity * FillTowerRequest.RefillThreshold; });
        var sorted = towers.sort(function (a, b) { return a.energy - b.energy; });
        //console.log("sorted" + sorted.map(s => s.energy))
        for (var id in sorted) {
            var tower = sorted[id];
            var request = new FillTowerRequest(roomName, tower.id);
            //if (CreepTaskQueue2.totalCount(roomName, request.name) < request.maxConcurrent) {
            if (CreepTaskQueue.count(roomName, request.name) < request.maxConcurrent) {
                CreepTaskQueue.addPendingRequest(request);
            }
        }
    };
    FillTower.taskName = "FillTower";
    return FillTower;
}(CreepTask));

var FillStorageRequest = /** @class */ (function (_super) {
    __extends(FillStorageRequest, _super);
    function FillStorageRequest(roomName, storageID) {
        var _this = _super.call(this, roomName, roomName, storageID, "\uD83D\uDCB0") || this;
        _this.priority = 4;
        _this.name = "FillStorage";
        _this.validRoles = ["ROLE_CARRIER"];
        _this.maxConcurrent = 1;
        return _this;
    }
    return FillStorageRequest;
}(CreepTaskRequest));
var FillStorage = /** @class */ (function (_super) {
    __extends(FillStorage, _super);
    function FillStorage(taskInfo) {
        var _this = _super.call(this, taskInfo) || this;
        _this.sources = [];
        return _this;
    }
    FillStorage.prototype.init = function () {
        _super.prototype.init.call(this);
        var fillStorage = this.request;
        //console.log("status after init" + Task.getStatus(this.request.status))
        this.request.status = "PREPARE";
    };
    FillStorage.prototype.prepare = function () {
        _super.prototype.prepare.call(this);
        if (this.request.status == "FINISHED")
            return;
        var restockInfo = this.request;
        var room = Game.rooms[this.request.targetRoomName];
        var roomMem = room.memory;
        //this.collectFromContainer(this.request.roomName, creep.id);
        //temp code...
        if (this.creep.carry.energy == 0) {
            if (this.collectFromDroppedEnergy(room.name))
                return;
            if (this.collectFromTombstone(room.name))
                return;
            if (this.collectFromMasterLink(room.name))
                return;
            if (this.collectFromContainer(room.name))
                return;
            //this.collectFromSource(room.name);
        }
        else {
            this.request.status = "IN_PROGRESS";
        }
    };
    FillStorage.prototype.work = function () {
        _super.prototype.work.call(this);
        if (this.request.status != "IN_PROGRESS")
            return;
        var storage = this.creep.room.storage;
        if (storage == undefined) {
            this.request.status = "FINISHED";
            return;
        }
        var result = this.creep.transfer(storage, _.findKey(this.creep.carry));
        //const target = sortedByRange[0]
        if (result == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(storage);
        }
        if (_.findKey(this.creep.carry) == undefined) {
            this.request.status = "FINISHED";
        }
        //let storages = creep.room.find(FIND_MY_STRUCTURES).filter(s => s.structureType == "storage") as StructureStorage[]
        //const sortedByRange = _.sortBy(storages, s => this.creep.pos.getRangeTo(s));
        //console.log("sorted ranges: " + JSON.stringify(sortedByRange))
        //if (sortedByRange.length == 0) {
        //this.request.status = "FINISHED";
        //}
        //else {
        //else if (result == OK) {
        //  this.request.status = "FINISHED";
        //}
        //else {
        //  this.request.status = "FINISHED";
        //}
        //}
    };
    FillStorage.addRequests = function (roomName) {
        var room = Game.rooms[roomName];
        var storages = room.find(FIND_MY_STRUCTURES).filter(function (s) { return s.structureType == "storage"; });
        var storage = room.storage;
        if (storage == undefined)
            return;
        var request = new FillStorageRequest(roomName, storage.id);
        var existingTaskCount = CreepTaskQueue.count(roomName, request.name);
        var maxConcurrentCount = request.maxConcurrent;
        if (existingTaskCount < maxConcurrentCount) {
            CreepTaskQueue.addPendingRequest(request);
        }
    };
    FillStorage.taskName = "FillStorage";
    return FillStorage;
}(CreepTask));

var FillContainersRequest = /** @class */ (function (_super) {
    __extends(FillContainersRequest, _super);
    function FillContainersRequest(roomName, targetRoomName, restockID) {
        var _this = _super.call(this, roomName, targetRoomName, restockID, "\uD83D\uDCB02") || this;
        _this.name = "FillContainers";
        _this.priority = 1;
        _this.validRoles = ["ROLE_CARRIER"];
        _this.maxConcurrent = 1;
        return _this;
    }
    return FillContainersRequest;
}(CreepTaskRequest));
var FillContainers = /** @class */ (function (_super) {
    __extends(FillContainers, _super);
    function FillContainers(taskInfo) {
        return _super.call(this, taskInfo) || this;
    }
    FillContainers.prototype.init = function () {
        _super.prototype.init.call(this);
        this.request.status = "PREPARE";
    };
    FillContainers.prototype.prepare = function () {
        _super.prototype.prepare.call(this);
        if (this.request.status != "PREPARE")
            return;
        //const restockInfo = this.request as FillStorageRequest;
        var room = Game.rooms[this.request.targetRoomName];
        if (this.creep.carry.energy == this.creep.carryCapacity) {
            this.request.status = "IN_PROGRESS";
            return;
        }
        this.fillup();
    };
    FillContainers.prototype.fillup = function () {
        var room = Game.rooms[this.request.originatingRoomName];
        if (this.collectFromTombstone(room.name))
            return;
        else if (this.collectFromDroppedEnergy(room.name))
            return;
        else if (this.collectFromMasterLink(room.name))
            return;
        else if (this.collectFromStorage(room.name))
            return;
        else if (this.collectFromContainer(room.name))
            return;
    };
    FillContainers.prototype.work = function () {
        _super.prototype.work.call(this);
        if (this.request.status != "IN_PROGRESS")
            return;
        //const creep = Game.creeps[this.request.assignedTo];
        var room = Game.rooms[this.request.targetRoomName];
        var cMem = _.find(roomManager.getContainers2(this.request.targetRoomName), function (c) {
            var container = Game.getObjectById(c.id);
            return container.store.energy < container.storeCapacity
                && c.shouldRefill;
        });
        if (cMem == undefined) {
            this.request.status = "FINISHED";
            return;
        }
        var container = Game.getObjectById(cMem.id);
        var result = this.creep.transfer(container, RESOURCE_ENERGY);
        if (result == ERR_NOT_IN_RANGE)
            this.creep.travelTo(container);
        else
            this.request.status = "FINISHED";
        //var container = Game.getObjectById(cMem.id);
        //let containersToFill = room.find(FIND_STRUCTURES)
        //  .filter(s => (s.structureType == "container"
        //    && s.store.energy < s.storeCapacity
        //    && s.shouldRefill));
        //if (containersToFill.length == 0) {
        //  this.request.status = "FINISHED";
        //  return;
        //}
        //const closest = _.first(_.sortBy(containersToFill, s => this.creep.pos.getRangeTo(s)))
        //const result = this.creep.transfer(closest, RESOURCE_ENERGY)
        //if (result == ERR_NOT_IN_RANGE) this.creep.travelTo(closest);
        //else this.request.status = "FINISHED";
    };
    FillContainers.addRequests = function (roomName) {
        var room = Game.rooms[roomName];
        var roomMem = room.memory;
        //let storages = room.find(FIND_MY_STRUCTURES).filter(s => s.structureType == "storage") as StructureStorage[];
        var containers = roomManager.getContainers2(roomName).filter(function (cm) {
            var cont = Game.getObjectById(cm.id);
            return cont.store.energy < cont.storeCapacity
                && cm.shouldRefill;
        });
        //let containersToFill = con
        //  .filter(s => (s.structureType == "container"
        //    && s.store.energy < s.storeCapacity
        //    && s.shouldRefill));
        if (containers.length == 0)
            return;
        //let workers = utils.creepNamesByRole(roomName,"ROLE_WORKER").filter(name => {
        //  const worker = Game.creeps[name] as Creep;
        //  return worker.carry.energy > 0;
        //})
        //if (workers.length == 0) return;
        var existingTaskCount = CreepTaskQueue.count(roomName, "FillContainers");
        var maxConcurrentCount = 1; //todo
        //for (var i = existingTaskCount; i < maxConcurrentCount;) {
        //  _.each(containersToFill, c => {
        //    CreepTaskQueue.addPendingRequest(new FillContainersRequest(roomName, roomName, c.id))
        //    i++;
        //  });
        //}
        _.forEach(containers, function (c) {
            var request = new FillContainersRequest(roomName, roomName, c.id);
            if (existingTaskCount < maxConcurrentCount) {
                CreepTaskQueue.addPendingRequest(request);
            }
        });
        //for (const targetID in containers) {
        //  let request = new FillContainersRequest(roomName, roomName, targetID);
        //  if (existingTaskCount < maxConcurrentCount) {
        //    CreepTaskQueue.addPendingRequest(request)
        //  }
        //}
    };
    FillContainers.taskName = "FillContainers";
    return FillContainers;
}(CreepTask));

//import { roomManager } from "RoomManager";
var UpgradeRequest = /** @class */ (function (_super) {
    __extends(UpgradeRequest, _super);
    function UpgradeRequest(roomName, targetRoomName, controllerID, maxPerRoom) {
        var _this = _super.call(this, roomName, targetRoomName, controllerID, "\uD83C\uDF87") || this;
        _this.validRoles = ["ROLE_UPGRADER"];
        _this.priority = 5;
        _this.name = "Upgrade";
        _this.maxConcurrent = maxPerRoom;
        return _this;
    }
    return UpgradeRequest;
}(CreepTaskRequest));
var Upgrade = /** @class */ (function (_super) {
    __extends(Upgrade, _super);
    function Upgrade(taskInfo) {
        return _super.call(this, taskInfo) || this;
    }
    Upgrade.prototype.init = function () {
        _super.prototype.init.call(this);
        if (this.request.status != "INIT")
            return;
        if (this.creep == null) {
            console.log("it happened...");
            this.request.status = "FINISHED";
            return;
        }
        var room = Game.rooms[this.request.originatingRoomName];
        if (room.controller === undefined)
            throw new Error("Room or Controller was undefined in upgrade...");
        if (this.creep.carry.energy < this.creep.carryCapacity)
            this.fillup(room.name);
        else
            this.request.status = "PREPARE";
    };
    Upgrade.prototype.prepare = function () {
        _super.prototype.prepare.call(this);
        if (this.request.status != "PREPARE")
            return;
        //we could be moving to target room.
        if (this.creep.room.name != this.request.targetRoomName)
            return;
        var room = Game.rooms[this.request.targetRoomName];
        if (room.controller === undefined)
            throw new Error("Room or Controller was undefined in upgrade...");
        if (this.creep.carry.energy < this.creep.carryCapacity)
            this.fillup(this.request.targetRoomName);
        else
            this.request.status = "IN_PROGRESS";
    };
    Upgrade.prototype.work = function () {
        _super.prototype.work.call(this);
        if (this.request.status != "IN_PROGRESS")
            return;
        if (this.creep.room.name != this.request.targetRoomName || this.creep.carry.energy == 0) {
            this.request.status = "PREPARE";
            return;
        }
        var controller = Game.getObjectById(this.request.targetID);
        if (controller.sign == undefined || controller.sign.username != "KeyserSoze") {
            var result = this.creep.signController(controller, "The greatest trick the devil ever pulled was convincing the world he did not exist.");
            if (result == ERR_NOT_IN_RANGE)
                this.creep.moveTo(controller);
        }
        if (this.creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
        }
    };
    Upgrade.prototype.fillup = function (roomName) {
        var room = Game.rooms[roomName];
        if (this.collectFromContainer(room.name))
            return;
        if (this.collectFromDroppedEnergy(room.name))
            return;
        if (this.collectFromTombstone(room.name))
            return;
        if (this.collectFromStorage(room.name))
            return;
        this.collectFromSource(room.name);
    };
    Upgrade.addRequests = function (roomName) {
        var controller = Game.rooms[roomName].controller;
        if (controller == undefined || !controller.my)
            return;
        var upgraderCount = creepCount(roomName, "ROLE_UPGRADER");
        if (controller == undefined || upgraderCount == 0)
            return;
        var tasksNeeded = upgraderCount - CreepTaskQueue.count(roomName, "Upgrade");
        for (var i = 0; i < tasksNeeded; i++) {
            CreepTaskQueue.addPendingRequest(new UpgradeRequest(roomName, roomName, controller.id, upgraderCount));
        }
    };
    Upgrade.taskName = "Upgrade";
    return Upgrade;
}(CreepTask));

var ScoutRequest = /** @class */ (function (_super) {
    __extends(ScoutRequest, _super);
    function ScoutRequest(originatingRoomName, targetRoomName, scoutMode) {
        var _this = _super.call(this, originatingRoomName, targetRoomName, targetRoomName, "\uD83D\uDC40") || this;
        _this.priority = 2;
        _this.validRoles = ["ROLE_SCOUT"];
        _this.name = "Scout";
        _this.scoutMode = scoutMode;
        return _this;
    }
    ScoutRequest.maxPerRoom = 1;
    return ScoutRequest;
}(CreepTaskRequest));
var Scout = /** @class */ (function (_super) {
    __extends(Scout, _super);
    function Scout(taskInfo) {
        return _super.call(this, taskInfo) || this;
    }
    Scout.prototype.init = function () {
        _super.prototype.init.call(this);
        this.request.status = "PREPARE";
    };
    Scout.prototype.prepare = function () {
        _super.prototype.prepare.call(this);
        if (this.request.status != "PREPARE")
            return;
        if (this.creep.room.name == this.request.targetRoomName) {
            this.request.status = "IN_PROGRESS";
        }
    };
    Scout.prototype.work = function () {
        _super.prototype.work.call(this);
        if (this.request.status != "IN_PROGRESS")
            return;
        var request = this.request;
        var controller = this.creep.room.controller;
        var result = 0;
        switch (request.scoutMode) {
            case "CLAIM":
                result = this.creep.claimController(controller);
                break;
            case "RESERVE":
                result = this.creep.reserveController(controller);
                break;
            case "SCOUT": result = OK; //TODO
        }
        if (result == ERR_NOT_IN_RANGE)
            this.creep.travelTo(controller);
    };
    Scout.addRequests = function (roomName) {
        var blueFlags = findFlags(undefined, COLOR_BLUE, roomName);
        if (blueFlags.length != 1)
            return;
        var scoutFlag = _.first(blueFlags);
        var originatingRoom = roomName;
        var targetRoomName = scoutFlag.pos.roomName;
        if (Game.rooms[originatingRoom] == undefined)
            throw Error("Originating room cannot be undefined... in Scout::addrequests");
        var currentActive = CreepTaskQueue.activeTasks(originatingRoom, "Scout", targetRoomName).length;
        var currentPending = CreepTaskQueue.count(originatingRoom, "Scout", targetRoomName, "PENDING");
        if (currentActive + currentPending >= 1)
            return;
        var scoutMode = scoutFlag.secondaryColor == COLOR_BLUE ? "CLAIM"
            : scoutFlag.secondaryColor == COLOR_WHITE ? "RESERVE"
                : "SCOUT";
        console.log("addin scout req");
        CreepTaskQueue.addPendingRequest(new ScoutRequest(originatingRoom, targetRoomName, scoutMode));
    };
    Scout.taskName = "Scout";
    return Scout;
}(CreepTask));
//export class ScoutRequest extends CreepTaskRequest {
//  priority: number = 2;
//  validRoles: CreepRole[] = ["ROLE_SCOUT"];
//  name = "Scout";
//  maxConcurrent = 3;
//  maxPerRoom = 1;
//  claiming: boolean = false;
//  reserving: boolean = false;
//  constructor(sourceRoomName: string, targetRoomName: string, claiming: boolean = false, reserving: boolean = false) {
//    super(sourceRoomName, `👀`, targetRoomName, targetRoomName);
//    this.claiming = claiming;
//    this.reserving = reserving;
//    this.targetID = targetRoomName;
//  }
//}
//export class Scout extends CreepTask {
//  protected init(): void {
//    super.init();
//    this.request.status = "PREPARE";
//  }
//  protected prepare(): void {
//    super.prepare();
//    if (this.request.status == "FINISHED") return;
//    //var scoutFlagID = this.request.targetID;
//    //var flags = Game.flags;
//    //var ourFlag = flags[scoutFlagID] as Flag;
//    //if (ourFlag == undefined) {
//    //  throw Error("Flag was undefined?")
//    //}
//    //var targetPos = ;
//    if (this.creep.room.name != this.request.targetRoomName) {
//      this.creep.travelTo(new RoomPosition(25, 25, this.request.targetRoomName));
//    }
//    else {
//      this.request.status = "IN_PROGRESS";
//    }
//  }
//  protected work(): void {
//    super.work();
//    if (this.request.status == "FINISHED") return;
//    const creep = Game.creeps[this.request.assignedTo];
//    var req = this.request as ScoutRequest;
//    //creep.say("got here!");
//    var controller = creep.room.controller as StructureController;
//    if (controller == undefined) throw new Error("Can't put a claim flag in a room w/o a controller... derp");
//    var result = req.claiming ? creep.claimController(controller)
//      : req.reserving ? creep.reserveController(controller)
//        : OK;
//    if (result == ERR_NOT_IN_RANGE) {
//      creep.moveTo(controller)
//    }
//  }
//  static addRequests(roomName: string): void {
//    //var room = Game.rooms[this.creep.room.name];
//    var flags = Game.flags;
//    for (var id in flags) {
//      var flag = flags[id] as Flag;
//      //blue/blue = scout, blue/white  = claim
//      if (flag.color == COLOR_BLUE) {
//        var targetRoomName = flag.pos.roomName;
//        var sourceRoomName = flag.name;
//        if (sourceRoomName != roomName) continue;
//        var request = new ScoutRequest(sourceRoomName, targetRoomName)
//        var currentActive = CreepTaskQueue.active(roomName, request.name, targetRoomName).length;
//        var currentPending = CreepTaskQueue.pending(roomName, request.name, targetRoomName).length;
//        //console.log("Current Scout task count for " + roomName + ": " + count)
//        if (currentActive + currentPending > 0) return;
//        if (flag.secondaryColor == COLOR_BLUE) {
//          request.claiming = true;
//          CreepTaskQueue.addPendingRequest(request);
//        }
//        else if (flag.secondaryColor == COLOR_WHITE) {
//          request.reserving = true;
//          CreepTaskQueue.addPendingRequest(request);
//        }
//      }
//    }
//  }
//  constructor(taskInfo: CreepTaskRequest) {
//    super(taskInfo);
//  }
//}

var RestockRequest = /** @class */ (function (_super) {
    __extends(RestockRequest, _super);
    function RestockRequest(roomName, restockID) {
        var _this = _super.call(this, roomName, roomName, restockID, "\uD83D\uDED2") || this;
        _this.priority = 0;
        _this.name = "Restock";
        _this.validRoles = ["ROLE_CARRIER", "ROLE_REMOTE_UPGRADER"];
        _this.maxConcurrent = 2;
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
        this.request.status = "PREPARE";
    };
    Restock.prototype.prepare = function () {
        var _this = this;
        _super.prototype.prepare.call(this);
        if (this.request.status != "PREPARE")
            return;
        var room = Game.rooms[this.request.targetRoomName];
        //var masterLink = _.find(room.memory.links, link => link.linkMode == "MASTER_RECEIVE");
        //var masterLink = _.find(room.memory.structures, s => s.type == "link" && (<LinkMemory>s).linkMode == "MASTER_RECEIVE");
        //var links = utils.findStructures<LinkMemory>(room.name, "link");
        var links = roomManager.getLinks2(this.request.targetRoomName);
        var masterLink = _.find(links, function (l) { return l.linkMode == "MASTER_RECEIVE"; });
        //this.collectFromContainer(this.request.roomName, creep.id);
        var targets = this.creep.room.find(FIND_STRUCTURES, {
            filter: function (structure) {
                return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                    structure.energy < structure.energyCapacity;
            }
        }).sort(function (structureA, structureB) { return _this.creep.pos.getRangeTo(structureA) - _this.creep.pos.getRangeTo(structureB); });
        //console.log("restock targets: " + targets.length);
        if (targets.length == 0) {
            this.request.status = "FINISHED";
            return;
        }
        //temp code...
        if (this.creep.carry.energy < this.creep.carryCapacity) {
            if (this.collectFromStorage(room.name))
                return;
            if (this.collectFromMasterLink(room.name))
                return;
            if (this.collectFromContainer(room.name))
                return;
            if (this.collectFromDroppedEnergy(room.name))
                return;
            if (this.collectFromTombstone(room.name))
                return;
            if (this.collectFromSource(room.name))
                return;
            //if (masterLink == undefined) {
            //  //console.log("collecting...")
            //  //if (this.collectFromStorage(room.name)) return;
            //  if (this.collectFromDroppedEnergy(room.name)) return;
            //  //console.log("no dropped energy...")
            //  if (this.collectFromTombstone(room.name)) return;
            //  else if (this.collectFromContainer(room.name)) return;
            //  else if (this.collectFromMasterLink(room.name)) return;
            //  else if (this.collectFromStorage(room.name)) return;
            //  else if (this.collectFromSource(room.name)) return;
            //  //this.collectFromDroppedEnergy(room.name);
            //  //this.collectFromTombstone(room.name);
            //  //this.collectFromSource(room.name);
            //}
            //else {
            //  if (this.collectFromDroppedEnergy(room.name)) return;
            //  //console.log("no dropped energy...")
            //  if (this.collectFromMasterLink(room.name)) return;
            //  if (this.collectFromTombstone(room.name)) return;
            //  if (this.collectFromContainer(room.name)) return;
            //  if (this.collectFromStorage(room.name)) return;
            //  if (this.collectFromSource(room.name)) return;
            //}
        }
        else {
            this.request.status = "IN_PROGRESS";
        }
    };
    Restock.prototype.work = function () {
        var _this = this;
        _super.prototype.work.call(this);
        if (this.request.status != "IN_PROGRESS")
            return;
        var targets = this.creep.room.find(FIND_STRUCTURES, {
            filter: function (structure) {
                return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                    structure.energy < structure.energyCapacity;
            }
        }).sort(function (structureA, structureB) { return _this.creep.pos.getRangeTo(structureA) - _this.creep.pos.getRangeTo(structureB); });
        if (targets.length == 0) {
            this.request.status = "FINISHED";
            return;
        }
        else {
            var result = this.creep.transfer(targets[0], RESOURCE_ENERGY);
            var target = targets[0];
            if (result == ERR_NOT_IN_RANGE) {
                this.creep.travelTo(target);
            }
            if (this.creep.carry.energy == 0)
                this.request.status = "FINISHED";
        }
    };
    Restock.addRequests = function (roomName) {
        var restockables = getRestockables(roomName);
        for (var targetID in restockables) {
            var restockable = restockables[targetID];
            var request = new RestockRequest(roomName, restockable.id);
            //if (energyLevel > 2) {
            //  request.validRoles = ["ROLE_CARRIER","ROLE_REMOTE_UPGRADER"]
            //}
            var existingTaskCount = CreepTaskQueue.count(roomName, request.name);
            var maxConcurrentCount = request.maxConcurrent;
            if (existingTaskCount < maxConcurrentCount) {
                CreepTaskQueue.addPendingRequest(request);
            }
        }
    };
    Restock.taskName = "Restock";
    return Restock;
}(CreepTask));

var StructureTaskRequest = /** @class */ (function () {
    //status: TaskStatus;
    //abstract name: string;
    //abstract priority: number;
    //targetID: string;
    //requestingRoomName: string;
    //targetRoomName: string;
    //assignedTo: string = "";
    //abstract maxConcurrent: number;
    //isCreepTask: boolean = false;
    function StructureTaskRequest(originatingRoomName, targetRoomName, targetID) {
        if (targetID === void 0) { targetID = ""; }
        this.status = "PENDING";
        this.category = "STRUCTURE";
        this.assignedToID = "";
        this.targetRoomName = targetRoomName;
        this.originatingRoomName = originatingRoomName;
        this.targetID = targetID;
        this.id = uniqueID();
    }
    return StructureTaskRequest;
}());
//export abstract class StructureTaskRequest implements ITaskRequest {
//  status: TaskStatus;
//  abstract name: string;
//  abstract priority: number;
//  targetID: string;
//  requestingRoomName: string;
//  targetRoomName: string;
//  assignedTo: string = "";
//  abstract maxConcurrent: number;
//  isCreepTask: boolean = false;
//  constructor(roomName: string, targetID: string = "", targetRoomstatic name: string = "") {
//    this.targetRoomName = targetRoomName == "" ? roomName : targetRoomName;
//    this.requestingRoomName = roomName;
//    this.targetID = targetID;
//    this.status = "PENDING"
//  }
//}

//import { StructureTaskRequest } from "./StructureTaskRequest";
var StructureTask = /** @class */ (function (_super) {
    __extends(StructureTask, _super);
    function StructureTask(request) {
        var _this = _super.call(this, request) || this;
        _this.request = request;
        _this.structureID = _this.request.assignedToID;
        _this.room = Game.rooms[_this.request.originatingRoomName];
        return _this;
    }
    StructureTask.prototype.init = function () {
        var building = Game.getObjectById(this.request.assignedToID);
        if (building == undefined) {
            this.request.status = "FINISHED";
            return;
        }
        //this.building = building;
    };
    StructureTask.prototype.prepare = function () {
        var building = Game.getObjectById(this.request.assignedToID);
        if (building == undefined || building == null) {
            console.log("building was null in prepare");
            this.request.status = "FINISHED";
        }
        //this.building = building;
    };
    StructureTask.prototype.work = function () {
        var building = Game.getObjectById(this.request.assignedToID);
        if (building == undefined || building == null) {
            console.log("building was null in continue");
            this.request.status = "FINISHED";
        }
        //this.building = building;
    };
    StructureTask.prototype.windDown = function () {
    };
    StructureTask.prototype.finish = function () {
        this.request.status = "FINISHED";
    };
    return StructureTask;
}(Task));

var TowerAttackRequest = /** @class */ (function (_super) {
    __extends(TowerAttackRequest, _super);
    function TowerAttackRequest(roomName, hostileID) {
        var _this = _super.call(this, roomName, roomName, hostileID) || this;
        _this.validStructureTypes = ["tower"];
        _this.priority = 0;
        _this.name = "TowerAttack";
        _this.maxConcurrent = 6;
        return _this;
    }
    return TowerAttackRequest;
}(StructureTaskRequest));
var TowerAttack = /** @class */ (function (_super) {
    __extends(TowerAttack, _super);
    function TowerAttack(request) {
        return _super.call(this, request) || this;
    }
    TowerAttack.prototype.init = function () {
        _super.prototype.init.call(this);
        var room = Game.rooms[this.request.originatingRoomName];
        var tower = room.memory.structures[this.request.assignedToID];
        tower.currentTask = TowerAttack.taskName + this.request.id;
        tower.towerMode = "ATTACK";
        this.request.status = "PREPARE";
    };
    TowerAttack.prototype.prepare = function () {
        _super.prototype.prepare.call(this);
        this.request.status = "IN_PROGRESS";
    };
    TowerAttack.prototype.work = function () {
        _super.prototype.work.call(this);
        if (this.request.status == "FINISHED")
            return;
        var attackRequest = this.request;
        var hostile = Game.getObjectById(attackRequest.targetID);
        var tower = Game.getObjectById(attackRequest.assignedToID);
        if (hostile == undefined || hostile.hits == 0) {
            this.request.status = "FINISHED";
            return;
        }
        var entrances = this.room.memory.baseEntranceRamparts.concat(this.room.memory.baseEntranceWalls);
        if (entrances.length > 0) {
            _.forEach(entrances, function (entrance) {
                var inRange = hostile.pos.inRangeTo(entrance.x, entrance.y, 3);
                if (inRange)
                    tower.attack(hostile);
            });
        }
        else {
            var inRange = hostile.pos.inRangeTo(tower, 30);
            if (inRange)
                tower.attack(hostile);
        }
    };
    TowerAttack.prototype.finish = function () {
        _super.prototype.finish.call(this);
        var tower = Game.rooms[this.request.originatingRoomName].memory.structures[this.request.assignedToID];
        tower.currentTask = "";
        tower.towerMode = "IDLE";
    };
    TowerAttack.addRequests = function (roomName) {
        var room = Game.rooms[roomName];
        var targets = room.find(FIND_HOSTILE_CREEPS);
        var sorted = _.sortBy(targets, function (t) { return t.hits; });
        var maxConcurrent = new TowerAttackRequest(roomName, "").maxConcurrent;
        var currentCount = StructureTaskQueue.count(roomName, this.taskName);
        if (sorted.length == 0)
            return;
        for (var i = currentCount; i < maxConcurrent;) {
            _.each(sorted, function (t) {
                StructureTaskQueue.addPendingRequest(new TowerAttackRequest(roomName, t.id));
                i++;
            });
        }
    };
    TowerAttack.taskName = "TowerAttack";
    return TowerAttack;
}(StructureTask));

var TowerRepairRequest = /** @class */ (function (_super) {
    __extends(TowerRepairRequest, _super);
    function TowerRepairRequest(roomName, siteID) {
        var _this = _super.call(this, roomName, roomName, siteID) || this;
        _this.validStructureTypes = ["tower"];
        _this.priority = 2;
        _this.name = "TowerRepair";
        _this.maxConcurrent = 3;
        return _this;
    }
    TowerRepairRequest.maxHitPoints = 120000;
    return TowerRepairRequest;
}(StructureTaskRequest));
var TowerRepair = /** @class */ (function (_super) {
    __extends(TowerRepair, _super);
    function TowerRepair(taskInfo) {
        return _super.call(this, taskInfo) || this;
    }
    TowerRepair.prototype.init = function () {
        _super.prototype.init.call(this);
        if (this.request.status != "INIT")
            return;
        //console.log("Repair INIT");
        var room = Game.rooms[this.request.originatingRoomName];
        var tower = room.memory.structures[this.request.assignedToID];
        tower.currentTask = TowerRepair.taskName + this.request.id;
        tower.towerMode = "REPAIR";
        this.request.status = "PREPARE";
    };
    TowerRepair.prototype.prepare = function () {
        _super.prototype.prepare.call(this);
        if (this.request.status != "PREPARE")
            return;
        this.request.status = "IN_PROGRESS";
    };
    TowerRepair.prototype.work = function () {
        _super.prototype.work.call(this);
        if (this.request.status != "IN_PROGRESS")
            return;
        var site = Game.getObjectById(this.request.targetID);
        var tower = Game.getObjectById(this.request.assignedToID);
        if (tower.energy < tower.energyCapacity * .5) {
            this.request.status = "FINISHED";
            return;
        }
        var status = tower.repair(site);
        if (status == OK) {
            this.request.status = "FINISHED";
        }
    };
    TowerRepair.prototype.finish = function () {
        _super.prototype.finish.call(this);
        if (this.request.status != "FINISHED")
            return;
        var room = Game.rooms[this.request.originatingRoomName];
        var tower = room.memory.structures[this.request.assignedToID];
        if (tower == undefined) {
            console.log("Tower was undefined: " + this.request.assignedToID);
        }
        else {
            tower.towerMode = "IDLE";
            tower.currentTask = "";
        }
    };
    TowerRepair.addRequests = function (roomName) {
        var room = Game.rooms[roomName];
        var targets = room.find(FIND_STRUCTURES)
            .filter(function (structure) { return structure.hits < structure.hitsMax * .75 && structure.hits < TowerRepairRequest.maxHitPoints; });
        var sorted = _.sortBy(targets, function (t) { return t.hits; });
        var count = StructureTaskQueue.count(roomName, TowerRepair.taskName);
        var i = 0;
        for (var id in sorted) {
            if (i + count == 3)
                break;
            var target = sorted[id];
            StructureTaskQueue.addPendingRequest(new TowerRepairRequest(roomName, target.id));
            i++;
        }
        //for (var i = 0; i < sorted.length; i++) {
        //  var target = sorted[i];
        //  if (StructureTaskQueue.activeTasks(roomName, this.taskName, target.id).length < 3) {
        //    StructureTaskQueue.addPendingRequest(new TowerRepairRequest(roomName, target.id));
        //  }
        //}
        //var target = _.first(sorted);
        //if (target != undefined) {
        //  if (StructureTaskQueue.activeTasks(roomName, this.taskName, target.id).length < 3) {
        //    StructureTaskQueue.addPendingRequest(new TowerRepairRequest(roomName, target.id));
        //  }
        //}
    };
    TowerRepair.taskName = "TowerRepair";
    return TowerRepair;
}(StructureTask));

var TaskStore = { Build: Build, Mine: Mine, PickupEnergy: PickupEnergy, Dismantle: Dismantle, FillTower: FillTower, FillStorage: FillStorage, FillContainers: FillContainers, Scout: Scout, Upgrade: Upgrade, Restock: Restock, TowerRepair: TowerRepair, TowerAttack: TowerAttack };
var TaskManager = /** @class */ (function () {
    function TaskManager() {
    }
    TaskManager.prototype.addTaskRequests = function (roomName) {
        //console.log("adding tasks")
        Build.addRequests(roomName);
        Restock.addRequests(roomName);
        Mine.addRequests(roomName);
        Upgrade.addRequests(roomName);
        FillContainers.addRequests(roomName);
        FillStorage.addRequests(roomName);
        FillTower.addRequests(roomName);
        TowerAttack.addRequests(roomName);
        TowerRepair.addRequests(roomName);
        //Scout.addRequests(roomName);
    };
    TaskManager.prototype.assignTasks = function (roomName) {
        var idleCreeps = findIdleCreeps(roomName);
        _.forEach(idleCreeps, function (creep) { return CreepTaskQueue.assignRequest(creep.name, roomName); });
        var idleStructures = findIdleStructures(roomName);
        _.forEach(idleStructures, function (structure) { return StructureTaskQueue.assignRequest(structure, roomName); });
    };
    TaskManager.prototype.continueTasks = function (roomName) {
        var _this = this;
        var room = Game.rooms[roomName];
        if (room == undefined || room.controller == undefined || !room.controller.my)
            return;
        _.forEach(CreepTaskQueue.activeTasks(roomName), function (request) { return _this.runTask(request); });
        _.forEach(StructureTaskQueue.activeTasks(roomName), function (request) { return _this.runTask(request); });
    };
    TaskManager.prototype.runTask = function (request) {
        if (TaskStore[request.name] === undefined || TaskStore[request.name] === null) {
            throw new Error("Task '" + request.name + "' is not registered!!");
        }
        var task = new TaskStore[request.name](request);
        var req = task.request;
        if (req.assignedToID == undefined || req.assignedToID == "") {
            //console.log("CANNOT RUN A TASK WITHOUT A FULL REQUEST.")
            return;
        }
        var id = req.id;
        task.run();
        if (req.status == "FINISHED") {
            switch (req.category) {
                case "CREEP":
                    CreepTaskQueue.removeTask(id);
                    break;
                case "STRUCTURE":
                    StructureTaskQueue.removeTask(id);
                    break;
            }
        }
    };
    TaskManager.prototype.run = function (roomName) {
        this.addTaskRequests(roomName);
        this.assignTasks(roomName);
        this.continueTasks(roomName);
    };
    return TaskManager;
}());
var taskManager = new TaskManager();

//import { CreepTaskRequest } from "tasks/CreepTaskRequest";
var CreepManager = /** @class */ (function () {
    function CreepManager() {
    }
    CreepManager.run = function (roomName) {
        CreepManager.spawnMissingCreeps(roomName);
    };
    CreepManager.GetCreepParts = function (role, roomEnergyLevel) {
        switch (role) {
            case "ROLE_MINER": return CreepManager.getMinerBodyParts(roomEnergyLevel);
            case "ROLE_UPGRADER": return CreepManager.getUpgraderBodyParts(roomEnergyLevel);
            case "ROLE_WORKER": return CreepManager.getWorkerBodyParts(roomEnergyLevel);
            case "ROLE_SCOUT": return CreepManager.getScoutBodyParts(roomEnergyLevel);
            case "ROLE_CARRIER": return CreepManager.getCarrierBodyParts(roomEnergyLevel);
            case "ROLE_DEFENDER": return CreepManager.getDefenderBodyParts(roomEnergyLevel);
            case "ROLE_REMOTE_UPGRADER": return CreepManager.getRemoteUpgraderBodyParts(roomEnergyLevel);
            case "ROLE_DISMANTLER": return CreepManager.getDismantlerBodyParts(roomEnergyLevel);
            default: throw new Error(role + " is not a valid creep role.");
        }
    };
    CreepManager.spawnMissingCreeps = function (roomName) {
        var energyLevel = getRoomEnergyLevel(roomName);
        CreepManager.spawnMissingMiners(roomName, energyLevel);
        CreepManager.spawnMissingWorkers(roomName, energyLevel);
        CreepManager.spawnMissingUpgraders(roomName, energyLevel);
        CreepManager.spawnMissingCarriers(roomName, energyLevel);
        CreepManager.spawnMissingScouts(roomName, energyLevel);
        CreepManager.spawnMissingRemoteUpgraders(roomName, energyLevel);
        CreepManager.spawnMissingDismantlers(roomName, energyLevel);
        //CreepManager.spawnMissingDefenders(roomName, energyLevel);
    };
    CreepManager.trySpawnCreep = function (spawn, role, energyLevel) {
        //console.log("trying to spawn a " + role + " for " + spawn.room.name)
        var bodyParts = CreepManager.GetCreepParts(role, energyLevel);
        return this.spawnCreep(spawn, bodyParts, role) == OK;
    };
    CreepManager.getUpgraderBodyParts = function (energyLevel) {
        switch (energyLevel) {
            case 1: return [WORK, MOVE, MOVE, CARRY];
            case 2: return [WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY, CARRY];
            case 3: return [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY];
            case 4: return [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY];
            case 5: return [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
            default: return [WORK, MOVE, MOVE, CARRY];
        }
    };
    CreepManager.getDismantlerBodyParts = function (energyLevel) {
        switch (energyLevel) {
            case 1: return [WORK, MOVE, MOVE, CARRY];
            case 2: return [WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY, CARRY];
            case 3: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY];
            case 4: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY];
            case 5: return [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK];
            default: return [WORK, MOVE, MOVE, CARRY];
        }
    };
    CreepManager.getDefenderBodyParts = function (energyLevel) {
        switch (energyLevel) {
            case 1: return [WORK, MOVE, MOVE, CARRY];
            case 2: return [ATTACK, ATTACK, MOVE, MOVE];
            case 3: return [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY];
            case 4: return [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY];
            default: return [WORK, MOVE, MOVE, CARRY];
        }
    };
    CreepManager.getRemoteUpgraderBodyParts = function (energyLevel) {
        switch (energyLevel) {
            case 1: return [WORK, MOVE, MOVE, CARRY];
            case 2: return [WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY, CARRY];
            case 3: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY];
            case 4: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
            default: return [WORK, MOVE, MOVE, CARRY];
        }
    };
    CreepManager.getWorkerBodyParts = function (energyLevel) {
        switch (energyLevel) {
            case 1: return [WORK, MOVE, MOVE, CARRY];
            case 2: return [WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY, CARRY];
            case 3: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY];
            case 4: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY];
            case 5: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY];
            default: return [WORK, MOVE, MOVE, CARRY];
        }
    };
    CreepManager.getCarrierBodyParts = function (energyLevel) {
        switch (energyLevel) {
            case 1: return [MOVE, MOVE, CARRY, CARRY];
            case 2: return [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY];
            case 3: return [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
            case 4: return [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
            case 5: return [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
            default: return [WORK, MOVE, MOVE, CARRY];
        }
    };
    CreepManager.getMinerBodyParts = function (energyLevel) {
        switch (energyLevel) {
            case 1: return [WORK, WORK, MOVE, MOVE];
            case 2: return [WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE];
            case 3: return [WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY];
            case 4: return [WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY];
            case 5: return [WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY];
            default: return [WORK, WORK, MOVE, MOVE];
        }
    };
    CreepManager.getScoutBodyParts = function (energyLevel) {
        switch (energyLevel) {
            case 1: return [MOVE, MOVE, MOVE];
            case 2: return [MOVE, MOVE, MOVE];
            case 3: return [CLAIM, MOVE,];
            case 4: return [CLAIM, MOVE,];
            case 5: return [MOVE, CLAIM, MOVE, CLAIM];
            default: return [MOVE, MOVE];
        }
    };
    CreepManager.spawnMissingRemoteUpgraders = function (roomName, energyLevel) {
        var miners = creepCount(roomName, "ROLE_MINER");
        var workers = creepCount(roomName, "ROLE_WORKER");
        var carriers = creepCount(roomName, "ROLE_CARRIER");
        var upgraders = creepCount(roomName, "ROLE_UPGRADER");
        var roomMem = Game.rooms[roomName].memory;
        var settings = roomMem.settingsMap[energyLevel];
        var currentRUCount = creepCountAllRooms("ROLE_REMOTE_UPGRADER");
        if (miners < settings.minersPerSource * 2
            || workers < settings.maxWorkerCount
            || carriers < settings.maxCarrierCount)
            return;
        var flags = _.filter(Game.flags, function (f) { return f.color == COLOR_BLUE && f.secondaryColor == COLOR_BLUE; });
        if (flags.length == 0)
            return;
        var spawns = findSpawns(roomName);
        var remoteUpgradersNeeded = 3 - currentRUCount;
        var spawned = 0;
        for (var i in spawns) {
            if (spawned < remoteUpgradersNeeded) {
                var spawn = spawns[i];
                if (spawn.spawning)
                    continue;
                CreepManager.trySpawnCreep(spawn, "ROLE_REMOTE_UPGRADER", energyLevel);
                if (spawn.spawning)
                    spawned++;
            }
            else
                break;
        }
    };
    CreepManager.spawnMissingDefenders = function (roomName, energyLevel) {
        var currentDefenderCount = creepCountAllRooms("ROLE_DEFENDER");
        var spawns = findSpawns(roomName);
        var defendersNeeded = 3 - currentDefenderCount;
        var spawned = 0;
        for (var i in spawns) {
            if (spawned < defendersNeeded) {
                var spawn = spawns[i];
                if (spawn.spawning)
                    continue;
                CreepManager.trySpawnCreep(spawn, "ROLE_DEFENDER", energyLevel);
                if (spawn.spawning)
                    spawned++;
            }
            else
                break;
        }
    };
    CreepManager.spawnMissingScouts = function (roomName, energyLevel) {
        var miners = creepCount(roomName, "ROLE_MINER");
        var workers = creepCount(roomName, "ROLE_WORKER");
        var upgraders = creepCount(roomName, "ROLE_UPGRADER");
        var carriers = creepCount(roomName, "ROLE_CARRIER");
        var roomMem = Game.rooms[roomName].memory;
        var settings = roomMem.settingsMap[energyLevel];
        if (miners < settings.minimumMinerCount
            || carriers < settings.maxCarrierCount
            || upgraders < settings.maxUpgraderCount) {
            return;
        }
        var currentPending = CreepTaskQueue.count(roomName, "Scout", "", "PENDING");
        var currentlySpawning = _.filter(findSpawns(roomName, false), function (s) {
            var spawn = s;
            return spawn.spawning != null && getRole(spawn.spawning.name) == "ROLE_SCOUT";
        }).length;
        var scoutsNeeded = currentPending - currentlySpawning;
        if (scoutsNeeded < 1)
            return;
        var availableSpawns = findSpawns(roomName, true);
        //var taskName = new ScoutRequest("test", "temp", false).name;
        var scoutsSpawned = 0;
        for (var i in availableSpawns) {
            var spawn = availableSpawns[i];
            if (scoutsSpawned < scoutsNeeded) {
                if (CreepManager.trySpawnCreep(spawn, "ROLE_SCOUT", energyLevel))
                    scoutsSpawned++;
            }
            else
                break;
        }
    };
    CreepManager.spawnMissingDismantlers = function (roomName, energyLevel) {
        var miners = creepCount(roomName, "ROLE_MINER");
        var carriers = creepCount(roomName, "ROLE_CARRIER");
        var upgraders = creepCount(roomName, "ROLE_UPGRADER");
        var room = Game.rooms[roomName];
        var roomMem = room.memory;
        var settings = roomMem.settingsMap[energyLevel];
        var currentCount = creepCount(roomName, "ROLE_WORKER");
        if (miners < settings.minimumMinerCount - 1 && currentCount > 0) {
            return;
        }
        if (carriers < settings.minimumCarrierCount || upgraders < settings.maxUpgraderCount)
            return;
        var flags = _.filter(Game.flags, function (f) { return f.pos.roomName == roomName && f.color == COLOR_YELLOW && f.secondaryColor == COLOR_YELLOW; });
        if (flags.length == 0)
            return;
        CreepManager.spawnCreeps(roomName, "ROLE_DISMANTLER", 1, energyLevel);
    };
    CreepManager.spawnMissingWorkers = function (roomName, energyLevel) {
        var miners = creepCount(roomName, "ROLE_MINER");
        var carriers = creepCount(roomName, "ROLE_CARRIER");
        var upgraders = creepCount(roomName, "ROLE_UPGRADER");
        var room = Game.rooms[roomName];
        var roomMem = room.memory;
        var settings = roomMem.settingsMap[energyLevel];
        var currentCount = creepCount(roomName, "ROLE_WORKER");
        if (miners < settings.minimumMinerCount - 1 && currentCount > 0) {
            return;
        }
        if (carriers < settings.minimumCarrierCount || upgraders < settings.maxUpgraderCount)
            return;
        if (room.find(FIND_CONSTRUCTION_SITES).length == 0)
            return;
        CreepManager.spawnCreeps(roomName, "ROLE_WORKER", settings.maxWorkerCount, energyLevel);
    };
    CreepManager.spawnMissingCarriers = function (roomName, energyLevel) {
        var miners = creepCount(roomName, "ROLE_MINER");
        var workers = creepCount(roomName, "ROLE_WORKER");
        var room = Game.rooms[roomName];
        var roomMem = room.memory;
        var settings = roomMem.settingsMap[energyLevel];
        var currentCarrierCount = creepCount(roomName, "ROLE_CARRIER");
        if (miners < settings.minimumMinerCount - 1 && workers < settings.minimumWorkerCount && currentCarrierCount > 0) {
            return;
        }
        CreepManager.spawnCreeps(roomName, "ROLE_CARRIER", settings.maxCarrierCount, energyLevel);
    };
    CreepManager.spawnMissingUpgraders = function (roomName, energyLevel) {
        var roomMem = Game.rooms[roomName].memory;
        var settings = roomMem.settingsMap[energyLevel];
        var workers = creepCount(roomName, "ROLE_WORKER");
        var carriers = creepCount(roomName, "ROLE_CARRIER");
        var miners = creepCount(roomName, "ROLE_MINER");
        if (miners < settings.minimumMinerCount)
            return;
        if (carriers < settings.minimumCarrierCount)
            return;
        CreepManager.spawnCreeps(roomName, "ROLE_UPGRADER", settings.maxUpgraderCount, energyLevel);
    };
    CreepManager.spawnMissingMiners = function (roomName, energyLevel) {
        var roomMem = Game.rooms[roomName].memory;
        var settings = roomMem.settingsMap[energyLevel];
        var spawns = findSpawns(roomName);
        var currentMinerCount = creepCount(roomName, "ROLE_MINER");
        var room = Game.rooms[roomName];
        var sources = room.find(FIND_SOURCES);
        var minerCount = sources.length * settings.minersPerSource;
        CreepManager.spawnCreeps(roomName, "ROLE_MINER", minerCount, energyLevel);
    };
    CreepManager.spawnCreeps = function (roomName, role, max, energyLevel) {
        var spawns = findSpawns(roomName, false);
        var currentCount = creepCount(roomName, role);
        var currentlySpawning = _.filter(spawns, function (s) {
            var spawn = s;
            return spawn.spawning != null && getRole(spawn.spawning.name) == role;
        }).length;
        var availableSpawns = findSpawns(roomName, true);
        var totalNeeded = max - (currentCount + currentlySpawning);
        if (totalNeeded < 1)
            return;
        var creepsSpawned = 0;
        for (var i in availableSpawns) {
            var spawn = availableSpawns[i];
            if (creepsSpawned < totalNeeded) {
                if (CreepManager.trySpawnCreep(spawn, role, energyLevel))
                    creepsSpawned++;
            }
            else
                break;
        }
    };
    CreepManager.spawnCreep = function (spawn, bodyParts, role) {
        //console.log("trying to spawn " + getRoleString(role))
        var uuid = Memory.uuid;
        var creepName = spawn.room.name + "-" + role + "-" + (uuid + 1);
        var status = spawn.spawnCreep(bodyParts, creepName, { dryRun: true });
        status = _.isString(status) ? OK : status;
        while (status == -3) {
            uuid++;
            creepName = spawn.room.name + "-" + role + "-" + (uuid + 1);
            status = spawn.spawnCreep(bodyParts, creepName, { dryRun: true });
            status = _.isString(status) ? OK : status;
        }
        if (status === OK && spawn.spawning == null) {
            Memory.uuid = uuid + 1;
            var creepName_1 = spawn.room.name + "-" + role + "-" + uuid;
            var memory = {
                spawnID: spawn.id,
                homeRoom: spawn.room.name,
                idle: true,
                currentTask: "",
                alive: true,
                role: role,
                _trav: 0,
                _travel: 0
            };
            status = spawn.spawnCreep(bodyParts, creepName_1, { memory: memory });
            return _.isString(status) ? OK : status;
        }
        else {
            return status;
        }
    };
    return CreepManager;
}());

function mainLoop() {
    InitializeGame();
    for (var i in Game.rooms) {
        var room = Game.rooms[i];
        var roomName = room.name;
        roomManager$1.Run(roomName);
        CreepManager.run(roomName);
        taskManager.run(roomName);
    }
    cleanupCreeps();
}
var loop = ErrorMapper.wrapLoop(mainLoop);

exports.loop = loop;
//# sourceMappingURL=main.js.map
