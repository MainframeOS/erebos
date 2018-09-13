(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.Erebos = {})));
}(this, (function (exports) { 'use strict';

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }

  var global$1 = typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};

  var lookup = [];
  var revLookup = [];
  var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
  var inited = false;

  function init() {
    inited = true;
    var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    for (var i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    }

    revLookup['-'.charCodeAt(0)] = 62;
    revLookup['_'.charCodeAt(0)] = 63;
  }

  function toByteArray(b64) {
    if (!inited) {
      init();
    }

    var i, j, l, tmp, placeHolders, arr;
    var len = b64.length;

    if (len % 4 > 0) {
      throw new Error('Invalid string. Length must be a multiple of 4');
    } // the number of equal signs (place holders)
    // if there are two placeholders, than the two characters before it
    // represent one byte
    // if there is only one, then the three characters before it represent 2 bytes
    // this is just a cheap hack to not do indexOf twice


    placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0; // base64 is 4/3 + up to two characters of the original data

    arr = new Arr(len * 3 / 4 - placeHolders); // if there are placeholders, only get up to the last complete 4 chars

    l = placeHolders > 0 ? len - 4 : len;
    var L = 0;

    for (i = 0, j = 0; i < l; i += 4, j += 3) {
      tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
      arr[L++] = tmp >> 16 & 0xFF;
      arr[L++] = tmp >> 8 & 0xFF;
      arr[L++] = tmp & 0xFF;
    }

    if (placeHolders === 2) {
      tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
      arr[L++] = tmp & 0xFF;
    } else if (placeHolders === 1) {
      tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
      arr[L++] = tmp >> 8 & 0xFF;
      arr[L++] = tmp & 0xFF;
    }

    return arr;
  }

  function tripletToBase64(num) {
    return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
  }

  function encodeChunk(uint8, start, end) {
    var tmp;
    var output = [];

    for (var i = start; i < end; i += 3) {
      tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2];
      output.push(tripletToBase64(tmp));
    }

    return output.join('');
  }

  function fromByteArray(uint8) {
    if (!inited) {
      init();
    }

    var tmp;
    var len = uint8.length;
    var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes

    var output = '';
    var parts = [];
    var maxChunkLength = 16383; // must be multiple of 3
    // go through the array every three bytes, we'll deal with trailing stuff later

    for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
      parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
    } // pad the end with zeros, but make sure to not forget the extra bytes


    if (extraBytes === 1) {
      tmp = uint8[len - 1];
      output += lookup[tmp >> 2];
      output += lookup[tmp << 4 & 0x3F];
      output += '==';
    } else if (extraBytes === 2) {
      tmp = (uint8[len - 2] << 8) + uint8[len - 1];
      output += lookup[tmp >> 10];
      output += lookup[tmp >> 4 & 0x3F];
      output += lookup[tmp << 2 & 0x3F];
      output += '=';
    }

    parts.push(output);
    return parts.join('');
  }

  function read(buffer, offset, isLE, mLen, nBytes) {
    var e, m;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var nBits = -7;
    var i = isLE ? nBytes - 1 : 0;
    var d = isLE ? -1 : 1;
    var s = buffer[offset + i];
    i += d;
    e = s & (1 << -nBits) - 1;
    s >>= -nBits;
    nBits += eLen;

    for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    m = e & (1 << -nBits) - 1;
    e >>= -nBits;
    nBits += mLen;

    for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    if (e === 0) {
      e = 1 - eBias;
    } else if (e === eMax) {
      return m ? NaN : (s ? -1 : 1) * Infinity;
    } else {
      m = m + Math.pow(2, mLen);
      e = e - eBias;
    }

    return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
  }
  function write(buffer, value, offset, isLE, mLen, nBytes) {
    var e, m, c;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
    var i = isLE ? 0 : nBytes - 1;
    var d = isLE ? 1 : -1;
    var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
    value = Math.abs(value);

    if (isNaN(value) || value === Infinity) {
      m = isNaN(value) ? 1 : 0;
      e = eMax;
    } else {
      e = Math.floor(Math.log(value) / Math.LN2);

      if (value * (c = Math.pow(2, -e)) < 1) {
        e--;
        c *= 2;
      }

      if (e + eBias >= 1) {
        value += rt / c;
      } else {
        value += rt * Math.pow(2, 1 - eBias);
      }

      if (value * c >= 2) {
        e++;
        c /= 2;
      }

      if (e + eBias >= eMax) {
        m = 0;
        e = eMax;
      } else if (e + eBias >= 1) {
        m = (value * c - 1) * Math.pow(2, mLen);
        e = e + eBias;
      } else {
        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
        e = 0;
      }
    }

    for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

    e = e << mLen | m;
    eLen += mLen;

    for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

    buffer[offset + i - d] |= s * 128;
  }

  var toString = {}.toString;
  var isArray = Array.isArray || function (arr) {
    return toString.call(arr) == '[object Array]';
  };

  var INSPECT_MAX_BYTES = 50;
  /**
   * If `Buffer.TYPED_ARRAY_SUPPORT`:
   *   === true    Use Uint8Array implementation (fastest)
   *   === false   Use Object implementation (most compatible, even IE6)
   *
   * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
   * Opera 11.6+, iOS 4.2+.
   *
   * Due to various browser bugs, sometimes the Object implementation will be used even
   * when the browser supports typed arrays.
   *
   * Note:
   *
   *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
   *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
   *
   *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
   *
   *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
   *     incorrect length in some situations.

   * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
   * get the Object implementation, which is slower but behaves correctly.
   */

  Buffer.TYPED_ARRAY_SUPPORT = global$1.TYPED_ARRAY_SUPPORT !== undefined ? global$1.TYPED_ARRAY_SUPPORT : true;

  function kMaxLength() {
    return Buffer.TYPED_ARRAY_SUPPORT ? 0x7fffffff : 0x3fffffff;
  }

  function createBuffer(that, length) {
    if (kMaxLength() < length) {
      throw new RangeError('Invalid typed array length');
    }

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      // Return an augmented `Uint8Array` instance, for best performance
      that = new Uint8Array(length);
      that.__proto__ = Buffer.prototype;
    } else {
      // Fallback: Return an object instance of the Buffer class
      if (that === null) {
        that = new Buffer(length);
      }

      that.length = length;
    }

    return that;
  }
  /**
   * The Buffer constructor returns instances of `Uint8Array` that have their
   * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
   * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
   * and the `Uint8Array` methods. Square bracket notation works as expected -- it
   * returns a single octet.
   *
   * The `Uint8Array` prototype remains unmodified.
   */


  function Buffer(arg, encodingOrOffset, length) {
    if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
      return new Buffer(arg, encodingOrOffset, length);
    } // Common case.


    if (typeof arg === 'number') {
      if (typeof encodingOrOffset === 'string') {
        throw new Error('If encoding is specified then the first argument must be a string');
      }

      return allocUnsafe(this, arg);
    }

    return from(this, arg, encodingOrOffset, length);
  }
  Buffer.poolSize = 8192; // not used by this implementation
  // TODO: Legacy, not needed anymore. Remove in next major version.

  Buffer._augment = function (arr) {
    arr.__proto__ = Buffer.prototype;
    return arr;
  };

  function from(that, value, encodingOrOffset, length) {
    if (typeof value === 'number') {
      throw new TypeError('"value" argument must not be a number');
    }

    if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
      return fromArrayBuffer(that, value, encodingOrOffset, length);
    }

    if (typeof value === 'string') {
      return fromString(that, value, encodingOrOffset);
    }

    return fromObject(that, value);
  }
  /**
   * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
   * if value is a number.
   * Buffer.from(str[, encoding])
   * Buffer.from(array)
   * Buffer.from(buffer)
   * Buffer.from(arrayBuffer[, byteOffset[, length]])
   **/


  Buffer.from = function (value, encodingOrOffset, length) {
    return from(null, value, encodingOrOffset, length);
  };

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    Buffer.prototype.__proto__ = Uint8Array.prototype;
    Buffer.__proto__ = Uint8Array;
  }

  function assertSize(size) {
    if (typeof size !== 'number') {
      throw new TypeError('"size" argument must be a number');
    } else if (size < 0) {
      throw new RangeError('"size" argument must not be negative');
    }
  }

  function alloc(that, size, fill, encoding) {
    assertSize(size);

    if (size <= 0) {
      return createBuffer(that, size);
    }

    if (fill !== undefined) {
      // Only pay attention to encoding if it's a string. This
      // prevents accidentally sending in a number that would
      // be interpretted as a start offset.
      return typeof encoding === 'string' ? createBuffer(that, size).fill(fill, encoding) : createBuffer(that, size).fill(fill);
    }

    return createBuffer(that, size);
  }
  /**
   * Creates a new filled Buffer instance.
   * alloc(size[, fill[, encoding]])
   **/


  Buffer.alloc = function (size, fill, encoding) {
    return alloc(null, size, fill, encoding);
  };

  function allocUnsafe(that, size) {
    assertSize(size);
    that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);

    if (!Buffer.TYPED_ARRAY_SUPPORT) {
      for (var i = 0; i < size; ++i) {
        that[i] = 0;
      }
    }

    return that;
  }
  /**
   * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
   * */


  Buffer.allocUnsafe = function (size) {
    return allocUnsafe(null, size);
  };
  /**
   * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
   */


  Buffer.allocUnsafeSlow = function (size) {
    return allocUnsafe(null, size);
  };

  function fromString(that, string, encoding) {
    if (typeof encoding !== 'string' || encoding === '') {
      encoding = 'utf8';
    }

    if (!Buffer.isEncoding(encoding)) {
      throw new TypeError('"encoding" must be a valid string encoding');
    }

    var length = byteLength(string, encoding) | 0;
    that = createBuffer(that, length);
    var actual = that.write(string, encoding);

    if (actual !== length) {
      // Writing a hex string, for example, that contains invalid characters will
      // cause everything after the first invalid character to be ignored. (e.g.
      // 'abxxcd' will be treated as 'ab')
      that = that.slice(0, actual);
    }

    return that;
  }

  function fromArrayLike(that, array) {
    var length = array.length < 0 ? 0 : checked(array.length) | 0;
    that = createBuffer(that, length);

    for (var i = 0; i < length; i += 1) {
      that[i] = array[i] & 255;
    }

    return that;
  }

  function fromArrayBuffer(that, array, byteOffset, length) {
    array.byteLength; // this throws if `array` is not a valid ArrayBuffer

    if (byteOffset < 0 || array.byteLength < byteOffset) {
      throw new RangeError('\'offset\' is out of bounds');
    }

    if (array.byteLength < byteOffset + (length || 0)) {
      throw new RangeError('\'length\' is out of bounds');
    }

    if (byteOffset === undefined && length === undefined) {
      array = new Uint8Array(array);
    } else if (length === undefined) {
      array = new Uint8Array(array, byteOffset);
    } else {
      array = new Uint8Array(array, byteOffset, length);
    }

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      // Return an augmented `Uint8Array` instance, for best performance
      that = array;
      that.__proto__ = Buffer.prototype;
    } else {
      // Fallback: Return an object instance of the Buffer class
      that = fromArrayLike(that, array);
    }

    return that;
  }

  function fromObject(that, obj) {
    if (internalIsBuffer(obj)) {
      var len = checked(obj.length) | 0;
      that = createBuffer(that, len);

      if (that.length === 0) {
        return that;
      }

      obj.copy(that, 0, 0, len);
      return that;
    }

    if (obj) {
      if (typeof ArrayBuffer !== 'undefined' && obj.buffer instanceof ArrayBuffer || 'length' in obj) {
        if (typeof obj.length !== 'number' || isnan(obj.length)) {
          return createBuffer(that, 0);
        }

        return fromArrayLike(that, obj);
      }

      if (obj.type === 'Buffer' && isArray(obj.data)) {
        return fromArrayLike(that, obj.data);
      }
    }

    throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.');
  }

  function checked(length) {
    // Note: cannot use `length < kMaxLength()` here because that fails when
    // length is NaN (which is otherwise coerced to zero.)
    if (length >= kMaxLength()) {
      throw new RangeError('Attempt to allocate Buffer larger than maximum ' + 'size: 0x' + kMaxLength().toString(16) + ' bytes');
    }

    return length | 0;
  }
  Buffer.isBuffer = isBuffer;

  function internalIsBuffer(b) {
    return !!(b != null && b._isBuffer);
  }

  Buffer.compare = function compare(a, b) {
    if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
      throw new TypeError('Arguments must be Buffers');
    }

    if (a === b) return 0;
    var x = a.length;
    var y = b.length;

    for (var i = 0, len = Math.min(x, y); i < len; ++i) {
      if (a[i] !== b[i]) {
        x = a[i];
        y = b[i];
        break;
      }
    }

    if (x < y) return -1;
    if (y < x) return 1;
    return 0;
  };

  Buffer.isEncoding = function isEncoding(encoding) {
    switch (String(encoding).toLowerCase()) {
      case 'hex':
      case 'utf8':
      case 'utf-8':
      case 'ascii':
      case 'latin1':
      case 'binary':
      case 'base64':
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return true;

      default:
        return false;
    }
  };

  Buffer.concat = function concat(list, length) {
    if (!isArray(list)) {
      throw new TypeError('"list" argument must be an Array of Buffers');
    }

    if (list.length === 0) {
      return Buffer.alloc(0);
    }

    var i;

    if (length === undefined) {
      length = 0;

      for (i = 0; i < list.length; ++i) {
        length += list[i].length;
      }
    }

    var buffer = Buffer.allocUnsafe(length);
    var pos = 0;

    for (i = 0; i < list.length; ++i) {
      var buf = list[i];

      if (!internalIsBuffer(buf)) {
        throw new TypeError('"list" argument must be an Array of Buffers');
      }

      buf.copy(buffer, pos);
      pos += buf.length;
    }

    return buffer;
  };

  function byteLength(string, encoding) {
    if (internalIsBuffer(string)) {
      return string.length;
    }

    if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' && (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
      return string.byteLength;
    }

    if (typeof string !== 'string') {
      string = '' + string;
    }

    var len = string.length;
    if (len === 0) return 0; // Use a for loop to avoid recursion

    var loweredCase = false;

    for (;;) {
      switch (encoding) {
        case 'ascii':
        case 'latin1':
        case 'binary':
          return len;

        case 'utf8':
        case 'utf-8':
        case undefined:
          return utf8ToBytes(string).length;

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return len * 2;

        case 'hex':
          return len >>> 1;

        case 'base64':
          return base64ToBytes(string).length;

        default:
          if (loweredCase) return utf8ToBytes(string).length; // assume utf8

          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  }

  Buffer.byteLength = byteLength;

  function slowToString(encoding, start, end) {
    var loweredCase = false; // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
    // property of a typed array.
    // This behaves neither like String nor Uint8Array in that we set start/end
    // to their upper/lower bounds if the value passed is out of range.
    // undefined is handled specially as per ECMA-262 6th Edition,
    // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.

    if (start === undefined || start < 0) {
      start = 0;
    } // Return early if start > this.length. Done here to prevent potential uint32
    // coercion fail below.


    if (start > this.length) {
      return '';
    }

    if (end === undefined || end > this.length) {
      end = this.length;
    }

    if (end <= 0) {
      return '';
    } // Force coersion to uint32. This will also coerce falsey/NaN values to 0.


    end >>>= 0;
    start >>>= 0;

    if (end <= start) {
      return '';
    }

    if (!encoding) encoding = 'utf8';

    while (true) {
      switch (encoding) {
        case 'hex':
          return hexSlice(this, start, end);

        case 'utf8':
        case 'utf-8':
          return utf8Slice(this, start, end);

        case 'ascii':
          return asciiSlice(this, start, end);

        case 'latin1':
        case 'binary':
          return latin1Slice(this, start, end);

        case 'base64':
          return base64Slice(this, start, end);

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return utf16leSlice(this, start, end);

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
          encoding = (encoding + '').toLowerCase();
          loweredCase = true;
      }
    }
  } // The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
  // Buffer instances.


  Buffer.prototype._isBuffer = true;

  function swap(b, n, m) {
    var i = b[n];
    b[n] = b[m];
    b[m] = i;
  }

  Buffer.prototype.swap16 = function swap16() {
    var len = this.length;

    if (len % 2 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 16-bits');
    }

    for (var i = 0; i < len; i += 2) {
      swap(this, i, i + 1);
    }

    return this;
  };

  Buffer.prototype.swap32 = function swap32() {
    var len = this.length;

    if (len % 4 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 32-bits');
    }

    for (var i = 0; i < len; i += 4) {
      swap(this, i, i + 3);
      swap(this, i + 1, i + 2);
    }

    return this;
  };

  Buffer.prototype.swap64 = function swap64() {
    var len = this.length;

    if (len % 8 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 64-bits');
    }

    for (var i = 0; i < len; i += 8) {
      swap(this, i, i + 7);
      swap(this, i + 1, i + 6);
      swap(this, i + 2, i + 5);
      swap(this, i + 3, i + 4);
    }

    return this;
  };

  Buffer.prototype.toString = function toString() {
    var length = this.length | 0;
    if (length === 0) return '';
    if (arguments.length === 0) return utf8Slice(this, 0, length);
    return slowToString.apply(this, arguments);
  };

  Buffer.prototype.equals = function equals(b) {
    if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer');
    if (this === b) return true;
    return Buffer.compare(this, b) === 0;
  };

  Buffer.prototype.inspect = function inspect() {
    var str = '';
    var max = INSPECT_MAX_BYTES;

    if (this.length > 0) {
      str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
      if (this.length > max) str += ' ... ';
    }

    return '<Buffer ' + str + '>';
  };

  Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
    if (!internalIsBuffer(target)) {
      throw new TypeError('Argument must be a Buffer');
    }

    if (start === undefined) {
      start = 0;
    }

    if (end === undefined) {
      end = target ? target.length : 0;
    }

    if (thisStart === undefined) {
      thisStart = 0;
    }

    if (thisEnd === undefined) {
      thisEnd = this.length;
    }

    if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
      throw new RangeError('out of range index');
    }

    if (thisStart >= thisEnd && start >= end) {
      return 0;
    }

    if (thisStart >= thisEnd) {
      return -1;
    }

    if (start >= end) {
      return 1;
    }

    start >>>= 0;
    end >>>= 0;
    thisStart >>>= 0;
    thisEnd >>>= 0;
    if (this === target) return 0;
    var x = thisEnd - thisStart;
    var y = end - start;
    var len = Math.min(x, y);
    var thisCopy = this.slice(thisStart, thisEnd);
    var targetCopy = target.slice(start, end);

    for (var i = 0; i < len; ++i) {
      if (thisCopy[i] !== targetCopy[i]) {
        x = thisCopy[i];
        y = targetCopy[i];
        break;
      }
    }

    if (x < y) return -1;
    if (y < x) return 1;
    return 0;
  }; // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
  // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
  //
  // Arguments:
  // - buffer - a Buffer to search
  // - val - a string, Buffer, or number
  // - byteOffset - an index into `buffer`; will be clamped to an int32
  // - encoding - an optional encoding, relevant is val is a string
  // - dir - true for indexOf, false for lastIndexOf


  function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
    // Empty buffer means no match
    if (buffer.length === 0) return -1; // Normalize byteOffset

    if (typeof byteOffset === 'string') {
      encoding = byteOffset;
      byteOffset = 0;
    } else if (byteOffset > 0x7fffffff) {
      byteOffset = 0x7fffffff;
    } else if (byteOffset < -0x80000000) {
      byteOffset = -0x80000000;
    }

    byteOffset = +byteOffset; // Coerce to Number.

    if (isNaN(byteOffset)) {
      // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
      byteOffset = dir ? 0 : buffer.length - 1;
    } // Normalize byteOffset: negative offsets start from the end of the buffer


    if (byteOffset < 0) byteOffset = buffer.length + byteOffset;

    if (byteOffset >= buffer.length) {
      if (dir) return -1;else byteOffset = buffer.length - 1;
    } else if (byteOffset < 0) {
      if (dir) byteOffset = 0;else return -1;
    } // Normalize val


    if (typeof val === 'string') {
      val = Buffer.from(val, encoding);
    } // Finally, search either indexOf (if dir is true) or lastIndexOf


    if (internalIsBuffer(val)) {
      // Special case: looking for empty string/buffer always fails
      if (val.length === 0) {
        return -1;
      }

      return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
    } else if (typeof val === 'number') {
      val = val & 0xFF; // Search for a byte value [0-255]

      if (Buffer.TYPED_ARRAY_SUPPORT && typeof Uint8Array.prototype.indexOf === 'function') {
        if (dir) {
          return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
        } else {
          return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
        }
      }

      return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
    }

    throw new TypeError('val must be string, number or Buffer');
  }

  function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
    var indexSize = 1;
    var arrLength = arr.length;
    var valLength = val.length;

    if (encoding !== undefined) {
      encoding = String(encoding).toLowerCase();

      if (encoding === 'ucs2' || encoding === 'ucs-2' || encoding === 'utf16le' || encoding === 'utf-16le') {
        if (arr.length < 2 || val.length < 2) {
          return -1;
        }

        indexSize = 2;
        arrLength /= 2;
        valLength /= 2;
        byteOffset /= 2;
      }
    }

    function read$$1(buf, i) {
      if (indexSize === 1) {
        return buf[i];
      } else {
        return buf.readUInt16BE(i * indexSize);
      }
    }

    var i;

    if (dir) {
      var foundIndex = -1;

      for (i = byteOffset; i < arrLength; i++) {
        if (read$$1(arr, i) === read$$1(val, foundIndex === -1 ? 0 : i - foundIndex)) {
          if (foundIndex === -1) foundIndex = i;
          if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
        } else {
          if (foundIndex !== -1) i -= i - foundIndex;
          foundIndex = -1;
        }
      }
    } else {
      if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;

      for (i = byteOffset; i >= 0; i--) {
        var found = true;

        for (var j = 0; j < valLength; j++) {
          if (read$$1(arr, i + j) !== read$$1(val, j)) {
            found = false;
            break;
          }
        }

        if (found) return i;
      }
    }

    return -1;
  }

  Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
    return this.indexOf(val, byteOffset, encoding) !== -1;
  };

  Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
  };

  Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
  };

  function hexWrite(buf, string, offset, length) {
    offset = Number(offset) || 0;
    var remaining = buf.length - offset;

    if (!length) {
      length = remaining;
    } else {
      length = Number(length);

      if (length > remaining) {
        length = remaining;
      }
    } // must be an even number of digits


    var strLen = string.length;
    if (strLen % 2 !== 0) throw new TypeError('Invalid hex string');

    if (length > strLen / 2) {
      length = strLen / 2;
    }

    for (var i = 0; i < length; ++i) {
      var parsed = parseInt(string.substr(i * 2, 2), 16);
      if (isNaN(parsed)) return i;
      buf[offset + i] = parsed;
    }

    return i;
  }

  function utf8Write(buf, string, offset, length) {
    return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
  }

  function asciiWrite(buf, string, offset, length) {
    return blitBuffer(asciiToBytes(string), buf, offset, length);
  }

  function latin1Write(buf, string, offset, length) {
    return asciiWrite(buf, string, offset, length);
  }

  function base64Write(buf, string, offset, length) {
    return blitBuffer(base64ToBytes(string), buf, offset, length);
  }

  function ucs2Write(buf, string, offset, length) {
    return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
  }

  Buffer.prototype.write = function write$$1(string, offset, length, encoding) {
    // Buffer#write(string)
    if (offset === undefined) {
      encoding = 'utf8';
      length = this.length;
      offset = 0; // Buffer#write(string, encoding)
    } else if (length === undefined && typeof offset === 'string') {
      encoding = offset;
      length = this.length;
      offset = 0; // Buffer#write(string, offset[, length][, encoding])
    } else if (isFinite(offset)) {
      offset = offset | 0;

      if (isFinite(length)) {
        length = length | 0;
        if (encoding === undefined) encoding = 'utf8';
      } else {
        encoding = length;
        length = undefined;
      } // legacy write(string, encoding, offset, length) - remove in v0.13

    } else {
      throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported');
    }

    var remaining = this.length - offset;
    if (length === undefined || length > remaining) length = remaining;

    if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
      throw new RangeError('Attempt to write outside buffer bounds');
    }

    if (!encoding) encoding = 'utf8';
    var loweredCase = false;

    for (;;) {
      switch (encoding) {
        case 'hex':
          return hexWrite(this, string, offset, length);

        case 'utf8':
        case 'utf-8':
          return utf8Write(this, string, offset, length);

        case 'ascii':
          return asciiWrite(this, string, offset, length);

        case 'latin1':
        case 'binary':
          return latin1Write(this, string, offset, length);

        case 'base64':
          // Warning: maxLength not taken into account in base64Write
          return base64Write(this, string, offset, length);

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return ucs2Write(this, string, offset, length);

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  };

  Buffer.prototype.toJSON = function toJSON() {
    return {
      type: 'Buffer',
      data: Array.prototype.slice.call(this._arr || this, 0)
    };
  };

  function base64Slice(buf, start, end) {
    if (start === 0 && end === buf.length) {
      return fromByteArray(buf);
    } else {
      return fromByteArray(buf.slice(start, end));
    }
  }

  function utf8Slice(buf, start, end) {
    end = Math.min(buf.length, end);
    var res = [];
    var i = start;

    while (i < end) {
      var firstByte = buf[i];
      var codePoint = null;
      var bytesPerSequence = firstByte > 0xEF ? 4 : firstByte > 0xDF ? 3 : firstByte > 0xBF ? 2 : 1;

      if (i + bytesPerSequence <= end) {
        var secondByte, thirdByte, fourthByte, tempCodePoint;

        switch (bytesPerSequence) {
          case 1:
            if (firstByte < 0x80) {
              codePoint = firstByte;
            }

            break;

          case 2:
            secondByte = buf[i + 1];

            if ((secondByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0x1F) << 0x6 | secondByte & 0x3F;

              if (tempCodePoint > 0x7F) {
                codePoint = tempCodePoint;
              }
            }

            break;

          case 3:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];

            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | thirdByte & 0x3F;

              if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                codePoint = tempCodePoint;
              }
            }

            break;

          case 4:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            fourthByte = buf[i + 3];

            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | fourthByte & 0x3F;

              if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                codePoint = tempCodePoint;
              }
            }

        }
      }

      if (codePoint === null) {
        // we did not generate a valid codePoint so insert a
        // replacement char (U+FFFD) and advance only 1 byte
        codePoint = 0xFFFD;
        bytesPerSequence = 1;
      } else if (codePoint > 0xFFFF) {
        // encode to utf16 (surrogate pair dance)
        codePoint -= 0x10000;
        res.push(codePoint >>> 10 & 0x3FF | 0xD800);
        codePoint = 0xDC00 | codePoint & 0x3FF;
      }

      res.push(codePoint);
      i += bytesPerSequence;
    }

    return decodeCodePointsArray(res);
  } // Based on http://stackoverflow.com/a/22747272/680742, the browser with
  // the lowest limit is Chrome, with 0x10000 args.
  // We go 1 magnitude less, for safety


  var MAX_ARGUMENTS_LENGTH = 0x1000;

  function decodeCodePointsArray(codePoints) {
    var len = codePoints.length;

    if (len <= MAX_ARGUMENTS_LENGTH) {
      return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
    } // Decode in chunks to avoid "call stack size exceeded".


    var res = '';
    var i = 0;

    while (i < len) {
      res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
    }

    return res;
  }

  function asciiSlice(buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i] & 0x7F);
    }

    return ret;
  }

  function latin1Slice(buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i]);
    }

    return ret;
  }

  function hexSlice(buf, start, end) {
    var len = buf.length;
    if (!start || start < 0) start = 0;
    if (!end || end < 0 || end > len) end = len;
    var out = '';

    for (var i = start; i < end; ++i) {
      out += toHex(buf[i]);
    }

    return out;
  }

  function utf16leSlice(buf, start, end) {
    var bytes = buf.slice(start, end);
    var res = '';

    for (var i = 0; i < bytes.length; i += 2) {
      res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
    }

    return res;
  }

  Buffer.prototype.slice = function slice(start, end) {
    var len = this.length;
    start = ~~start;
    end = end === undefined ? len : ~~end;

    if (start < 0) {
      start += len;
      if (start < 0) start = 0;
    } else if (start > len) {
      start = len;
    }

    if (end < 0) {
      end += len;
      if (end < 0) end = 0;
    } else if (end > len) {
      end = len;
    }

    if (end < start) end = start;
    var newBuf;

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      newBuf = this.subarray(start, end);
      newBuf.__proto__ = Buffer.prototype;
    } else {
      var sliceLen = end - start;
      newBuf = new Buffer(sliceLen, undefined);

      for (var i = 0; i < sliceLen; ++i) {
        newBuf[i] = this[i + start];
      }
    }

    return newBuf;
  };
  /*
   * Need to make sure that buffer isn't trying to write out of bounds.
   */


  function checkOffset(offset, ext, length) {
    if (offset % 1 !== 0 || offset < 0) throw new RangeError('offset is not uint');
    if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length');
  }

  Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);
    var val = this[offset];
    var mul = 1;
    var i = 0;

    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }

    return val;
  };

  Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;

    if (!noAssert) {
      checkOffset(offset, byteLength, this.length);
    }

    var val = this[offset + --byteLength];
    var mul = 1;

    while (byteLength > 0 && (mul *= 0x100)) {
      val += this[offset + --byteLength] * mul;
    }

    return val;
  };

  Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 1, this.length);
    return this[offset];
  };

  Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    return this[offset] | this[offset + 1] << 8;
  };

  Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    return this[offset] << 8 | this[offset + 1];
  };

  Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 0x1000000;
  };

  Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return this[offset] * 0x1000000 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
  };

  Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);
    var val = this[offset];
    var mul = 1;
    var i = 0;

    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }

    mul *= 0x80;
    if (val >= mul) val -= Math.pow(2, 8 * byteLength);
    return val;
  };

  Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);
    var i = byteLength;
    var mul = 1;
    var val = this[offset + --i];

    while (i > 0 && (mul *= 0x100)) {
      val += this[offset + --i] * mul;
    }

    mul *= 0x80;
    if (val >= mul) val -= Math.pow(2, 8 * byteLength);
    return val;
  };

  Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 1, this.length);
    if (!(this[offset] & 0x80)) return this[offset];
    return (0xff - this[offset] + 1) * -1;
  };

  Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset] | this[offset + 1] << 8;
    return val & 0x8000 ? val | 0xFFFF0000 : val;
  };

  Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset + 1] | this[offset] << 8;
    return val & 0x8000 ? val | 0xFFFF0000 : val;
  };

  Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
  };

  Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
  };

  Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return read(this, offset, true, 23, 4);
  };

  Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return read(this, offset, false, 23, 4);
  };

  Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 8, this.length);
    return read(this, offset, true, 52, 8);
  };

  Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 8, this.length);
    return read(this, offset, false, 52, 8);
  };

  function checkInt(buf, value, offset, ext, max, min) {
    if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
    if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
    if (offset + ext > buf.length) throw new RangeError('Index out of range');
  }

  Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength = byteLength | 0;

    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1;
      checkInt(this, value, offset, byteLength, maxBytes, 0);
    }

    var mul = 1;
    var i = 0;
    this[offset] = value & 0xFF;

    while (++i < byteLength && (mul *= 0x100)) {
      this[offset + i] = value / mul & 0xFF;
    }

    return offset + byteLength;
  };

  Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength = byteLength | 0;

    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1;
      checkInt(this, value, offset, byteLength, maxBytes, 0);
    }

    var i = byteLength - 1;
    var mul = 1;
    this[offset + i] = value & 0xFF;

    while (--i >= 0 && (mul *= 0x100)) {
      this[offset + i] = value / mul & 0xFF;
    }

    return offset + byteLength;
  };

  Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
    if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
    this[offset] = value & 0xff;
    return offset + 1;
  };

  function objectWriteUInt16(buf, value, offset, littleEndian) {
    if (value < 0) value = 0xffff + value + 1;

    for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
      buf[offset + i] = (value & 0xff << 8 * (littleEndian ? i : 1 - i)) >>> (littleEndian ? i : 1 - i) * 8;
    }
  }

  Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value & 0xff;
      this[offset + 1] = value >>> 8;
    } else {
      objectWriteUInt16(this, value, offset, true);
    }

    return offset + 2;
  };

  Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 8;
      this[offset + 1] = value & 0xff;
    } else {
      objectWriteUInt16(this, value, offset, false);
    }

    return offset + 2;
  };

  function objectWriteUInt32(buf, value, offset, littleEndian) {
    if (value < 0) value = 0xffffffff + value + 1;

    for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
      buf[offset + i] = value >>> (littleEndian ? i : 3 - i) * 8 & 0xff;
    }
  }

  Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset + 3] = value >>> 24;
      this[offset + 2] = value >>> 16;
      this[offset + 1] = value >>> 8;
      this[offset] = value & 0xff;
    } else {
      objectWriteUInt32(this, value, offset, true);
    }

    return offset + 4;
  };

  Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 0xff;
    } else {
      objectWriteUInt32(this, value, offset, false);
    }

    return offset + 4;
  };

  Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;

    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);
      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    var i = 0;
    var mul = 1;
    var sub = 0;
    this[offset] = value & 0xFF;

    while (++i < byteLength && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
        sub = 1;
      }

      this[offset + i] = (value / mul >> 0) - sub & 0xFF;
    }

    return offset + byteLength;
  };

  Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;

    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);
      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    var i = byteLength - 1;
    var mul = 1;
    var sub = 0;
    this[offset + i] = value & 0xFF;

    while (--i >= 0 && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
        sub = 1;
      }

      this[offset + i] = (value / mul >> 0) - sub & 0xFF;
    }

    return offset + byteLength;
  };

  Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
    if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
    if (value < 0) value = 0xff + value + 1;
    this[offset] = value & 0xff;
    return offset + 1;
  };

  Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value & 0xff;
      this[offset + 1] = value >>> 8;
    } else {
      objectWriteUInt16(this, value, offset, true);
    }

    return offset + 2;
  };

  Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 8;
      this[offset + 1] = value & 0xff;
    } else {
      objectWriteUInt16(this, value, offset, false);
    }

    return offset + 2;
  };

  Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value & 0xff;
      this[offset + 1] = value >>> 8;
      this[offset + 2] = value >>> 16;
      this[offset + 3] = value >>> 24;
    } else {
      objectWriteUInt32(this, value, offset, true);
    }

    return offset + 4;
  };

  Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    if (value < 0) value = 0xffffffff + value + 1;

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 0xff;
    } else {
      objectWriteUInt32(this, value, offset, false);
    }

    return offset + 4;
  };

  function checkIEEE754(buf, value, offset, ext, max, min) {
    if (offset + ext > buf.length) throw new RangeError('Index out of range');
    if (offset < 0) throw new RangeError('Index out of range');
  }

  function writeFloat(buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
    }

    write(buf, value, offset, littleEndian, 23, 4);
    return offset + 4;
  }

  Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert);
  };

  Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
    return writeFloat(this, value, offset, false, noAssert);
  };

  function writeDouble(buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
    }

    write(buf, value, offset, littleEndian, 52, 8);
    return offset + 8;
  }

  Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert);
  };

  Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert);
  }; // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)


  Buffer.prototype.copy = function copy(target, targetStart, start, end) {
    if (!start) start = 0;
    if (!end && end !== 0) end = this.length;
    if (targetStart >= target.length) targetStart = target.length;
    if (!targetStart) targetStart = 0;
    if (end > 0 && end < start) end = start; // Copy 0 bytes; we're done

    if (end === start) return 0;
    if (target.length === 0 || this.length === 0) return 0; // Fatal error conditions

    if (targetStart < 0) {
      throw new RangeError('targetStart out of bounds');
    }

    if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds');
    if (end < 0) throw new RangeError('sourceEnd out of bounds'); // Are we oob?

    if (end > this.length) end = this.length;

    if (target.length - targetStart < end - start) {
      end = target.length - targetStart + start;
    }

    var len = end - start;
    var i;

    if (this === target && start < targetStart && targetStart < end) {
      // descending copy from end
      for (i = len - 1; i >= 0; --i) {
        target[i + targetStart] = this[i + start];
      }
    } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
      // ascending copy from start
      for (i = 0; i < len; ++i) {
        target[i + targetStart] = this[i + start];
      }
    } else {
      Uint8Array.prototype.set.call(target, this.subarray(start, start + len), targetStart);
    }

    return len;
  }; // Usage:
  //    buffer.fill(number[, offset[, end]])
  //    buffer.fill(buffer[, offset[, end]])
  //    buffer.fill(string[, offset[, end]][, encoding])


  Buffer.prototype.fill = function fill(val, start, end, encoding) {
    // Handle string cases:
    if (typeof val === 'string') {
      if (typeof start === 'string') {
        encoding = start;
        start = 0;
        end = this.length;
      } else if (typeof end === 'string') {
        encoding = end;
        end = this.length;
      }

      if (val.length === 1) {
        var code = val.charCodeAt(0);

        if (code < 256) {
          val = code;
        }
      }

      if (encoding !== undefined && typeof encoding !== 'string') {
        throw new TypeError('encoding must be a string');
      }

      if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
        throw new TypeError('Unknown encoding: ' + encoding);
      }
    } else if (typeof val === 'number') {
      val = val & 255;
    } // Invalid ranges are not set to a default, so can range check early.


    if (start < 0 || this.length < start || this.length < end) {
      throw new RangeError('Out of range index');
    }

    if (end <= start) {
      return this;
    }

    start = start >>> 0;
    end = end === undefined ? this.length : end >>> 0;
    if (!val) val = 0;
    var i;

    if (typeof val === 'number') {
      for (i = start; i < end; ++i) {
        this[i] = val;
      }
    } else {
      var bytes = internalIsBuffer(val) ? val : utf8ToBytes(new Buffer(val, encoding).toString());
      var len = bytes.length;

      for (i = 0; i < end - start; ++i) {
        this[i + start] = bytes[i % len];
      }
    }

    return this;
  }; // HELPER FUNCTIONS
  // ================


  var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

  function base64clean(str) {
    // Node strips out invalid characters like \n and \t from the string, base64-js does not
    str = stringtrim(str).replace(INVALID_BASE64_RE, ''); // Node converts strings with length < 2 to ''

    if (str.length < 2) return ''; // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not

    while (str.length % 4 !== 0) {
      str = str + '=';
    }

    return str;
  }

  function stringtrim(str) {
    if (str.trim) return str.trim();
    return str.replace(/^\s+|\s+$/g, '');
  }

  function toHex(n) {
    if (n < 16) return '0' + n.toString(16);
    return n.toString(16);
  }

  function utf8ToBytes(string, units) {
    units = units || Infinity;
    var codePoint;
    var length = string.length;
    var leadSurrogate = null;
    var bytes = [];

    for (var i = 0; i < length; ++i) {
      codePoint = string.charCodeAt(i); // is surrogate component

      if (codePoint > 0xD7FF && codePoint < 0xE000) {
        // last char was a lead
        if (!leadSurrogate) {
          // no lead yet
          if (codePoint > 0xDBFF) {
            // unexpected trail
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            continue;
          } else if (i + 1 === length) {
            // unpaired lead
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            continue;
          } // valid lead


          leadSurrogate = codePoint;
          continue;
        } // 2 leads in a row


        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          leadSurrogate = codePoint;
          continue;
        } // valid surrogate pair


        codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
      } else if (leadSurrogate) {
        // valid bmp char, but last char was a lead
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
      }

      leadSurrogate = null; // encode utf8

      if (codePoint < 0x80) {
        if ((units -= 1) < 0) break;
        bytes.push(codePoint);
      } else if (codePoint < 0x800) {
        if ((units -= 2) < 0) break;
        bytes.push(codePoint >> 0x6 | 0xC0, codePoint & 0x3F | 0x80);
      } else if (codePoint < 0x10000) {
        if ((units -= 3) < 0) break;
        bytes.push(codePoint >> 0xC | 0xE0, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
      } else if (codePoint < 0x110000) {
        if ((units -= 4) < 0) break;
        bytes.push(codePoint >> 0x12 | 0xF0, codePoint >> 0xC & 0x3F | 0x80, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
      } else {
        throw new Error('Invalid code point');
      }
    }

    return bytes;
  }

  function asciiToBytes(str) {
    var byteArray = [];

    for (var i = 0; i < str.length; ++i) {
      // Node's code seems to be doing this and not & 0x7F..
      byteArray.push(str.charCodeAt(i) & 0xFF);
    }

    return byteArray;
  }

  function utf16leToBytes(str, units) {
    var c, hi, lo;
    var byteArray = [];

    for (var i = 0; i < str.length; ++i) {
      if ((units -= 2) < 0) break;
      c = str.charCodeAt(i);
      hi = c >> 8;
      lo = c % 256;
      byteArray.push(lo);
      byteArray.push(hi);
    }

    return byteArray;
  }

  function base64ToBytes(str) {
    return toByteArray(base64clean(str));
  }

  function blitBuffer(src, dst, offset, length) {
    for (var i = 0; i < length; ++i) {
      if (i + offset >= dst.length || i >= src.length) break;
      dst[i + offset] = src[i];
    }

    return i;
  }

  function isnan(val) {
    return val !== val; // eslint-disable-line no-self-compare
  } // the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
  // The _isBuffer check is for Safari 5-7 support, because it's missing
  // Object.prototype.constructor. Remove this eventually


  function isBuffer(obj) {
    return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj));
  }

  function isFastBuffer(obj) {
    return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj);
  } // For Node v0.10 support. Remove this eventually.


  function isSlowBuffer(obj) {
    return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0));
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _isNativeFunction(fn) {
    return Function.toString.call(fn).indexOf("[native code]") !== -1;
  }

  function isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;

    try {
      Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  function _construct(Parent, args, Class) {
    if (isNativeReflectConstruct()) {
      _construct = Reflect.construct;
    } else {
      _construct = function _construct(Parent, args, Class) {
        var a = [null];
        a.push.apply(a, args);
        var Constructor = Function.bind.apply(Parent, a);
        var instance = new Constructor();
        if (Class) _setPrototypeOf(instance, Class.prototype);
        return instance;
      };
    }

    return _construct.apply(null, arguments);
  }

  function _wrapNativeSuper(Class) {
    var _cache = typeof Map === "function" ? new Map() : undefined;

    _wrapNativeSuper = function _wrapNativeSuper(Class) {
      if (Class === null || !_isNativeFunction(Class)) return Class;

      if (typeof Class !== "function") {
        throw new TypeError("Super expression must either be null or a function");
      }

      if (typeof _cache !== "undefined") {
        if (_cache.has(Class)) return _cache.get(Class);

        _cache.set(Class, Wrapper);
      }

      function Wrapper() {
        return _construct(Class, arguments, _getPrototypeOf(this).constructor);
      }

      Wrapper.prototype = Object.create(Class.prototype, {
        constructor: {
          value: Wrapper,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
      return _setPrototypeOf(Wrapper, Class);
    };

    return _wrapNativeSuper(Class);
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  var BZZ_MODE_PROTOCOLS = {
    default: 'bzz:/',
    immutable: 'bzz-immutable:/',
    raw: 'bzz-raw:/'
  };
  var getModeProtocol = function getModeProtocol(mode) {
    return mode && BZZ_MODE_PROTOCOLS[mode] || BZZ_MODE_PROTOCOLS.default;
  };
  var HTTPError =
  /*#__PURE__*/
  function (_Error) {
    _inheritsLoose(HTTPError, _Error);

    function HTTPError(status, message) {
      var _this;

      _this = _Error.call(this, message) || this;

      _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "status", void 0);

      _this.status = status;
      return _this;
    }

    return HTTPError;
  }(_wrapNativeSuper(Error));
  var resOrError = function resOrError(res) {
    return res.ok ? Promise.resolve(res) : Promise.reject(new HTTPError(res.status, res.statusText));
  };
  var resJSON = function resJSON(res) {
    return resOrError(res).then(function (r) {
      return r.json();
    });
  };
  var resText = function resText(res) {
    return resOrError(res).then(function (r) {
      return r.text();
    });
  };

  var BaseBzz =
  /*#__PURE__*/
  function () {
    function BaseBzz(url) {
      _defineProperty(this, "_fetch", void 0);

      _defineProperty(this, "_FormData", void 0);

      _defineProperty(this, "_url", void 0);

      this._url = new URL(url).toString();
    }

    var _proto = BaseBzz.prototype;

    _proto._getDownloadURL = function _getDownloadURL(hash, options, raw) {
      if (raw === void 0) {
        raw = false;
      }

      var protocol = raw ? BZZ_MODE_PROTOCOLS.raw : getModeProtocol(options.mode);
      var url = this._url + protocol + hash;

      if (options.path != null) {
        url += "/" + options.path;
      }

      if (options.mode === 'raw' && options.contentType != null) {
        url += "?content_type=" + options.contentType;
      }

      return url;
    };

    _proto._getUploadURL = function _getUploadURL(options, raw) {
      if (raw === void 0) {
        raw = false;
      } // Default URL to creation


      var url = this._url + BZZ_MODE_PROTOCOLS[raw ? 'raw' : 'default']; // Manifest update if hash is provided

      if (options.manifestHash != null) {
        url += options.manifestHash + "/";

        if (options.path != null) {
          url += options.path;
        }
      }

      return url;
    };

    _proto.hash = function hash(url) {
      return this._fetch(this._url + "bzz-hash:/" + url).then(resText);
    };

    _proto.list = function list(hash, options) {
      if (options === void 0) {
        options = {};
      }

      var url = this._url + "bzz-list:/" + hash;

      if (options.path != null) {
        url += "/" + options.path;
      }

      return this._fetch(url).then(resJSON);
    };

    _proto._download = function _download(hash, options, headers) {
      if (headers === void 0) {
        headers = {};
      }

      var url = this._getDownloadURL(hash, options);

      return this._fetch(url, {
        headers: headers
      }).then(resOrError);
    };

    _proto.download = function download(hash, options) {
      if (options === void 0) {
        options = {};
      }

      return this._download(hash, options);
    };

    _proto._upload = function _upload(body, options, headers, raw) {
      if (headers === void 0) {
        headers = {};
      }

      if (raw === void 0) {
        raw = false;
      }

      var url = this._getUploadURL(options, raw);

      return this._fetch(url, {
        body: body,
        headers: headers,
        method: 'POST'
      }).then(resText);
    };

    _proto.uploadFile = function uploadFile(data, options) {
      if (options === void 0) {
        options = {};
      }

      var body = typeof data === 'string' ? Buffer.from(data) : data;
      var raw = options.contentType == null;
      var headers = {
        'content-length': body.length
      };

      if (!raw) {
        headers['content-type'] = options.contentType;
      }

      return this._upload(body, options, headers, raw);
    };

    _proto.uploadDirectory = function uploadDirectory(_directory, _options) {
      return Promise.reject(new Error('Must be implemented in extending class'));
    };

    _proto.upload = function upload(data, options) {
      if (options === void 0) {
        options = {};
      }

      return typeof data === 'string' || isBuffer(data) ? // $FlowFixMe: Flow doesn't understand type refinement with Buffer check
      this.uploadFile(data, options) : this.uploadDirectory(data, options);
    };

    _proto.deleteResource = function deleteResource(hash, path) {
      var url = this._getUploadURL({
        manifestHash: hash,
        path: path
      });

      return this._fetch(url, {
        method: 'DELETE'
      }).then(resText);
    };

    return BaseBzz;
  }();

  var Bzz =
  /*#__PURE__*/
  function (_BaseBzz) {
    _inheritsLoose(Bzz, _BaseBzz);

    function Bzz(url) {
      var _this;

      _this = _BaseBzz.call(this, url) || this;
      _this._fetch = window.fetch.bind(window);
      _this._FormData = window.FormData.bind(window);
      return _this;
    }

    var _proto = Bzz.prototype;

    _proto.uploadDirectory = function uploadDirectory(_directory) {
      return Promise.reject(new Error('Not Implemented'));
    };

    return Bzz;
  }(BaseBzz);

  // Hex string prefixed with `0x`
  var hexType = function hexType(value) {
    return value;
  };
  var hexEmpty = hexType('0x');
  var encodeHex = function encodeHex(input) {
    var from = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'utf8';
    return hexType('0x' + Buffer.from(input, from).toString('hex'));
  };
  var decodeHex = function decodeHex(value) {
    var to = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'utf8';
    return Buffer.from(value.substr(2), 'hex').toString(to);
  };

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
  var extendStatics = function (d, b) {
    extendStatics = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (d, b) {
      d.__proto__ = b;
    } || function (d, b) {
      for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    };

    return extendStatics(d, b);
  };

  function __extends(d, b) {
    extendStatics(d, b);

    function __() {
      this.constructor = d;
    }

    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  var __assign = function () {
    __assign = Object.assign || function __assign(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];

        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
      }

      return t;
    };

    return __assign.apply(this, arguments);
  };

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  function isFunction(x) {
    return typeof x === 'function';
  }

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  var _enable_super_gross_mode_that_will_cause_bad_things = false;
  var config = {
    Promise: undefined,

    set useDeprecatedSynchronousErrorHandling(value) {
      if (value) {
        var error =
        /*@__PURE__*/
        new Error();
        /*@__PURE__*/

        console.warn('DEPRECATED! RxJS was set to use deprecated synchronous error handling behavior by code at: \n' + error.stack);
      } else if (_enable_super_gross_mode_that_will_cause_bad_things) {
        /*@__PURE__*/
        console.log('RxJS: Back to a better error behavior. Thank you. <3');
      }

      _enable_super_gross_mode_that_will_cause_bad_things = value;
    },

    get useDeprecatedSynchronousErrorHandling() {
      return _enable_super_gross_mode_that_will_cause_bad_things;
    }

  };

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  function hostReportError(err) {
    setTimeout(function () {
      throw err;
    });
  }

  /** PURE_IMPORTS_START _config,_util_hostReportError PURE_IMPORTS_END */
  var empty = {
    closed: true,
    next: function (value) {},
    error: function (err) {
      if (config.useDeprecatedSynchronousErrorHandling) {
        throw err;
      } else {
        hostReportError(err);
      }
    },
    complete: function () {}
  };

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  var isArray$1 = Array.isArray || function (x) {
    return x && typeof x.length === 'number';
  };

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  function isObject(x) {
    return x != null && typeof x === 'object';
  }

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  var errorObject = {
    e: {}
  };

  /** PURE_IMPORTS_START _errorObject PURE_IMPORTS_END */
  var tryCatchTarget;

  function tryCatcher() {
    try {
      return tryCatchTarget.apply(this, arguments);
    } catch (e) {
      errorObject.e = e;
      return errorObject;
    }
  }

  function tryCatch(fn) {
    tryCatchTarget = fn;
    return tryCatcher;
  }

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  function UnsubscriptionErrorImpl(errors) {
    Error.call(this);
    this.message = errors ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function (err, i) {
      return i + 1 + ") " + err.toString();
    }).join('\n  ') : '';
    this.name = 'UnsubscriptionError';
    this.errors = errors;
    return this;
  }

  UnsubscriptionErrorImpl.prototype =
  /*@__PURE__*/
  Object.create(Error.prototype);
  var UnsubscriptionError = UnsubscriptionErrorImpl;

  /** PURE_IMPORTS_START _util_isArray,_util_isObject,_util_isFunction,_util_tryCatch,_util_errorObject,_util_UnsubscriptionError PURE_IMPORTS_END */

  var Subscription =
  /*@__PURE__*/
  function () {
    function Subscription(unsubscribe) {
      this.closed = false;
      this._parent = null;
      this._parents = null;
      this._subscriptions = null;

      if (unsubscribe) {
        this._unsubscribe = unsubscribe;
      }
    }

    Subscription.prototype.unsubscribe = function () {
      var hasErrors = false;
      var errors;

      if (this.closed) {
        return;
      }

      var _a = this,
          _parent = _a._parent,
          _parents = _a._parents,
          _unsubscribe = _a._unsubscribe,
          _subscriptions = _a._subscriptions;

      this.closed = true;
      this._parent = null;
      this._parents = null;
      this._subscriptions = null;
      var index = -1;
      var len = _parents ? _parents.length : 0;

      while (_parent) {
        _parent.remove(this);

        _parent = ++index < len && _parents[index] || null;
      }

      if (isFunction(_unsubscribe)) {
        var trial = tryCatch(_unsubscribe).call(this);

        if (trial === errorObject) {
          hasErrors = true;
          errors = errors || (errorObject.e instanceof UnsubscriptionError ? flattenUnsubscriptionErrors(errorObject.e.errors) : [errorObject.e]);
        }
      }

      if (isArray$1(_subscriptions)) {
        index = -1;
        len = _subscriptions.length;

        while (++index < len) {
          var sub = _subscriptions[index];

          if (isObject(sub)) {
            var trial = tryCatch(sub.unsubscribe).call(sub);

            if (trial === errorObject) {
              hasErrors = true;
              errors = errors || [];
              var err = errorObject.e;

              if (err instanceof UnsubscriptionError) {
                errors = errors.concat(flattenUnsubscriptionErrors(err.errors));
              } else {
                errors.push(err);
              }
            }
          }
        }
      }

      if (hasErrors) {
        throw new UnsubscriptionError(errors);
      }
    };

    Subscription.prototype.add = function (teardown) {
      if (!teardown || teardown === Subscription.EMPTY) {
        return Subscription.EMPTY;
      }

      if (teardown === this) {
        return this;
      }

      var subscription = teardown;

      switch (typeof teardown) {
        case 'function':
          subscription = new Subscription(teardown);

        case 'object':
          if (subscription.closed || typeof subscription.unsubscribe !== 'function') {
            return subscription;
          } else if (this.closed) {
            subscription.unsubscribe();
            return subscription;
          } else if (typeof subscription._addParent !== 'function') {
            var tmp = subscription;
            subscription = new Subscription();
            subscription._subscriptions = [tmp];
          }

          break;

        default:
          throw new Error('unrecognized teardown ' + teardown + ' added to Subscription.');
      }

      var subscriptions = this._subscriptions || (this._subscriptions = []);
      subscriptions.push(subscription);

      subscription._addParent(this);

      return subscription;
    };

    Subscription.prototype.remove = function (subscription) {
      var subscriptions = this._subscriptions;

      if (subscriptions) {
        var subscriptionIndex = subscriptions.indexOf(subscription);

        if (subscriptionIndex !== -1) {
          subscriptions.splice(subscriptionIndex, 1);
        }
      }
    };

    Subscription.prototype._addParent = function (parent) {
      var _a = this,
          _parent = _a._parent,
          _parents = _a._parents;

      if (!_parent || _parent === parent) {
        this._parent = parent;
      } else if (!_parents) {
        this._parents = [parent];
      } else if (_parents.indexOf(parent) === -1) {
        _parents.push(parent);
      }
    };

    Subscription.EMPTY = function (empty) {
      empty.closed = true;
      return empty;
    }(new Subscription());

    return Subscription;
  }();

  function flattenUnsubscriptionErrors(errors) {
    return errors.reduce(function (errs, err) {
      return errs.concat(err instanceof UnsubscriptionError ? err.errors : err);
    }, []);
  }

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  var rxSubscriber = typeof Symbol === 'function' && typeof Symbol.for === 'function' ?
  /*@__PURE__*/
  Symbol.for('rxSubscriber') : '@@rxSubscriber';

  /** PURE_IMPORTS_START tslib,_util_isFunction,_Observer,_Subscription,_internal_symbol_rxSubscriber,_config,_util_hostReportError PURE_IMPORTS_END */

  var Subscriber =
  /*@__PURE__*/
  function (_super) {
    __extends(Subscriber, _super);

    function Subscriber(destinationOrNext, error, complete) {
      var _this = _super.call(this) || this;

      _this.syncErrorValue = null;
      _this.syncErrorThrown = false;
      _this.syncErrorThrowable = false;
      _this.isStopped = false;
      _this._parentSubscription = null;

      switch (arguments.length) {
        case 0:
          _this.destination = empty;
          break;

        case 1:
          if (!destinationOrNext) {
            _this.destination = empty;
            break;
          }

          if (typeof destinationOrNext === 'object') {
            if (isTrustedSubscriber(destinationOrNext)) {
              var trustedSubscriber = destinationOrNext[rxSubscriber]();
              _this.syncErrorThrowable = trustedSubscriber.syncErrorThrowable;
              _this.destination = trustedSubscriber;

              trustedSubscriber._addParentTeardownLogic(_this);
            } else {
              _this.syncErrorThrowable = true;
              _this.destination = new SafeSubscriber(_this, destinationOrNext);
            }

            break;
          }

        default:
          _this.syncErrorThrowable = true;
          _this.destination = new SafeSubscriber(_this, destinationOrNext, error, complete);
          break;
      }

      return _this;
    }

    Subscriber.prototype[rxSubscriber] = function () {
      return this;
    };

    Subscriber.create = function (next, error, complete) {
      var subscriber = new Subscriber(next, error, complete);
      subscriber.syncErrorThrowable = false;
      return subscriber;
    };

    Subscriber.prototype.next = function (value) {
      if (!this.isStopped) {
        this._next(value);
      }
    };

    Subscriber.prototype.error = function (err) {
      if (!this.isStopped) {
        this.isStopped = true;

        this._error(err);

        this._unsubscribeParentSubscription();
      }
    };

    Subscriber.prototype.complete = function () {
      if (!this.isStopped) {
        this.isStopped = true;

        this._complete();

        this._unsubscribeParentSubscription();
      }
    };

    Subscriber.prototype.unsubscribe = function () {
      if (this.closed) {
        return;
      }

      this.isStopped = true;

      _super.prototype.unsubscribe.call(this);
    };

    Subscriber.prototype._next = function (value) {
      this.destination.next(value);
    };

    Subscriber.prototype._error = function (err) {
      this.destination.error(err);
      this.unsubscribe();
    };

    Subscriber.prototype._complete = function () {
      this.destination.complete();
      this.unsubscribe();
    };

    Subscriber.prototype._addParentTeardownLogic = function (parentTeardownLogic) {
      if (parentTeardownLogic !== this) {
        this._parentSubscription = this.add(parentTeardownLogic);
      }
    };

    Subscriber.prototype._unsubscribeParentSubscription = function () {
      if (this._parentSubscription !== null) {
        this._parentSubscription.unsubscribe();
      }
    };

    Subscriber.prototype._unsubscribeAndRecycle = function () {
      var _a = this,
          _parent = _a._parent,
          _parents = _a._parents;

      this._parent = null;
      this._parents = null;
      this.unsubscribe();
      this.closed = false;
      this.isStopped = false;
      this._parent = _parent;
      this._parents = _parents;
      this._parentSubscription = null;
      return this;
    };

    return Subscriber;
  }(Subscription);

  var SafeSubscriber =
  /*@__PURE__*/
  function (_super) {
    __extends(SafeSubscriber, _super);

    function SafeSubscriber(_parentSubscriber, observerOrNext, error, complete) {
      var _this = _super.call(this) || this;

      _this._parentSubscriber = _parentSubscriber;
      var next;
      var context = _this;

      if (isFunction(observerOrNext)) {
        next = observerOrNext;
      } else if (observerOrNext) {
        next = observerOrNext.next;
        error = observerOrNext.error;
        complete = observerOrNext.complete;

        if (observerOrNext !== empty) {
          context = Object.create(observerOrNext);

          if (isFunction(context.unsubscribe)) {
            _this.add(context.unsubscribe.bind(context));
          }

          context.unsubscribe = _this.unsubscribe.bind(_this);
        }
      }

      _this._context = context;
      _this._next = next;
      _this._error = error;
      _this._complete = complete;
      return _this;
    }

    SafeSubscriber.prototype.next = function (value) {
      if (!this.isStopped && this._next) {
        var _parentSubscriber = this._parentSubscriber;

        if (!config.useDeprecatedSynchronousErrorHandling || !_parentSubscriber.syncErrorThrowable) {
          this.__tryOrUnsub(this._next, value);
        } else if (this.__tryOrSetError(_parentSubscriber, this._next, value)) {
          this.unsubscribe();
        }
      }
    };

    SafeSubscriber.prototype.error = function (err) {
      if (!this.isStopped) {
        var _parentSubscriber = this._parentSubscriber;
        var useDeprecatedSynchronousErrorHandling = config.useDeprecatedSynchronousErrorHandling;

        if (this._error) {
          if (!useDeprecatedSynchronousErrorHandling || !_parentSubscriber.syncErrorThrowable) {
            this.__tryOrUnsub(this._error, err);

            this.unsubscribe();
          } else {
            this.__tryOrSetError(_parentSubscriber, this._error, err);

            this.unsubscribe();
          }
        } else if (!_parentSubscriber.syncErrorThrowable) {
          this.unsubscribe();

          if (useDeprecatedSynchronousErrorHandling) {
            throw err;
          }

          hostReportError(err);
        } else {
          if (useDeprecatedSynchronousErrorHandling) {
            _parentSubscriber.syncErrorValue = err;
            _parentSubscriber.syncErrorThrown = true;
          } else {
            hostReportError(err);
          }

          this.unsubscribe();
        }
      }
    };

    SafeSubscriber.prototype.complete = function () {
      var _this = this;

      if (!this.isStopped) {
        var _parentSubscriber = this._parentSubscriber;

        if (this._complete) {
          var wrappedComplete = function () {
            return _this._complete.call(_this._context);
          };

          if (!config.useDeprecatedSynchronousErrorHandling || !_parentSubscriber.syncErrorThrowable) {
            this.__tryOrUnsub(wrappedComplete);

            this.unsubscribe();
          } else {
            this.__tryOrSetError(_parentSubscriber, wrappedComplete);

            this.unsubscribe();
          }
        } else {
          this.unsubscribe();
        }
      }
    };

    SafeSubscriber.prototype.__tryOrUnsub = function (fn, value) {
      try {
        fn.call(this._context, value);
      } catch (err) {
        this.unsubscribe();

        if (config.useDeprecatedSynchronousErrorHandling) {
          throw err;
        } else {
          hostReportError(err);
        }
      }
    };

    SafeSubscriber.prototype.__tryOrSetError = function (parent, fn, value) {
      if (!config.useDeprecatedSynchronousErrorHandling) {
        throw new Error('bad call');
      }

      try {
        fn.call(this._context, value);
      } catch (err) {
        if (config.useDeprecatedSynchronousErrorHandling) {
          parent.syncErrorValue = err;
          parent.syncErrorThrown = true;
          return true;
        } else {
          hostReportError(err);
          return true;
        }
      }

      return false;
    };

    SafeSubscriber.prototype._unsubscribe = function () {
      var _parentSubscriber = this._parentSubscriber;
      this._context = null;
      this._parentSubscriber = null;

      _parentSubscriber.unsubscribe();
    };

    return SafeSubscriber;
  }(Subscriber);

  function isTrustedSubscriber(obj) {
    return obj instanceof Subscriber || '_addParentTeardownLogic' in obj && obj[rxSubscriber];
  }

  /** PURE_IMPORTS_START _Subscriber,_symbol_rxSubscriber,_Observer PURE_IMPORTS_END */
  function toSubscriber(nextOrObserver, error, complete) {
    if (nextOrObserver) {
      if (nextOrObserver instanceof Subscriber) {
        return nextOrObserver;
      }

      if (nextOrObserver[rxSubscriber]) {
        return nextOrObserver[rxSubscriber]();
      }
    }

    if (!nextOrObserver && !error && !complete) {
      return new Subscriber(empty);
    }

    return new Subscriber(nextOrObserver, error, complete);
  }

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  var observable = typeof Symbol === 'function' && Symbol.observable || '@@observable';

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  function noop() {}

  /** PURE_IMPORTS_START _noop PURE_IMPORTS_END */
  function pipeFromArray(fns) {
    if (!fns) {
      return noop;
    }

    if (fns.length === 1) {
      return fns[0];
    }

    return function piped(input) {
      return fns.reduce(function (prev, fn) {
        return fn(prev);
      }, input);
    };
  }

  /** PURE_IMPORTS_START _util_toSubscriber,_internal_symbol_observable,_util_pipe,_config PURE_IMPORTS_END */

  var Observable =
  /*@__PURE__*/
  function () {
    function Observable(subscribe) {
      this._isScalar = false;

      if (subscribe) {
        this._subscribe = subscribe;
      }
    }

    Observable.prototype.lift = function (operator) {
      var observable$$1 = new Observable();
      observable$$1.source = this;
      observable$$1.operator = operator;
      return observable$$1;
    };

    Observable.prototype.subscribe = function (observerOrNext, error, complete) {
      var operator = this.operator;
      var sink = toSubscriber(observerOrNext, error, complete);

      if (operator) {
        operator.call(sink, this.source);
      } else {
        sink._addParentTeardownLogic(this.source || config.useDeprecatedSynchronousErrorHandling && !sink.syncErrorThrowable ? this._subscribe(sink) : this._trySubscribe(sink));
      }

      if (config.useDeprecatedSynchronousErrorHandling) {
        if (sink.syncErrorThrowable) {
          sink.syncErrorThrowable = false;

          if (sink.syncErrorThrown) {
            throw sink.syncErrorValue;
          }
        }
      }

      return sink;
    };

    Observable.prototype._trySubscribe = function (sink) {
      try {
        return this._subscribe(sink);
      } catch (err) {
        if (config.useDeprecatedSynchronousErrorHandling) {
          sink.syncErrorThrown = true;
          sink.syncErrorValue = err;
        }

        sink.error(err);
      }
    };

    Observable.prototype.forEach = function (next, promiseCtor) {
      var _this = this;

      promiseCtor = getPromiseCtor(promiseCtor);
      return new promiseCtor(function (resolve, reject) {
        var subscription;
        subscription = _this.subscribe(function (value) {
          try {
            next(value);
          } catch (err) {
            reject(err);

            if (subscription) {
              subscription.unsubscribe();
            }
          }
        }, reject, resolve);
      });
    };

    Observable.prototype._subscribe = function (subscriber) {
      var source = this.source;
      return source && source.subscribe(subscriber);
    };

    Observable.prototype[observable] = function () {
      return this;
    };

    Observable.prototype.pipe = function () {
      var operations = [];

      for (var _i = 0; _i < arguments.length; _i++) {
        operations[_i] = arguments[_i];
      }

      if (operations.length === 0) {
        return this;
      }

      return pipeFromArray(operations)(this);
    };

    Observable.prototype.toPromise = function (promiseCtor) {
      var _this = this;

      promiseCtor = getPromiseCtor(promiseCtor);
      return new promiseCtor(function (resolve, reject) {
        var value;

        _this.subscribe(function (x) {
          return value = x;
        }, function (err) {
          return reject(err);
        }, function () {
          return resolve(value);
        });
      });
    };

    Observable.create = function (subscribe) {
      return new Observable(subscribe);
    };

    return Observable;
  }();

  function getPromiseCtor(promiseCtor) {
    if (!promiseCtor) {
      promiseCtor = config.Promise || Promise;
    }

    if (!promiseCtor) {
      throw new Error('no Promise impl found');
    }

    return promiseCtor;
  }

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  function ObjectUnsubscribedErrorImpl() {
    Error.call(this);
    this.message = 'object unsubscribed';
    this.name = 'ObjectUnsubscribedError';
    return this;
  }

  ObjectUnsubscribedErrorImpl.prototype =
  /*@__PURE__*/
  Object.create(Error.prototype);
  var ObjectUnsubscribedError = ObjectUnsubscribedErrorImpl;

  /** PURE_IMPORTS_START tslib,_Subscription PURE_IMPORTS_END */

  var SubjectSubscription =
  /*@__PURE__*/
  function (_super) {
    __extends(SubjectSubscription, _super);

    function SubjectSubscription(subject, subscriber) {
      var _this = _super.call(this) || this;

      _this.subject = subject;
      _this.subscriber = subscriber;
      _this.closed = false;
      return _this;
    }

    SubjectSubscription.prototype.unsubscribe = function () {
      if (this.closed) {
        return;
      }

      this.closed = true;
      var subject = this.subject;
      var observers = subject.observers;
      this.subject = null;

      if (!observers || observers.length === 0 || subject.isStopped || subject.closed) {
        return;
      }

      var subscriberIndex = observers.indexOf(this.subscriber);

      if (subscriberIndex !== -1) {
        observers.splice(subscriberIndex, 1);
      }
    };

    return SubjectSubscription;
  }(Subscription);

  /** PURE_IMPORTS_START tslib,_Observable,_Subscriber,_Subscription,_util_ObjectUnsubscribedError,_SubjectSubscription,_internal_symbol_rxSubscriber PURE_IMPORTS_END */

  var SubjectSubscriber =
  /*@__PURE__*/
  function (_super) {
    __extends(SubjectSubscriber, _super);

    function SubjectSubscriber(destination) {
      var _this = _super.call(this, destination) || this;

      _this.destination = destination;
      return _this;
    }

    return SubjectSubscriber;
  }(Subscriber);

  var Subject =
  /*@__PURE__*/
  function (_super) {
    __extends(Subject, _super);

    function Subject() {
      var _this = _super.call(this) || this;

      _this.observers = [];
      _this.closed = false;
      _this.isStopped = false;
      _this.hasError = false;
      _this.thrownError = null;
      return _this;
    }

    Subject.prototype[rxSubscriber] = function () {
      return new SubjectSubscriber(this);
    };

    Subject.prototype.lift = function (operator) {
      var subject = new AnonymousSubject(this, this);
      subject.operator = operator;
      return subject;
    };

    Subject.prototype.next = function (value) {
      if (this.closed) {
        throw new ObjectUnsubscribedError();
      }

      if (!this.isStopped) {
        var observers = this.observers;
        var len = observers.length;
        var copy = observers.slice();

        for (var i = 0; i < len; i++) {
          copy[i].next(value);
        }
      }
    };

    Subject.prototype.error = function (err) {
      if (this.closed) {
        throw new ObjectUnsubscribedError();
      }

      this.hasError = true;
      this.thrownError = err;
      this.isStopped = true;
      var observers = this.observers;
      var len = observers.length;
      var copy = observers.slice();

      for (var i = 0; i < len; i++) {
        copy[i].error(err);
      }

      this.observers.length = 0;
    };

    Subject.prototype.complete = function () {
      if (this.closed) {
        throw new ObjectUnsubscribedError();
      }

      this.isStopped = true;
      var observers = this.observers;
      var len = observers.length;
      var copy = observers.slice();

      for (var i = 0; i < len; i++) {
        copy[i].complete();
      }

      this.observers.length = 0;
    };

    Subject.prototype.unsubscribe = function () {
      this.isStopped = true;
      this.closed = true;
      this.observers = null;
    };

    Subject.prototype._trySubscribe = function (subscriber) {
      if (this.closed) {
        throw new ObjectUnsubscribedError();
      } else {
        return _super.prototype._trySubscribe.call(this, subscriber);
      }
    };

    Subject.prototype._subscribe = function (subscriber) {
      if (this.closed) {
        throw new ObjectUnsubscribedError();
      } else if (this.hasError) {
        subscriber.error(this.thrownError);
        return Subscription.EMPTY;
      } else if (this.isStopped) {
        subscriber.complete();
        return Subscription.EMPTY;
      } else {
        this.observers.push(subscriber);
        return new SubjectSubscription(this, subscriber);
      }
    };

    Subject.prototype.asObservable = function () {
      var observable = new Observable();
      observable.source = this;
      return observable;
    };

    Subject.create = function (destination, source) {
      return new AnonymousSubject(destination, source);
    };

    return Subject;
  }(Observable);

  var AnonymousSubject =
  /*@__PURE__*/
  function (_super) {
    __extends(AnonymousSubject, _super);

    function AnonymousSubject(destination, source) {
      var _this = _super.call(this) || this;

      _this.destination = destination;
      _this.source = source;
      return _this;
    }

    AnonymousSubject.prototype.next = function (value) {
      var destination = this.destination;

      if (destination && destination.next) {
        destination.next(value);
      }
    };

    AnonymousSubject.prototype.error = function (err) {
      var destination = this.destination;

      if (destination && destination.error) {
        this.destination.error(err);
      }
    };

    AnonymousSubject.prototype.complete = function () {
      var destination = this.destination;

      if (destination && destination.complete) {
        this.destination.complete();
      }
    };

    AnonymousSubject.prototype._subscribe = function (subscriber) {
      var source = this.source;

      if (source) {
        return this.source.subscribe(subscriber);
      } else {
        return Subscription.EMPTY;
      }
    };

    return AnonymousSubject;
  }(Subject);

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
  function refCount() {
    return function refCountOperatorFunction(source) {
      return source.lift(new RefCountOperator(source));
    };
  }

  var RefCountOperator =
  /*@__PURE__*/
  function () {
    function RefCountOperator(connectable) {
      this.connectable = connectable;
    }

    RefCountOperator.prototype.call = function (subscriber, source) {
      var connectable = this.connectable;
      connectable._refCount++;
      var refCounter = new RefCountSubscriber(subscriber, connectable);
      var subscription = source.subscribe(refCounter);

      if (!refCounter.closed) {
        refCounter.connection = connectable.connect();
      }

      return subscription;
    };

    return RefCountOperator;
  }();

  var RefCountSubscriber =
  /*@__PURE__*/
  function (_super) {
    __extends(RefCountSubscriber, _super);

    function RefCountSubscriber(destination, connectable) {
      var _this = _super.call(this, destination) || this;

      _this.connectable = connectable;
      return _this;
    }

    RefCountSubscriber.prototype._unsubscribe = function () {
      var connectable = this.connectable;

      if (!connectable) {
        this.connection = null;
        return;
      }

      this.connectable = null;
      var refCount = connectable._refCount;

      if (refCount <= 0) {
        this.connection = null;
        return;
      }

      connectable._refCount = refCount - 1;

      if (refCount > 1) {
        this.connection = null;
        return;
      }

      var connection = this.connection;
      var sharedConnection = connectable._connection;
      this.connection = null;

      if (sharedConnection && (!connection || sharedConnection === connection)) {
        sharedConnection.unsubscribe();
      }
    };

    return RefCountSubscriber;
  }(Subscriber);

  /** PURE_IMPORTS_START tslib,_Subject,_Observable,_Subscriber,_Subscription,_operators_refCount PURE_IMPORTS_END */

  var ConnectableObservable =
  /*@__PURE__*/
  function (_super) {
    __extends(ConnectableObservable, _super);

    function ConnectableObservable(source, subjectFactory) {
      var _this = _super.call(this) || this;

      _this.source = source;
      _this.subjectFactory = subjectFactory;
      _this._refCount = 0;
      _this._isComplete = false;
      return _this;
    }

    ConnectableObservable.prototype._subscribe = function (subscriber) {
      return this.getSubject().subscribe(subscriber);
    };

    ConnectableObservable.prototype.getSubject = function () {
      var subject = this._subject;

      if (!subject || subject.isStopped) {
        this._subject = this.subjectFactory();
      }

      return this._subject;
    };

    ConnectableObservable.prototype.connect = function () {
      var connection = this._connection;

      if (!connection) {
        this._isComplete = false;
        connection = this._connection = new Subscription();
        connection.add(this.source.subscribe(new ConnectableSubscriber(this.getSubject(), this)));

        if (connection.closed) {
          this._connection = null;
          connection = Subscription.EMPTY;
        } else {
          this._connection = connection;
        }
      }

      return connection;
    };

    ConnectableObservable.prototype.refCount = function () {
      return refCount()(this);
    };

    return ConnectableObservable;
  }(Observable);
  var connectableProto = ConnectableObservable.prototype;
  var connectableObservableDescriptor = {
    operator: {
      value: null
    },
    _refCount: {
      value: 0,
      writable: true
    },
    _subject: {
      value: null,
      writable: true
    },
    _connection: {
      value: null,
      writable: true
    },
    _subscribe: {
      value: connectableProto._subscribe
    },
    _isComplete: {
      value: connectableProto._isComplete,
      writable: true
    },
    getSubject: {
      value: connectableProto.getSubject
    },
    connect: {
      value: connectableProto.connect
    },
    refCount: {
      value: connectableProto.refCount
    }
  };

  var ConnectableSubscriber =
  /*@__PURE__*/
  function (_super) {
    __extends(ConnectableSubscriber, _super);

    function ConnectableSubscriber(destination, connectable) {
      var _this = _super.call(this, destination) || this;

      _this.connectable = connectable;
      return _this;
    }

    ConnectableSubscriber.prototype._error = function (err) {
      this._unsubscribe();

      _super.prototype._error.call(this, err);
    };

    ConnectableSubscriber.prototype._complete = function () {
      this.connectable._isComplete = true;

      this._unsubscribe();

      _super.prototype._complete.call(this);
    };

    ConnectableSubscriber.prototype._unsubscribe = function () {
      var connectable = this.connectable;

      if (connectable) {
        this.connectable = null;
        var connection = connectable._connection;
        connectable._refCount = 0;
        connectable._subject = null;
        connectable._connection = null;

        if (connection) {
          connection.unsubscribe();
        }
      }
    };

    return ConnectableSubscriber;
  }(SubjectSubscriber);

  var RefCountSubscriber$1 =
  /*@__PURE__*/
  function (_super) {
    __extends(RefCountSubscriber, _super);

    function RefCountSubscriber(destination, connectable) {
      var _this = _super.call(this, destination) || this;

      _this.connectable = connectable;
      return _this;
    }

    RefCountSubscriber.prototype._unsubscribe = function () {
      var connectable = this.connectable;

      if (!connectable) {
        this.connection = null;
        return;
      }

      this.connectable = null;
      var refCount$$1 = connectable._refCount;

      if (refCount$$1 <= 0) {
        this.connection = null;
        return;
      }

      connectable._refCount = refCount$$1 - 1;

      if (refCount$$1 > 1) {
        this.connection = null;
        return;
      }

      var connection = this.connection;
      var sharedConnection = connectable._connection;
      this.connection = null;

      if (sharedConnection && (!connection || sharedConnection === connection)) {
        sharedConnection.unsubscribe();
      }
    };

    return RefCountSubscriber;
  }(Subscriber);

  /** PURE_IMPORTS_START tslib,_Subscriber,_Subscription,_Observable,_Subject PURE_IMPORTS_END */

  var GroupBySubscriber =
  /*@__PURE__*/
  function (_super) {
    __extends(GroupBySubscriber, _super);

    function GroupBySubscriber(destination, keySelector, elementSelector, durationSelector, subjectSelector) {
      var _this = _super.call(this, destination) || this;

      _this.keySelector = keySelector;
      _this.elementSelector = elementSelector;
      _this.durationSelector = durationSelector;
      _this.subjectSelector = subjectSelector;
      _this.groups = null;
      _this.attemptedToUnsubscribe = false;
      _this.count = 0;
      return _this;
    }

    GroupBySubscriber.prototype._next = function (value) {
      var key;

      try {
        key = this.keySelector(value);
      } catch (err) {
        this.error(err);
        return;
      }

      this._group(value, key);
    };

    GroupBySubscriber.prototype._group = function (value, key) {
      var groups = this.groups;

      if (!groups) {
        groups = this.groups = new Map();
      }

      var group = groups.get(key);
      var element;

      if (this.elementSelector) {
        try {
          element = this.elementSelector(value);
        } catch (err) {
          this.error(err);
        }
      } else {
        element = value;
      }

      if (!group) {
        group = this.subjectSelector ? this.subjectSelector() : new Subject();
        groups.set(key, group);
        var groupedObservable = new GroupedObservable(key, group, this);
        this.destination.next(groupedObservable);

        if (this.durationSelector) {
          var duration = void 0;

          try {
            duration = this.durationSelector(new GroupedObservable(key, group));
          } catch (err) {
            this.error(err);
            return;
          }

          this.add(duration.subscribe(new GroupDurationSubscriber(key, group, this)));
        }
      }

      if (!group.closed) {
        group.next(element);
      }
    };

    GroupBySubscriber.prototype._error = function (err) {
      var groups = this.groups;

      if (groups) {
        groups.forEach(function (group, key) {
          group.error(err);
        });
        groups.clear();
      }

      this.destination.error(err);
    };

    GroupBySubscriber.prototype._complete = function () {
      var groups = this.groups;

      if (groups) {
        groups.forEach(function (group, key) {
          group.complete();
        });
        groups.clear();
      }

      this.destination.complete();
    };

    GroupBySubscriber.prototype.removeGroup = function (key) {
      this.groups.delete(key);
    };

    GroupBySubscriber.prototype.unsubscribe = function () {
      if (!this.closed) {
        this.attemptedToUnsubscribe = true;

        if (this.count === 0) {
          _super.prototype.unsubscribe.call(this);
        }
      }
    };

    return GroupBySubscriber;
  }(Subscriber);

  var GroupDurationSubscriber =
  /*@__PURE__*/
  function (_super) {
    __extends(GroupDurationSubscriber, _super);

    function GroupDurationSubscriber(key, group, parent) {
      var _this = _super.call(this, group) || this;

      _this.key = key;
      _this.group = group;
      _this.parent = parent;
      return _this;
    }

    GroupDurationSubscriber.prototype._next = function (value) {
      this.complete();
    };

    GroupDurationSubscriber.prototype._unsubscribe = function () {
      var _a = this,
          parent = _a.parent,
          key = _a.key;

      this.key = this.parent = null;

      if (parent) {
        parent.removeGroup(key);
      }
    };

    return GroupDurationSubscriber;
  }(Subscriber);

  var GroupedObservable =
  /*@__PURE__*/
  function (_super) {
    __extends(GroupedObservable, _super);

    function GroupedObservable(key, groupSubject, refCountSubscription) {
      var _this = _super.call(this) || this;

      _this.key = key;
      _this.groupSubject = groupSubject;
      _this.refCountSubscription = refCountSubscription;
      return _this;
    }

    GroupedObservable.prototype._subscribe = function (subscriber) {
      var subscription = new Subscription();

      var _a = this,
          refCountSubscription = _a.refCountSubscription,
          groupSubject = _a.groupSubject;

      if (refCountSubscription && !refCountSubscription.closed) {
        subscription.add(new InnerRefCountSubscription(refCountSubscription));
      }

      subscription.add(groupSubject.subscribe(subscriber));
      return subscription;
    };

    return GroupedObservable;
  }(Observable);

  var InnerRefCountSubscription =
  /*@__PURE__*/
  function (_super) {
    __extends(InnerRefCountSubscription, _super);

    function InnerRefCountSubscription(parent) {
      var _this = _super.call(this) || this;

      _this.parent = parent;
      parent.count++;
      return _this;
    }

    InnerRefCountSubscription.prototype.unsubscribe = function () {
      var parent = this.parent;

      if (!parent.closed && !this.closed) {
        _super.prototype.unsubscribe.call(this);

        parent.count -= 1;

        if (parent.count === 0 && parent.attemptedToUnsubscribe) {
          parent.unsubscribe();
        }
      }
    };

    return InnerRefCountSubscription;
  }(Subscription);

  /** PURE_IMPORTS_START tslib,_Subject,_util_ObjectUnsubscribedError PURE_IMPORTS_END */

  var BehaviorSubject =
  /*@__PURE__*/
  function (_super) {
    __extends(BehaviorSubject, _super);

    function BehaviorSubject(_value) {
      var _this = _super.call(this) || this;

      _this._value = _value;
      return _this;
    }

    Object.defineProperty(BehaviorSubject.prototype, "value", {
      get: function () {
        return this.getValue();
      },
      enumerable: true,
      configurable: true
    });

    BehaviorSubject.prototype._subscribe = function (subscriber) {
      var subscription = _super.prototype._subscribe.call(this, subscriber);

      if (subscription && !subscription.closed) {
        subscriber.next(this._value);
      }

      return subscription;
    };

    BehaviorSubject.prototype.getValue = function () {
      if (this.hasError) {
        throw this.thrownError;
      } else if (this.closed) {
        throw new ObjectUnsubscribedError();
      } else {
        return this._value;
      }
    };

    BehaviorSubject.prototype.next = function (value) {
      _super.prototype.next.call(this, this._value = value);
    };

    return BehaviorSubject;
  }(Subject);

  /** PURE_IMPORTS_START tslib,_Subscription PURE_IMPORTS_END */

  var Action =
  /*@__PURE__*/
  function (_super) {
    __extends(Action, _super);

    function Action(scheduler, work) {
      return _super.call(this) || this;
    }

    Action.prototype.schedule = function (state, delay) {
      if (delay === void 0) {
        delay = 0;
      }

      return this;
    };

    return Action;
  }(Subscription);

  /** PURE_IMPORTS_START tslib,_Action PURE_IMPORTS_END */

  var AsyncAction =
  /*@__PURE__*/
  function (_super) {
    __extends(AsyncAction, _super);

    function AsyncAction(scheduler, work) {
      var _this = _super.call(this, scheduler, work) || this;

      _this.scheduler = scheduler;
      _this.work = work;
      _this.pending = false;
      return _this;
    }

    AsyncAction.prototype.schedule = function (state, delay) {
      if (delay === void 0) {
        delay = 0;
      }

      if (this.closed) {
        return this;
      }

      this.state = state;
      var id = this.id;
      var scheduler = this.scheduler;

      if (id != null) {
        this.id = this.recycleAsyncId(scheduler, id, delay);
      }

      this.pending = true;
      this.delay = delay;
      this.id = this.id || this.requestAsyncId(scheduler, this.id, delay);
      return this;
    };

    AsyncAction.prototype.requestAsyncId = function (scheduler, id, delay) {
      if (delay === void 0) {
        delay = 0;
      }

      return setInterval(scheduler.flush.bind(scheduler, this), delay);
    };

    AsyncAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
      if (delay === void 0) {
        delay = 0;
      }

      if (delay !== null && this.delay === delay && this.pending === false) {
        return id;
      }

      clearInterval(id);
    };

    AsyncAction.prototype.execute = function (state, delay) {
      if (this.closed) {
        return new Error('executing a cancelled action');
      }

      this.pending = false;

      var error = this._execute(state, delay);

      if (error) {
        return error;
      } else if (this.pending === false && this.id != null) {
        this.id = this.recycleAsyncId(this.scheduler, this.id, null);
      }
    };

    AsyncAction.prototype._execute = function (state, delay) {
      var errored = false;
      var errorValue = undefined;

      try {
        this.work(state);
      } catch (e) {
        errored = true;
        errorValue = !!e && e || new Error(e);
      }

      if (errored) {
        this.unsubscribe();
        return errorValue;
      }
    };

    AsyncAction.prototype._unsubscribe = function () {
      var id = this.id;
      var scheduler = this.scheduler;
      var actions = scheduler.actions;
      var index = actions.indexOf(this);
      this.work = null;
      this.state = null;
      this.pending = false;
      this.scheduler = null;

      if (index !== -1) {
        actions.splice(index, 1);
      }

      if (id != null) {
        this.id = this.recycleAsyncId(scheduler, id, null);
      }

      this.delay = null;
    };

    return AsyncAction;
  }(Action);

  /** PURE_IMPORTS_START tslib,_AsyncAction PURE_IMPORTS_END */

  var QueueAction =
  /*@__PURE__*/
  function (_super) {
    __extends(QueueAction, _super);

    function QueueAction(scheduler, work) {
      var _this = _super.call(this, scheduler, work) || this;

      _this.scheduler = scheduler;
      _this.work = work;
      return _this;
    }

    QueueAction.prototype.schedule = function (state, delay) {
      if (delay === void 0) {
        delay = 0;
      }

      if (delay > 0) {
        return _super.prototype.schedule.call(this, state, delay);
      }

      this.delay = delay;
      this.state = state;
      this.scheduler.flush(this);
      return this;
    };

    QueueAction.prototype.execute = function (state, delay) {
      return delay > 0 || this.closed ? _super.prototype.execute.call(this, state, delay) : this._execute(state, delay);
    };

    QueueAction.prototype.requestAsyncId = function (scheduler, id, delay) {
      if (delay === void 0) {
        delay = 0;
      }

      if (delay !== null && delay > 0 || delay === null && this.delay > 0) {
        return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
      }

      return scheduler.flush(this);
    };

    return QueueAction;
  }(AsyncAction);

  var Scheduler =
  /*@__PURE__*/
  function () {
    function Scheduler(SchedulerAction, now) {
      if (now === void 0) {
        now = Scheduler.now;
      }

      this.SchedulerAction = SchedulerAction;
      this.now = now;
    }

    Scheduler.prototype.schedule = function (work, delay, state) {
      if (delay === void 0) {
        delay = 0;
      }

      return new this.SchedulerAction(this, work).schedule(state, delay);
    };

    Scheduler.now = function () {
      return Date.now();
    };

    return Scheduler;
  }();

  /** PURE_IMPORTS_START tslib,_Scheduler PURE_IMPORTS_END */

  var AsyncScheduler =
  /*@__PURE__*/
  function (_super) {
    __extends(AsyncScheduler, _super);

    function AsyncScheduler(SchedulerAction, now) {
      if (now === void 0) {
        now = Scheduler.now;
      }

      var _this = _super.call(this, SchedulerAction, function () {
        if (AsyncScheduler.delegate && AsyncScheduler.delegate !== _this) {
          return AsyncScheduler.delegate.now();
        } else {
          return now();
        }
      }) || this;

      _this.actions = [];
      _this.active = false;
      _this.scheduled = undefined;
      return _this;
    }

    AsyncScheduler.prototype.schedule = function (work, delay, state) {
      if (delay === void 0) {
        delay = 0;
      }

      if (AsyncScheduler.delegate && AsyncScheduler.delegate !== this) {
        return AsyncScheduler.delegate.schedule(work, delay, state);
      } else {
        return _super.prototype.schedule.call(this, work, delay, state);
      }
    };

    AsyncScheduler.prototype.flush = function (action) {
      var actions = this.actions;

      if (this.active) {
        actions.push(action);
        return;
      }

      var error;
      this.active = true;

      do {
        if (error = action.execute(action.state, action.delay)) {
          break;
        }
      } while (action = actions.shift());

      this.active = false;

      if (error) {
        while (action = actions.shift()) {
          action.unsubscribe();
        }

        throw error;
      }
    };

    return AsyncScheduler;
  }(Scheduler);

  /** PURE_IMPORTS_START tslib,_AsyncScheduler PURE_IMPORTS_END */

  var QueueScheduler =
  /*@__PURE__*/
  function (_super) {
    __extends(QueueScheduler, _super);

    function QueueScheduler() {
      return _super !== null && _super.apply(this, arguments) || this;
    }

    return QueueScheduler;
  }(AsyncScheduler);

  /** PURE_IMPORTS_START _QueueAction,_QueueScheduler PURE_IMPORTS_END */
  var queue =
  /*@__PURE__*/
  new QueueScheduler(QueueAction);

  /** PURE_IMPORTS_START _Observable PURE_IMPORTS_END */
  var EMPTY =
  /*@__PURE__*/
  new Observable(function (subscriber) {
    return subscriber.complete();
  });
  function empty$1(scheduler) {
    return scheduler ? emptyScheduled(scheduler) : EMPTY;
  }
  function emptyScheduled(scheduler) {
    return new Observable(function (subscriber) {
      return scheduler.schedule(function () {
        return subscriber.complete();
      });
    });
  }

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  function isScheduler(value) {
    return value && typeof value.schedule === 'function';
  }

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  var subscribeToArray = function (array) {
    return function (subscriber) {
      for (var i = 0, len = array.length; i < len && !subscriber.closed; i++) {
        subscriber.next(array[i]);
      }

      if (!subscriber.closed) {
        subscriber.complete();
      }
    };
  };

  /** PURE_IMPORTS_START _Observable,_Subscription,_util_subscribeToArray PURE_IMPORTS_END */
  function fromArray(input, scheduler) {
    if (!scheduler) {
      return new Observable(subscribeToArray(input));
    } else {
      return new Observable(function (subscriber) {
        var sub = new Subscription();
        var i = 0;
        sub.add(scheduler.schedule(function () {
          if (i === input.length) {
            subscriber.complete();
            return;
          }

          subscriber.next(input[i++]);

          if (!subscriber.closed) {
            sub.add(this.schedule());
          }
        }));
        return sub;
      });
    }
  }

  /** PURE_IMPORTS_START _Observable PURE_IMPORTS_END */
  function scalar(value) {
    var result = new Observable(function (subscriber) {
      subscriber.next(value);
      subscriber.complete();
    });
    result._isScalar = true;
    result.value = value;
    return result;
  }

  /** PURE_IMPORTS_START _util_isScheduler,_fromArray,_empty,_scalar PURE_IMPORTS_END */
  function of() {
    var args = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }

    var scheduler = args[args.length - 1];

    if (isScheduler(scheduler)) {
      args.pop();
    } else {
      scheduler = undefined;
    }

    switch (args.length) {
      case 0:
        return empty$1(scheduler);

      case 1:
        return scheduler ? fromArray(args, scheduler) : scalar(args[0]);

      default:
        return fromArray(args, scheduler);
    }
  }

  /** PURE_IMPORTS_START _Observable PURE_IMPORTS_END */
  function throwError(error, scheduler) {
    if (!scheduler) {
      return new Observable(function (subscriber) {
        return subscriber.error(error);
      });
    } else {
      return new Observable(function (subscriber) {
        return scheduler.schedule(dispatch, 0, {
          error: error,
          subscriber: subscriber
        });
      });
    }
  }

  function dispatch(_a) {
    var error = _a.error,
        subscriber = _a.subscriber;
    subscriber.error(error);
  }

  /** PURE_IMPORTS_START _observable_empty,_observable_of,_observable_throwError PURE_IMPORTS_END */

  var Notification =
  /*@__PURE__*/
  function () {
    function Notification(kind, value, error) {
      this.kind = kind;
      this.value = value;
      this.error = error;
      this.hasValue = kind === 'N';
    }

    Notification.prototype.observe = function (observer) {
      switch (this.kind) {
        case 'N':
          return observer.next && observer.next(this.value);

        case 'E':
          return observer.error && observer.error(this.error);

        case 'C':
          return observer.complete && observer.complete();
      }
    };

    Notification.prototype.do = function (next, error, complete) {
      var kind = this.kind;

      switch (kind) {
        case 'N':
          return next && next(this.value);

        case 'E':
          return error && error(this.error);

        case 'C':
          return complete && complete();
      }
    };

    Notification.prototype.accept = function (nextOrObserver, error, complete) {
      if (nextOrObserver && typeof nextOrObserver.next === 'function') {
        return this.observe(nextOrObserver);
      } else {
        return this.do(nextOrObserver, error, complete);
      }
    };

    Notification.prototype.toObservable = function () {
      var kind = this.kind;

      switch (kind) {
        case 'N':
          return of(this.value);

        case 'E':
          return throwError(this.error);

        case 'C':
          return empty$1();
      }

      throw new Error('unexpected notification kind value');
    };

    Notification.createNext = function (value) {
      if (typeof value !== 'undefined') {
        return new Notification('N', value);
      }

      return Notification.undefinedValueNotification;
    };

    Notification.createError = function (err) {
      return new Notification('E', undefined, err);
    };

    Notification.createComplete = function () {
      return Notification.completeNotification;
    };

    Notification.completeNotification = new Notification('C');
    Notification.undefinedValueNotification = new Notification('N', undefined);
    return Notification;
  }();

  /** PURE_IMPORTS_START tslib,_Subscriber,_Notification PURE_IMPORTS_END */

  var ObserveOnSubscriber =
  /*@__PURE__*/
  function (_super) {
    __extends(ObserveOnSubscriber, _super);

    function ObserveOnSubscriber(destination, scheduler, delay) {
      if (delay === void 0) {
        delay = 0;
      }

      var _this = _super.call(this, destination) || this;

      _this.scheduler = scheduler;
      _this.delay = delay;
      return _this;
    }

    ObserveOnSubscriber.dispatch = function (arg) {
      var notification = arg.notification,
          destination = arg.destination;
      notification.observe(destination);
      this.unsubscribe();
    };

    ObserveOnSubscriber.prototype.scheduleMessage = function (notification) {
      this.add(this.scheduler.schedule(ObserveOnSubscriber.dispatch, this.delay, new ObserveOnMessage(notification, this.destination)));
    };

    ObserveOnSubscriber.prototype._next = function (value) {
      this.scheduleMessage(Notification.createNext(value));
    };

    ObserveOnSubscriber.prototype._error = function (err) {
      this.scheduleMessage(Notification.createError(err));
    };

    ObserveOnSubscriber.prototype._complete = function () {
      this.scheduleMessage(Notification.createComplete());
    };

    return ObserveOnSubscriber;
  }(Subscriber);

  var ObserveOnMessage =
  /*@__PURE__*/
  function () {
    function ObserveOnMessage(notification, destination) {
      this.notification = notification;
      this.destination = destination;
    }

    return ObserveOnMessage;
  }();

  /** PURE_IMPORTS_START tslib,_Subject,_scheduler_queue,_Subscription,_operators_observeOn,_util_ObjectUnsubscribedError,_SubjectSubscription PURE_IMPORTS_END */

  var ReplaySubject =
  /*@__PURE__*/
  function (_super) {
    __extends(ReplaySubject, _super);

    function ReplaySubject(bufferSize, windowTime, scheduler) {
      if (bufferSize === void 0) {
        bufferSize = Number.POSITIVE_INFINITY;
      }

      if (windowTime === void 0) {
        windowTime = Number.POSITIVE_INFINITY;
      }

      var _this = _super.call(this) || this;

      _this.scheduler = scheduler;
      _this._events = [];
      _this._infiniteTimeWindow = false;
      _this._bufferSize = bufferSize < 1 ? 1 : bufferSize;
      _this._windowTime = windowTime < 1 ? 1 : windowTime;

      if (windowTime === Number.POSITIVE_INFINITY) {
        _this._infiniteTimeWindow = true;
        _this.next = _this.nextInfiniteTimeWindow;
      } else {
        _this.next = _this.nextTimeWindow;
      }

      return _this;
    }

    ReplaySubject.prototype.nextInfiniteTimeWindow = function (value) {
      var _events = this._events;

      _events.push(value);

      if (_events.length > this._bufferSize) {
        _events.shift();
      }

      _super.prototype.next.call(this, value);
    };

    ReplaySubject.prototype.nextTimeWindow = function (value) {
      this._events.push(new ReplayEvent(this._getNow(), value));

      this._trimBufferThenGetEvents();

      _super.prototype.next.call(this, value);
    };

    ReplaySubject.prototype._subscribe = function (subscriber) {
      var _infiniteTimeWindow = this._infiniteTimeWindow;

      var _events = _infiniteTimeWindow ? this._events : this._trimBufferThenGetEvents();

      var scheduler = this.scheduler;
      var len = _events.length;
      var subscription;

      if (this.closed) {
        throw new ObjectUnsubscribedError();
      } else if (this.isStopped || this.hasError) {
        subscription = Subscription.EMPTY;
      } else {
        this.observers.push(subscriber);
        subscription = new SubjectSubscription(this, subscriber);
      }

      if (scheduler) {
        subscriber.add(subscriber = new ObserveOnSubscriber(subscriber, scheduler));
      }

      if (_infiniteTimeWindow) {
        for (var i = 0; i < len && !subscriber.closed; i++) {
          subscriber.next(_events[i]);
        }
      } else {
        for (var i = 0; i < len && !subscriber.closed; i++) {
          subscriber.next(_events[i].value);
        }
      }

      if (this.hasError) {
        subscriber.error(this.thrownError);
      } else if (this.isStopped) {
        subscriber.complete();
      }

      return subscription;
    };

    ReplaySubject.prototype._getNow = function () {
      return (this.scheduler || queue).now();
    };

    ReplaySubject.prototype._trimBufferThenGetEvents = function () {
      var now = this._getNow();

      var _bufferSize = this._bufferSize;
      var _windowTime = this._windowTime;
      var _events = this._events;
      var eventsCount = _events.length;
      var spliceCount = 0;

      while (spliceCount < eventsCount) {
        if (now - _events[spliceCount].time < _windowTime) {
          break;
        }

        spliceCount++;
      }

      if (eventsCount > _bufferSize) {
        spliceCount = Math.max(spliceCount, eventsCount - _bufferSize);
      }

      if (spliceCount > 0) {
        _events.splice(0, spliceCount);
      }

      return _events;
    };

    return ReplaySubject;
  }(Subject);

  var ReplayEvent =
  /*@__PURE__*/
  function () {
    function ReplayEvent(time, value) {
      this.time = time;
      this.value = value;
    }

    return ReplayEvent;
  }();

  /** PURE_IMPORTS_START tslib,_Subject,_Subscription PURE_IMPORTS_END */

  var AsyncSubject =
  /*@__PURE__*/
  function (_super) {
    __extends(AsyncSubject, _super);

    function AsyncSubject() {
      var _this = _super !== null && _super.apply(this, arguments) || this;

      _this.value = null;
      _this.hasNext = false;
      _this.hasCompleted = false;
      return _this;
    }

    AsyncSubject.prototype._subscribe = function (subscriber) {
      if (this.hasError) {
        subscriber.error(this.thrownError);
        return Subscription.EMPTY;
      } else if (this.hasCompleted && this.hasNext) {
        subscriber.next(this.value);
        subscriber.complete();
        return Subscription.EMPTY;
      }

      return _super.prototype._subscribe.call(this, subscriber);
    };

    AsyncSubject.prototype.next = function (value) {
      if (!this.hasCompleted) {
        this.value = value;
        this.hasNext = true;
      }
    };

    AsyncSubject.prototype.error = function (error) {
      if (!this.hasCompleted) {
        _super.prototype.error.call(this, error);
      }
    };

    AsyncSubject.prototype.complete = function () {
      this.hasCompleted = true;

      if (this.hasNext) {
        _super.prototype.next.call(this, this.value);
      }

      _super.prototype.complete.call(this);
    };

    return AsyncSubject;
  }(Subject);

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  var nextHandle = 1;
  var tasksByHandle = {};

  function runIfPresent(handle) {
    var cb = tasksByHandle[handle];

    if (cb) {
      cb();
    }
  }

  var Immediate = {
    setImmediate: function (cb) {
      var handle = nextHandle++;
      tasksByHandle[handle] = cb;
      Promise.resolve().then(function () {
        return runIfPresent(handle);
      });
      return handle;
    },
    clearImmediate: function (handle) {
      delete tasksByHandle[handle];
    }
  };

  /** PURE_IMPORTS_START tslib,_util_Immediate,_AsyncAction PURE_IMPORTS_END */

  var AsapAction =
  /*@__PURE__*/
  function (_super) {
    __extends(AsapAction, _super);

    function AsapAction(scheduler, work) {
      var _this = _super.call(this, scheduler, work) || this;

      _this.scheduler = scheduler;
      _this.work = work;
      return _this;
    }

    AsapAction.prototype.requestAsyncId = function (scheduler, id, delay) {
      if (delay === void 0) {
        delay = 0;
      }

      if (delay !== null && delay > 0) {
        return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
      }

      scheduler.actions.push(this);
      return scheduler.scheduled || (scheduler.scheduled = Immediate.setImmediate(scheduler.flush.bind(scheduler, null)));
    };

    AsapAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
      if (delay === void 0) {
        delay = 0;
      }

      if (delay !== null && delay > 0 || delay === null && this.delay > 0) {
        return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay);
      }

      if (scheduler.actions.length === 0) {
        Immediate.clearImmediate(id);
        scheduler.scheduled = undefined;
      }

      return undefined;
    };

    return AsapAction;
  }(AsyncAction);

  /** PURE_IMPORTS_START tslib,_AsyncScheduler PURE_IMPORTS_END */

  var AsapScheduler =
  /*@__PURE__*/
  function (_super) {
    __extends(AsapScheduler, _super);

    function AsapScheduler() {
      return _super !== null && _super.apply(this, arguments) || this;
    }

    AsapScheduler.prototype.flush = function (action) {
      this.active = true;
      this.scheduled = undefined;
      var actions = this.actions;
      var error;
      var index = -1;
      var count = actions.length;
      action = action || actions.shift();

      do {
        if (error = action.execute(action.state, action.delay)) {
          break;
        }
      } while (++index < count && (action = actions.shift()));

      this.active = false;

      if (error) {
        while (++index < count && (action = actions.shift())) {
          action.unsubscribe();
        }

        throw error;
      }
    };

    return AsapScheduler;
  }(AsyncScheduler);

  /** PURE_IMPORTS_START _AsapAction,_AsapScheduler PURE_IMPORTS_END */
  var asap =
  /*@__PURE__*/
  new AsapScheduler(AsapAction);

  /** PURE_IMPORTS_START _AsyncAction,_AsyncScheduler PURE_IMPORTS_END */
  var async =
  /*@__PURE__*/
  new AsyncScheduler(AsyncAction);

  /** PURE_IMPORTS_START tslib,_AsyncAction PURE_IMPORTS_END */

  var AnimationFrameAction =
  /*@__PURE__*/
  function (_super) {
    __extends(AnimationFrameAction, _super);

    function AnimationFrameAction(scheduler, work) {
      var _this = _super.call(this, scheduler, work) || this;

      _this.scheduler = scheduler;
      _this.work = work;
      return _this;
    }

    AnimationFrameAction.prototype.requestAsyncId = function (scheduler, id, delay) {
      if (delay === void 0) {
        delay = 0;
      }

      if (delay !== null && delay > 0) {
        return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
      }

      scheduler.actions.push(this);
      return scheduler.scheduled || (scheduler.scheduled = requestAnimationFrame(function () {
        return scheduler.flush(null);
      }));
    };

    AnimationFrameAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
      if (delay === void 0) {
        delay = 0;
      }

      if (delay !== null && delay > 0 || delay === null && this.delay > 0) {
        return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay);
      }

      if (scheduler.actions.length === 0) {
        cancelAnimationFrame(id);
        scheduler.scheduled = undefined;
      }

      return undefined;
    };

    return AnimationFrameAction;
  }(AsyncAction);

  /** PURE_IMPORTS_START tslib,_AsyncScheduler PURE_IMPORTS_END */

  var AnimationFrameScheduler =
  /*@__PURE__*/
  function (_super) {
    __extends(AnimationFrameScheduler, _super);

    function AnimationFrameScheduler() {
      return _super !== null && _super.apply(this, arguments) || this;
    }

    AnimationFrameScheduler.prototype.flush = function (action) {
      this.active = true;
      this.scheduled = undefined;
      var actions = this.actions;
      var error;
      var index = -1;
      var count = actions.length;
      action = action || actions.shift();

      do {
        if (error = action.execute(action.state, action.delay)) {
          break;
        }
      } while (++index < count && (action = actions.shift()));

      this.active = false;

      if (error) {
        while (++index < count && (action = actions.shift())) {
          action.unsubscribe();
        }

        throw error;
      }
    };

    return AnimationFrameScheduler;
  }(AsyncScheduler);

  /** PURE_IMPORTS_START _AnimationFrameAction,_AnimationFrameScheduler PURE_IMPORTS_END */
  var animationFrame =
  /*@__PURE__*/
  new AnimationFrameScheduler(AnimationFrameAction);

  /** PURE_IMPORTS_START tslib,_AsyncAction,_AsyncScheduler PURE_IMPORTS_END */

  var VirtualTimeScheduler =
  /*@__PURE__*/
  function (_super) {
    __extends(VirtualTimeScheduler, _super);

    function VirtualTimeScheduler(SchedulerAction, maxFrames) {
      if (SchedulerAction === void 0) {
        SchedulerAction = VirtualAction;
      }

      if (maxFrames === void 0) {
        maxFrames = Number.POSITIVE_INFINITY;
      }

      var _this = _super.call(this, SchedulerAction, function () {
        return _this.frame;
      }) || this;

      _this.maxFrames = maxFrames;
      _this.frame = 0;
      _this.index = -1;
      return _this;
    }

    VirtualTimeScheduler.prototype.flush = function () {
      var _a = this,
          actions = _a.actions,
          maxFrames = _a.maxFrames;

      var error, action;

      while ((action = actions.shift()) && (this.frame = action.delay) <= maxFrames) {
        if (error = action.execute(action.state, action.delay)) {
          break;
        }
      }

      if (error) {
        while (action = actions.shift()) {
          action.unsubscribe();
        }

        throw error;
      }
    };

    VirtualTimeScheduler.frameTimeFactor = 10;
    return VirtualTimeScheduler;
  }(AsyncScheduler);

  var VirtualAction =
  /*@__PURE__*/
  function (_super) {
    __extends(VirtualAction, _super);

    function VirtualAction(scheduler, work, index) {
      if (index === void 0) {
        index = scheduler.index += 1;
      }

      var _this = _super.call(this, scheduler, work) || this;

      _this.scheduler = scheduler;
      _this.work = work;
      _this.index = index;
      _this.active = true;
      _this.index = scheduler.index = index;
      return _this;
    }

    VirtualAction.prototype.schedule = function (state, delay) {
      if (delay === void 0) {
        delay = 0;
      }

      if (!this.id) {
        return _super.prototype.schedule.call(this, state, delay);
      }

      this.active = false;
      var action = new VirtualAction(this.scheduler, this.work);
      this.add(action);
      return action.schedule(state, delay);
    };

    VirtualAction.prototype.requestAsyncId = function (scheduler, id, delay) {
      if (delay === void 0) {
        delay = 0;
      }

      this.delay = scheduler.frame + delay;
      var actions = scheduler.actions;
      actions.push(this);
      actions.sort(VirtualAction.sortActions);
      return true;
    };

    VirtualAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
      if (delay === void 0) {
        delay = 0;
      }

      return undefined;
    };

    VirtualAction.prototype._execute = function (state, delay) {
      if (this.active === true) {
        return _super.prototype._execute.call(this, state, delay);
      }
    };

    VirtualAction.sortActions = function (a, b) {
      if (a.delay === b.delay) {
        if (a.index === b.index) {
          return 0;
        } else if (a.index > b.index) {
          return 1;
        } else {
          return -1;
        }
      } else if (a.delay > b.delay) {
        return 1;
      } else {
        return -1;
      }
    };

    return VirtualAction;
  }(AsyncAction);

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */

  /** PURE_IMPORTS_START _Observable PURE_IMPORTS_END */

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */

  var MapSubscriber =
  /*@__PURE__*/
  function (_super) {
    __extends(MapSubscriber, _super);

    function MapSubscriber(destination, project, thisArg) {
      var _this = _super.call(this, destination) || this;

      _this.project = project;
      _this.count = 0;
      _this.thisArg = thisArg || _this;
      return _this;
    }

    MapSubscriber.prototype._next = function (value) {
      var result;

      try {
        result = this.project.call(this.thisArg, value, this.count++);
      } catch (err) {
        this.destination.error(err);
        return;
      }

      this.destination.next(result);
    };

    return MapSubscriber;
  }(Subscriber);

  /** PURE_IMPORTS_START _Observable,_AsyncSubject,_operators_map,_util_isArray,_util_isScheduler PURE_IMPORTS_END */

  /** PURE_IMPORTS_START _Observable,_AsyncSubject,_operators_map,_util_isScheduler,_util_isArray PURE_IMPORTS_END */

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */

  var OuterSubscriber =
  /*@__PURE__*/
  function (_super) {
    __extends(OuterSubscriber, _super);

    function OuterSubscriber() {
      return _super !== null && _super.apply(this, arguments) || this;
    }

    OuterSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      this.destination.next(innerValue);
    };

    OuterSubscriber.prototype.notifyError = function (error, innerSub) {
      this.destination.error(error);
    };

    OuterSubscriber.prototype.notifyComplete = function (innerSub) {
      this.destination.complete();
    };

    return OuterSubscriber;
  }(Subscriber);

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */

  var InnerSubscriber =
  /*@__PURE__*/
  function (_super) {
    __extends(InnerSubscriber, _super);

    function InnerSubscriber(parent, outerValue, outerIndex) {
      var _this = _super.call(this) || this;

      _this.parent = parent;
      _this.outerValue = outerValue;
      _this.outerIndex = outerIndex;
      _this.index = 0;
      return _this;
    }

    InnerSubscriber.prototype._next = function (value) {
      this.parent.notifyNext(this.outerValue, value, this.outerIndex, this.index++, this);
    };

    InnerSubscriber.prototype._error = function (error) {
      this.parent.notifyError(error, this);
      this.unsubscribe();
    };

    InnerSubscriber.prototype._complete = function () {
      this.parent.notifyComplete(this);
      this.unsubscribe();
    };

    return InnerSubscriber;
  }(Subscriber);

  /** PURE_IMPORTS_START _hostReportError PURE_IMPORTS_END */
  var subscribeToPromise = function (promise) {
    return function (subscriber) {
      promise.then(function (value) {
        if (!subscriber.closed) {
          subscriber.next(value);
          subscriber.complete();
        }
      }, function (err) {
        return subscriber.error(err);
      }).then(null, hostReportError);
      return subscriber;
    };
  };

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  function getSymbolIterator() {
    if (typeof Symbol !== 'function' || !Symbol.iterator) {
      return '@@iterator';
    }

    return Symbol.iterator;
  }
  var iterator =
  /*@__PURE__*/
  getSymbolIterator();

  /** PURE_IMPORTS_START _symbol_iterator PURE_IMPORTS_END */
  var subscribeToIterable = function (iterable) {
    return function (subscriber) {
      var iterator$$1 = iterable[iterator]();

      do {
        var item = iterator$$1.next();

        if (item.done) {
          subscriber.complete();
          break;
        }

        subscriber.next(item.value);

        if (subscriber.closed) {
          break;
        }
      } while (true);

      if (typeof iterator$$1.return === 'function') {
        subscriber.add(function () {
          if (iterator$$1.return) {
            iterator$$1.return();
          }
        });
      }

      return subscriber;
    };
  };

  /** PURE_IMPORTS_START _symbol_observable PURE_IMPORTS_END */
  var subscribeToObservable = function (obj) {
    return function (subscriber) {
      var obs = obj[observable]();

      if (typeof obs.subscribe !== 'function') {
        throw new TypeError('Provided object does not correctly implement Symbol.observable');
      } else {
        return obs.subscribe(subscriber);
      }
    };
  };

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  var isArrayLike = function (x) {
    return x && typeof x.length === 'number' && typeof x !== 'function';
  };

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  function isPromise(value) {
    return value && typeof value.subscribe !== 'function' && typeof value.then === 'function';
  }

  /** PURE_IMPORTS_START _Observable,_subscribeToArray,_subscribeToPromise,_subscribeToIterable,_subscribeToObservable,_isArrayLike,_isPromise,_isObject,_symbol_iterator,_symbol_observable PURE_IMPORTS_END */
  var subscribeTo = function (result) {
    if (result instanceof Observable) {
      return function (subscriber) {
        if (result._isScalar) {
          subscriber.next(result.value);
          subscriber.complete();
          return undefined;
        } else {
          return result.subscribe(subscriber);
        }
      };
    } else if (result && typeof result[observable] === 'function') {
      return subscribeToObservable(result);
    } else if (isArrayLike(result)) {
      return subscribeToArray(result);
    } else if (isPromise(result)) {
      return subscribeToPromise(result);
    } else if (result && typeof result[iterator] === 'function') {
      return subscribeToIterable(result);
    } else {
      var value = isObject(result) ? 'an invalid object' : "'" + result + "'";
      var msg = "You provided " + value + " where a stream was expected." + ' You can provide an Observable, Promise, Array, or Iterable.';
      throw new TypeError(msg);
    }
  };

  /** PURE_IMPORTS_START _InnerSubscriber,_subscribeTo PURE_IMPORTS_END */
  function subscribeToResult(outerSubscriber, result, outerValue, outerIndex, destination) {
    if (destination === void 0) {
      destination = new InnerSubscriber(outerSubscriber, outerValue, outerIndex);
    }

    if (destination.closed) {
      return;
    }

    return subscribeTo(result)(destination);
  }

  /** PURE_IMPORTS_START tslib,_util_isScheduler,_util_isArray,_OuterSubscriber,_util_subscribeToResult,_fromArray PURE_IMPORTS_END */
  var NONE = {};

  var CombineLatestSubscriber =
  /*@__PURE__*/
  function (_super) {
    __extends(CombineLatestSubscriber, _super);

    function CombineLatestSubscriber(destination, resultSelector) {
      var _this = _super.call(this, destination) || this;

      _this.resultSelector = resultSelector;
      _this.active = 0;
      _this.values = [];
      _this.observables = [];
      return _this;
    }

    CombineLatestSubscriber.prototype._next = function (observable) {
      this.values.push(NONE);
      this.observables.push(observable);
    };

    CombineLatestSubscriber.prototype._complete = function () {
      var observables = this.observables;
      var len = observables.length;

      if (len === 0) {
        this.destination.complete();
      } else {
        this.active = len;
        this.toRespond = len;

        for (var i = 0; i < len; i++) {
          var observable = observables[i];
          this.add(subscribeToResult(this, observable, observable, i));
        }
      }
    };

    CombineLatestSubscriber.prototype.notifyComplete = function (unused) {
      if ((this.active -= 1) === 0) {
        this.destination.complete();
      }
    };

    CombineLatestSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      var values = this.values;
      var oldVal = values[outerIndex];
      var toRespond = !this.toRespond ? 0 : oldVal === NONE ? --this.toRespond : this.toRespond;
      values[outerIndex] = innerValue;

      if (toRespond === 0) {
        if (this.resultSelector) {
          this._tryResultSelector(values);
        } else {
          this.destination.next(values.slice());
        }
      }
    };

    CombineLatestSubscriber.prototype._tryResultSelector = function (values) {
      var result;

      try {
        result = this.resultSelector.apply(this, values);
      } catch (err) {
        this.destination.error(err);
        return;
      }

      this.destination.next(result);
    };

    return CombineLatestSubscriber;
  }(OuterSubscriber);

  /** PURE_IMPORTS_START _symbol_observable PURE_IMPORTS_END */

  /** PURE_IMPORTS_START _symbol_iterator PURE_IMPORTS_END */

  /** PURE_IMPORTS_START _Observable,_Subscription,_util_subscribeToPromise PURE_IMPORTS_END */

  /** PURE_IMPORTS_START _Observable,_Subscription,_symbol_iterator,_util_subscribeToIterable PURE_IMPORTS_END */

  /** PURE_IMPORTS_START _Observable,_Subscription,_symbol_observable,_util_subscribeToObservable PURE_IMPORTS_END */

  /** PURE_IMPORTS_START _Observable,_util_isPromise,_util_isArrayLike,_util_isInteropObservable,_util_isIterable,_fromArray,_fromPromise,_fromIterable,_fromObservable,_util_subscribeTo PURE_IMPORTS_END */

  /** PURE_IMPORTS_START tslib,_util_subscribeToResult,_OuterSubscriber,_InnerSubscriber,_map,_observable_from PURE_IMPORTS_END */

  var MergeMapSubscriber =
  /*@__PURE__*/
  function (_super) {
    __extends(MergeMapSubscriber, _super);

    function MergeMapSubscriber(destination, project, concurrent) {
      if (concurrent === void 0) {
        concurrent = Number.POSITIVE_INFINITY;
      }

      var _this = _super.call(this, destination) || this;

      _this.project = project;
      _this.concurrent = concurrent;
      _this.hasCompleted = false;
      _this.buffer = [];
      _this.active = 0;
      _this.index = 0;
      return _this;
    }

    MergeMapSubscriber.prototype._next = function (value) {
      if (this.active < this.concurrent) {
        this._tryNext(value);
      } else {
        this.buffer.push(value);
      }
    };

    MergeMapSubscriber.prototype._tryNext = function (value) {
      var result;
      var index = this.index++;

      try {
        result = this.project(value, index);
      } catch (err) {
        this.destination.error(err);
        return;
      }

      this.active++;

      this._innerSub(result, value, index);
    };

    MergeMapSubscriber.prototype._innerSub = function (ish, value, index) {
      var innerSubscriber = new InnerSubscriber(this, undefined, undefined);
      this.add(innerSubscriber);
      subscribeToResult(this, ish, value, index, innerSubscriber);
    };

    MergeMapSubscriber.prototype._complete = function () {
      this.hasCompleted = true;

      if (this.active === 0 && this.buffer.length === 0) {
        this.destination.complete();
      }
    };

    MergeMapSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      this.destination.next(innerValue);
    };

    MergeMapSubscriber.prototype.notifyComplete = function (innerSub) {
      var buffer = this.buffer;
      this.remove(innerSub);
      this.active--;

      if (buffer.length > 0) {
        this._next(buffer.shift());
      } else if (this.active === 0 && this.hasCompleted) {
        this.destination.complete();
      }
    };

    return MergeMapSubscriber;
  }(OuterSubscriber);

  /** PURE_IMPORTS_START _mergeMap,_util_identity PURE_IMPORTS_END */

  /** PURE_IMPORTS_START _mergeAll PURE_IMPORTS_END */

  /** PURE_IMPORTS_START _util_isScheduler,_of,_from,_operators_concatAll PURE_IMPORTS_END */

  /** PURE_IMPORTS_START _Observable,_from,_empty PURE_IMPORTS_END */

  /** PURE_IMPORTS_START tslib,_Observable,_util_isArray,_empty,_util_subscribeToResult,_OuterSubscriber,_operators_map PURE_IMPORTS_END */

  var ForkJoinSubscriber =
  /*@__PURE__*/
  function (_super) {
    __extends(ForkJoinSubscriber, _super);

    function ForkJoinSubscriber(destination, sources) {
      var _this = _super.call(this, destination) || this;

      _this.sources = sources;
      _this.completed = 0;
      _this.haveValues = 0;
      var len = sources.length;
      _this.values = new Array(len);

      for (var i = 0; i < len; i++) {
        var source = sources[i];
        var innerSubscription = subscribeToResult(_this, source, null, i);

        if (innerSubscription) {
          _this.add(innerSubscription);
        }
      }

      return _this;
    }

    ForkJoinSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      this.values[outerIndex] = innerValue;

      if (!innerSub._hasValue) {
        innerSub._hasValue = true;
        this.haveValues++;
      }
    };

    ForkJoinSubscriber.prototype.notifyComplete = function (innerSub) {
      var _a = this,
          destination = _a.destination,
          haveValues = _a.haveValues,
          values = _a.values;

      var len = values.length;

      if (!innerSub._hasValue) {
        destination.complete();
        return;
      }

      this.completed++;

      if (this.completed !== len) {
        return;
      }

      if (haveValues === len) {
        destination.next(values);
      }

      destination.complete();
    };

    return ForkJoinSubscriber;
  }(OuterSubscriber);

  /** PURE_IMPORTS_START _Observable,_util_isArray,_util_isFunction,_operators_map PURE_IMPORTS_END */

  /** PURE_IMPORTS_START _Observable,_util_isArray,_util_isFunction,_operators_map PURE_IMPORTS_END */

  /** PURE_IMPORTS_START _Observable,_util_identity,_util_isScheduler PURE_IMPORTS_END */

  /** PURE_IMPORTS_START _defer,_empty PURE_IMPORTS_END */

  /** PURE_IMPORTS_START _isArray PURE_IMPORTS_END */

  /** PURE_IMPORTS_START _Observable,_scheduler_async,_util_isNumeric PURE_IMPORTS_END */

  /** PURE_IMPORTS_START _Observable,_util_isScheduler,_operators_mergeAll,_fromArray PURE_IMPORTS_END */

  /** PURE_IMPORTS_START _Observable,_util_noop PURE_IMPORTS_END */
  var NEVER =
  /*@__PURE__*/
  new Observable(noop);

  /** PURE_IMPORTS_START _Observable,_from,_util_isArray,_empty PURE_IMPORTS_END */

  /** PURE_IMPORTS_START _Observable,_Subscription PURE_IMPORTS_END */

  /** PURE_IMPORTS_START tslib,_util_isArray,_fromArray,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */

  var RaceSubscriber =
  /*@__PURE__*/
  function (_super) {
    __extends(RaceSubscriber, _super);

    function RaceSubscriber(destination) {
      var _this = _super.call(this, destination) || this;

      _this.hasFirst = false;
      _this.observables = [];
      _this.subscriptions = [];
      return _this;
    }

    RaceSubscriber.prototype._next = function (observable) {
      this.observables.push(observable);
    };

    RaceSubscriber.prototype._complete = function () {
      var observables = this.observables;
      var len = observables.length;

      if (len === 0) {
        this.destination.complete();
      } else {
        for (var i = 0; i < len && !this.hasFirst; i++) {
          var observable = observables[i];
          var subscription = subscribeToResult(this, observable, observable, i);

          if (this.subscriptions) {
            this.subscriptions.push(subscription);
          }

          this.add(subscription);
        }

        this.observables = null;
      }
    };

    RaceSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      if (!this.hasFirst) {
        this.hasFirst = true;

        for (var i = 0; i < this.subscriptions.length; i++) {
          if (i !== outerIndex) {
            var subscription = this.subscriptions[i];
            subscription.unsubscribe();
            this.remove(subscription);
          }
        }

        this.subscriptions = null;
      }

      this.destination.next(innerValue);
    };

    return RaceSubscriber;
  }(OuterSubscriber);

  /** PURE_IMPORTS_START _Observable PURE_IMPORTS_END */

  /** PURE_IMPORTS_START _Observable,_scheduler_async,_util_isNumeric,_util_isScheduler PURE_IMPORTS_END */

  /** PURE_IMPORTS_START _Observable,_from,_empty PURE_IMPORTS_END */

  /** PURE_IMPORTS_START tslib,_fromArray,_util_isArray,_Subscriber,_OuterSubscriber,_util_subscribeToResult,_.._internal_symbol_iterator PURE_IMPORTS_END */

  var ZipSubscriber =
  /*@__PURE__*/
  function (_super) {
    __extends(ZipSubscriber, _super);

    function ZipSubscriber(destination, resultSelector, values) {
      if (values === void 0) {
        values = Object.create(null);
      }

      var _this = _super.call(this, destination) || this;

      _this.iterators = [];
      _this.active = 0;
      _this.resultSelector = typeof resultSelector === 'function' ? resultSelector : null;
      _this.values = values;
      return _this;
    }

    ZipSubscriber.prototype._next = function (value) {
      var iterators = this.iterators;

      if (isArray$1(value)) {
        iterators.push(new StaticArrayIterator(value));
      } else if (typeof value[iterator] === 'function') {
        iterators.push(new StaticIterator(value[iterator]()));
      } else {
        iterators.push(new ZipBufferIterator(this.destination, this, value));
      }
    };

    ZipSubscriber.prototype._complete = function () {
      var iterators = this.iterators;
      var len = iterators.length;

      if (len === 0) {
        this.destination.complete();
        return;
      }

      this.active = len;

      for (var i = 0; i < len; i++) {
        var iterator$$1 = iterators[i];

        if (iterator$$1.stillUnsubscribed) {
          this.add(iterator$$1.subscribe(iterator$$1, i));
        } else {
          this.active--;
        }
      }
    };

    ZipSubscriber.prototype.notifyInactive = function () {
      this.active--;

      if (this.active === 0) {
        this.destination.complete();
      }
    };

    ZipSubscriber.prototype.checkIterators = function () {
      var iterators = this.iterators;
      var len = iterators.length;
      var destination = this.destination;

      for (var i = 0; i < len; i++) {
        var iterator$$1 = iterators[i];

        if (typeof iterator$$1.hasValue === 'function' && !iterator$$1.hasValue()) {
          return;
        }
      }

      var shouldComplete = false;
      var args = [];

      for (var i = 0; i < len; i++) {
        var iterator$$1 = iterators[i];
        var result = iterator$$1.next();

        if (iterator$$1.hasCompleted()) {
          shouldComplete = true;
        }

        if (result.done) {
          destination.complete();
          return;
        }

        args.push(result.value);
      }

      if (this.resultSelector) {
        this._tryresultSelector(args);
      } else {
        destination.next(args);
      }

      if (shouldComplete) {
        destination.complete();
      }
    };

    ZipSubscriber.prototype._tryresultSelector = function (args) {
      var result;

      try {
        result = this.resultSelector.apply(this, args);
      } catch (err) {
        this.destination.error(err);
        return;
      }

      this.destination.next(result);
    };

    return ZipSubscriber;
  }(Subscriber);

  var StaticIterator =
  /*@__PURE__*/
  function () {
    function StaticIterator(iterator$$1) {
      this.iterator = iterator$$1;
      this.nextResult = iterator$$1.next();
    }

    StaticIterator.prototype.hasValue = function () {
      return true;
    };

    StaticIterator.prototype.next = function () {
      var result = this.nextResult;
      this.nextResult = this.iterator.next();
      return result;
    };

    StaticIterator.prototype.hasCompleted = function () {
      var nextResult = this.nextResult;
      return nextResult && nextResult.done;
    };

    return StaticIterator;
  }();

  var StaticArrayIterator =
  /*@__PURE__*/
  function () {
    function StaticArrayIterator(array) {
      this.array = array;
      this.index = 0;
      this.length = 0;
      this.length = array.length;
    }

    StaticArrayIterator.prototype[iterator] = function () {
      return this;
    };

    StaticArrayIterator.prototype.next = function (value) {
      var i = this.index++;
      var array = this.array;
      return i < this.length ? {
        value: array[i],
        done: false
      } : {
        value: null,
        done: true
      };
    };

    StaticArrayIterator.prototype.hasValue = function () {
      return this.array.length > this.index;
    };

    StaticArrayIterator.prototype.hasCompleted = function () {
      return this.array.length === this.index;
    };

    return StaticArrayIterator;
  }();

  var ZipBufferIterator =
  /*@__PURE__*/
  function (_super) {
    __extends(ZipBufferIterator, _super);

    function ZipBufferIterator(destination, parent, observable) {
      var _this = _super.call(this, destination) || this;

      _this.parent = parent;
      _this.observable = observable;
      _this.stillUnsubscribed = true;
      _this.buffer = [];
      _this.isComplete = false;
      return _this;
    }

    ZipBufferIterator.prototype[iterator] = function () {
      return this;
    };

    ZipBufferIterator.prototype.next = function () {
      var buffer = this.buffer;

      if (buffer.length === 0 && this.isComplete) {
        return {
          value: null,
          done: true
        };
      } else {
        return {
          value: buffer.shift(),
          done: false
        };
      }
    };

    ZipBufferIterator.prototype.hasValue = function () {
      return this.buffer.length > 0;
    };

    ZipBufferIterator.prototype.hasCompleted = function () {
      return this.buffer.length === 0 && this.isComplete;
    };

    ZipBufferIterator.prototype.notifyComplete = function () {
      if (this.buffer.length > 0) {
        this.isComplete = true;
        this.parent.notifyInactive();
      } else {
        this.destination.complete();
      }
    };

    ZipBufferIterator.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      this.buffer.push(innerValue);
      this.parent.checkIterators();
    };

    ZipBufferIterator.prototype.subscribe = function (value, index) {
      return subscribeToResult(this, this.observable, this, index);
    };

    return ZipBufferIterator;
  }(OuterSubscriber);

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */

  var Pss =
  /*#__PURE__*/
  function () {
    function Pss(rpc) {
      _defineProperty(this, "_rpc", void 0);

      if (!rpc.canSubscribe) {
        throw new Error('Invalid RPC instance provided: must support subscriptions');
      }

      this._rpc = rpc;
    }

    var _proto = Pss.prototype;

    _proto.baseAddr = function baseAddr() {
      return this._rpc.request('pss_baseAddr');
    };

    _proto.getPublicKey = function getPublicKey() {
      return this._rpc.request('pss_getPublicKey');
    };

    _proto.sendAsym = function sendAsym(key, topic, message) {
      return this._rpc.request('pss_sendAsym', [key, topic, message]);
    };

    _proto.sendSym = function sendSym(keyID, topic, message) {
      return this._rpc.request('pss_sendSym', [keyID, topic, message]);
    };

    _proto.setPeerPublicKey = function setPeerPublicKey(key, topic, address) {
      if (address === void 0) {
        address = hexEmpty;
      }

      return this._rpc.request('pss_setPeerPublicKey', [key, topic, address]);
    };

    _proto.setSymmetricKey = function setSymmetricKey(key, topic, address, useForDecryption) {
      if (address === void 0) {
        address = hexEmpty;
      }

      if (useForDecryption === void 0) {
        useForDecryption = false;
      }

      return this._rpc.request('pss_setSymmetricKey', [key, topic, address, useForDecryption]);
    };

    _proto.stringToTopic = function stringToTopic(str) {
      return this._rpc.request('pss_stringToTopic', [str]);
    };

    _proto.subscribeTopic = function subscribeTopic(topic) {
      return this._rpc.request('pss_subscribe', ['receive', topic]);
    };

    _proto.createSubscription = function createSubscription(subscription) {
      var _this = this;

      return Observable.create(function (observer) {
        return _this._rpc.subscribe({
          next: function next(msg) {
            if (msg.method === 'pss_subscription' && msg.params != null && msg.params.subscription === subscription) {
              var result = msg.params.result;

              if (result != null) {
                try {
                  observer.next(result);
                } catch (err) {
                  // eslint-disable-next-line no-console
                  console.warn('Error handling message', result, err);
                }
              }
            }
          },
          error: function error(err) {
            observer.error(err);
          },
          complete: function complete() {
            observer.complete();
          }
        });
      });
    };

    _proto.createTopicSubscription = function createTopicSubscription(topic) {
      var _this2 = this;

      return this.subscribeTopic(topic).then(function (subscription) {
        return _this2.createSubscription(subscription);
      });
    };

    return Pss;
  }();

  if (typeof global$1.setTimeout === 'function') ;

  if (typeof global$1.clearTimeout === 'function') ;

  var performance = global$1.performance || {};

  var performanceNow = performance.now || performance.mozNow || performance.msNow || performance.oNow || performance.webkitNow || function () {
    return new Date().getTime();
  }; // generate timestamp or delta

  {
    if (typeof self === 'undefined' || !self.crypto && !self.msCrypto) {
      throw new Error('Your browser does not have secure random generator. ' + 'If you don’t need unpredictable IDs, you can use nanoid/non-secure.');
    }
  }

  var crypto = self.crypto || self.msCrypto;
  var url = '_~getRandomVcryp0123456789bfhijklqsuvwxzABCDEFGHIJKLMNOPQSTUWXYZ';

  var index_browser = function (size) {
    size = size || 21;
    var id = '';
    var bytes = crypto.getRandomValues(new Uint8Array(size));

    while (0 < size--) {
      id += url[bytes[size] & 63];
    }

    return id;
  };

  var idType = function idType(value) {
    return value;
  };
  var uniqueID = function uniqueID() {
    return idType(index_browser());
  };

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  } // eslint-disable-next-line import/named

  var BaseRPC = function () {
    function BaseRPC() {
      var canSubscribe = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      _classCallCheck(this, BaseRPC);

      this._canSubscribe = canSubscribe;
    }

    BaseRPC.prototype.createId = function createId() {
      return uniqueID();
    }; // eslint-disable-next-line no-unused-vars


    BaseRPC.prototype.request = function request(method, params) {
      return Promise.reject(new Error('Must be implemented'));
    };

    _createClass(BaseRPC, [{
      key: 'canSubscribe',
      get: function get() {
        return this._canSubscribe;
      }
    }]);

    return BaseRPC;
  }();

  function _classCallCheck$1(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  function _extendableBuiltin(cls) {
    function ExtendableBuiltin() {
      cls.apply(this, arguments);
    }

    ExtendableBuiltin.prototype = Object.create(cls.prototype, {
      constructor: {
        value: cls,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });

    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(ExtendableBuiltin, cls);
    } else {
      ExtendableBuiltin.__proto__ = cls;
    }

    return ExtendableBuiltin;
  }

  var ExtendableError = function (_extendableBuiltin2) {
    _inherits(ExtendableError, _extendableBuiltin2);

    function ExtendableError() {
      var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      _classCallCheck$1(this, ExtendableError); // extending Error is weird and does not propagate `message`


      var _this = _possibleConstructorReturn(this, (ExtendableError.__proto__ || Object.getPrototypeOf(ExtendableError)).call(this, message));

      Object.defineProperty(_this, 'message', {
        configurable: true,
        enumerable: false,
        value: message,
        writable: true
      });
      Object.defineProperty(_this, 'name', {
        configurable: true,
        enumerable: false,
        value: _this.constructor.name,
        writable: true
      });

      if (Error.hasOwnProperty('captureStackTrace')) {
        Error.captureStackTrace(_this, _this.constructor);
        return _possibleConstructorReturn(_this);
      }

      Object.defineProperty(_this, 'stack', {
        configurable: true,
        enumerable: false,
        value: new Error(message).stack,
        writable: true
      });
      return _this;
    }

    return ExtendableError;
  }(_extendableBuiltin(Error));

  function _classCallCheck$2(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn$1(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits$1(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }
  var ERROR_MESSAGES = {
    '-32700': 'Parse error',
    '-32600': 'Invalid request',
    '-32601': 'Method not found',
    '-32602': 'Invalid params',
    '-32603': 'Internal error'
  };
  var isServerError = function isServerError(code) {
    return -32000 >= code && code >= -32099;
  };
  var getErrorMessage = function getErrorMessage(code) {
    return ERROR_MESSAGES[code] || (isServerError(code) ? 'Server error' : 'Application error');
  };

  var RPCError = function (_BaseError) {
    _inherits$1(RPCError, _BaseError);

    RPCError.fromObject = function fromObject(err) {
      return new RPCError(err.code, err.message, err.data);
    };

    function RPCError(code, message, data) {
      _classCallCheck$2(this, RPCError);

      var _this = _possibleConstructorReturn$1(this, _BaseError.call(this, message || getErrorMessage(code)));

      _this.code = code;
      _this.data = data;
      return _this;
    }

    return RPCError;
  }(ExtendableError);

  function _classCallCheck$3(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn$2(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits$2(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  var RequestRPC = function (_BaseRPC) {
    _inherits$2(RequestRPC, _BaseRPC);

    function RequestRPC(fetch) {
      _classCallCheck$3(this, RequestRPC);

      var _this = _possibleConstructorReturn$2(this, _BaseRPC.call(this, false));

      _this._fetch = fetch;
      return _this;
    }

    RequestRPC.prototype.request = function request(method, params) {
      return this._fetch({
        id: this.createId(),
        jsonrpc: '2.0',
        method: method,
        params: params
      }).then(function (msg) {
        if (msg.error) {
          throw RPCError.fromObject(msg.error);
        }

        return msg.result;
      });
    };

    return RequestRPC;
  }(BaseRPC);

  var HEADERS = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };
  var METHOD = 'POST';
  var createHTTP = (function (fetch) {
    return function (url) {
      return function (data) {
        return fetch(url, {
          body: JSON.stringify(data),
          headers: HEADERS,
          method: METHOD
        }).then(function (res) {
          return res.json();
        });
      };
    };
  });

  /* eslint-env browser */
  var httpTransport = createHTTP(window.fetch);

  var http = (function (url) {
    return new RequestRPC(httpTransport(url));
  });

  /* eslint-env browser */
  var web3Transport = (function (maybeProvider) {
    var provider = maybeProvider || window.web3 && window.web3.currentProvider;

    if (provider == null) {
      throw new Error('No provider or `web3.currentProvider` exposed');
    }

    return function (payload) {
      return new Promise(function (resolve, reject) {
        provider.send(payload, function (err, res) {
          if (err) reject(err);else resolve(res);
        });
      });
    };
  });

  var web3 = (function (provider) {
    return new RequestRPC(web3Transport(provider));
  });

  var _createClass$1 = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  function _classCallCheck$4(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn$3(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits$3(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  var StreamRPC = function (_BaseRPC) {
    _inherits$3(StreamRPC, _BaseRPC);

    function StreamRPC(transport) {
      _classCallCheck$4(this, StreamRPC);

      var _this = _possibleConstructorReturn$3(this, _BaseRPC.call(this, true));

      _this._observers = new Map();
      _this._subscribers = new Set();
      _this._transport = transport;

      _this.connect();

      return _this;
    }

    StreamRPC.prototype.connect = function connect() {
      var _this2 = this;

      if (this.connected) {
        return;
      }

      var failed = void 0;
      this._subscription = this._transport.subscribe({
        next: function next(msg) {
          if (msg.id == null) {
            _this2._subscribers.forEach(function (o) {
              o.next(msg);
            });
          } else {
            var observer = _this2._observers.get(msg.id);

            if (observer) {
              if (msg.error) {
                var err = RPCError.fromObject(msg.error);
                observer.error(err);

                _this2._observers.delete(msg.id);
              } else {
                observer.next(msg.result);
              }
            } else {
              // eslint-disable-next-line no-console
              console.warn('Missing observer for message ID:', msg.id);
            }
          }
        },
        error: function error(event) {
          var err = void 0;

          if (event instanceof Error) {
            err = event;
          } else {
            err = new Error('Connection failed');
          }

          failed = err;

          _this2._observers.forEach(function (o) {
            o.error(err);
          });

          _this2._observers.clear();

          _this2._subscribers.forEach(function (o) {
            o.error(err);
          });

          _this2._subscribers.clear();
        },
        complete: function complete() {
          _this2._observers.forEach(function (o) {
            o.complete();
          });

          _this2._observers.clear();

          _this2._subscribers.forEach(function (o) {
            o.complete();
          });

          _this2._subscribers.clear();
        }
      });

      if (failed != null) {
        throw failed;
      }
    };

    StreamRPC.prototype.disconnect = function disconnect() {
      this._transport.complete();
    };

    StreamRPC.prototype.observe = function observe(method, params) {
      var _this3 = this;

      return Observable.create(function (observer) {
        var id = _this3.createId();

        var msg = {
          jsonrpc: '2.0',
          method: method,
          id: id,
          params: params
        };

        _this3._observers.set(id, new Subscriber(observer));

        _this3._transport.next(msg);

        return function () {
          _this3._observers.delete(id);
        };
      });
    };

    StreamRPC.prototype.request = function request(method, params) {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        if (_this4.connected) {
          var sub = _this4.observe(method, params).subscribe(function (value) {
            sub.unsubscribe();
            resolve(value);
          }, function (err) {
            sub.unsubscribe();
            reject(err);
          }, function () {
            sub.unsubscribe();
          });
        } else {
          reject(new Error('Not connected'));
        }
      });
    };

    StreamRPC.prototype.subscribe = function subscribe() {
      var _this5 = this;

      if (!this.connected) {
        throw new Error('Not connected');
      }

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var subscriber = new (Function.prototype.bind.apply(Subscriber, [null].concat(args)))();

      this._subscribers.add(subscriber);

      return function () {
        _this5._subscribers.delete(subscriber);
      };
    };

    _createClass$1(StreamRPC, [{
      key: 'connected',
      get: function get() {
        // $FlowFixMe: missing Subscription.closed property definition
        return this._subscription != null && !this._subscription.closed;
      }
    }]);

    return StreamRPC;
  }(BaseRPC);

  /** PURE_IMPORTS_START tslib,_.._Subject,_.._Subscriber,_.._Observable,_.._Subscription,_.._ReplaySubject,_.._util_tryCatch,_.._util_errorObject PURE_IMPORTS_END */
  var DEFAULT_WEBSOCKET_CONFIG = {
    url: '',
    deserializer: function (e) {
      return JSON.parse(e.data);
    },
    serializer: function (value) {
      return JSON.stringify(value);
    }
  };
  var WEBSOCKETSUBJECT_INVALID_ERROR_OBJECT = 'WebSocketSubject.error must be called with an object with an error code, and an optional reason: { code: number, reason: string }';

  var WebSocketSubject =
  /*@__PURE__*/
  function (_super) {
    __extends(WebSocketSubject, _super);

    function WebSocketSubject(urlConfigOrSource, destination) {
      var _this = _super.call(this) || this;

      if (urlConfigOrSource instanceof Observable) {
        _this.destination = destination;
        _this.source = urlConfigOrSource;
      } else {
        var config = _this._config = __assign({}, DEFAULT_WEBSOCKET_CONFIG);

        _this._output = new Subject();

        if (typeof urlConfigOrSource === 'string') {
          config.url = urlConfigOrSource;
        } else {
          for (var key in urlConfigOrSource) {
            if (urlConfigOrSource.hasOwnProperty(key)) {
              config[key] = urlConfigOrSource[key];
            }
          }
        }

        if (!config.WebSocketCtor && WebSocket) {
          config.WebSocketCtor = WebSocket;
        } else if (!config.WebSocketCtor) {
          throw new Error('no WebSocket constructor can be found');
        }

        _this.destination = new ReplaySubject();
      }

      return _this;
    }

    WebSocketSubject.prototype.lift = function (operator) {
      var sock = new WebSocketSubject(this._config, this.destination);
      sock.operator = operator;
      sock.source = this;
      return sock;
    };

    WebSocketSubject.prototype._resetState = function () {
      this._socket = null;

      if (!this.source) {
        this.destination = new ReplaySubject();
      }

      this._output = new Subject();
    };

    WebSocketSubject.prototype.multiplex = function (subMsg, unsubMsg, messageFilter) {
      var self = this;
      return new Observable(function (observer) {
        var result = tryCatch(subMsg)();

        if (result === errorObject) {
          observer.error(errorObject.e);
        } else {
          self.next(result);
        }

        var subscription = self.subscribe(function (x) {
          var result = tryCatch(messageFilter)(x);

          if (result === errorObject) {
            observer.error(errorObject.e);
          } else if (result) {
            observer.next(x);
          }
        }, function (err) {
          return observer.error(err);
        }, function () {
          return observer.complete();
        });
        return function () {
          var result = tryCatch(unsubMsg)();

          if (result === errorObject) {
            observer.error(errorObject.e);
          } else {
            self.next(result);
          }

          subscription.unsubscribe();
        };
      });
    };

    WebSocketSubject.prototype._connectSocket = function () {
      var _this = this;

      var _a = this._config,
          WebSocketCtor = _a.WebSocketCtor,
          protocol = _a.protocol,
          url = _a.url,
          binaryType = _a.binaryType;
      var observer = this._output;
      var socket = null;

      try {
        socket = protocol ? new WebSocketCtor(url, protocol) : new WebSocketCtor(url);
        this._socket = socket;

        if (binaryType) {
          this._socket.binaryType = binaryType;
        }
      } catch (e) {
        observer.error(e);
        return;
      }

      var subscription = new Subscription(function () {
        _this._socket = null;

        if (socket && socket.readyState === 1) {
          socket.close();
        }
      });

      socket.onopen = function (e) {
        var openObserver = _this._config.openObserver;

        if (openObserver) {
          openObserver.next(e);
        }

        var queue = _this.destination;
        _this.destination = Subscriber.create(function (x) {
          if (socket.readyState === 1) {
            var serializer = _this._config.serializer;
            var msg = tryCatch(serializer)(x);

            if (msg === errorObject) {
              _this.destination.error(errorObject.e);

              return;
            }

            socket.send(msg);
          }
        }, function (e) {
          var closingObserver = _this._config.closingObserver;

          if (closingObserver) {
            closingObserver.next(undefined);
          }

          if (e && e.code) {
            socket.close(e.code, e.reason);
          } else {
            observer.error(new TypeError(WEBSOCKETSUBJECT_INVALID_ERROR_OBJECT));
          }

          _this._resetState();
        }, function () {
          var closingObserver = _this._config.closingObserver;

          if (closingObserver) {
            closingObserver.next(undefined);
          }

          socket.close();

          _this._resetState();
        });

        if (queue && queue instanceof ReplaySubject) {
          subscription.add(queue.subscribe(_this.destination));
        }
      };

      socket.onerror = function (e) {
        _this._resetState();

        observer.error(e);
      };

      socket.onclose = function (e) {
        _this._resetState();

        var closeObserver = _this._config.closeObserver;

        if (closeObserver) {
          closeObserver.next(e);
        }

        if (e.wasClean) {
          observer.complete();
        } else {
          observer.error(e);
        }
      };

      socket.onmessage = function (e) {
        var deserializer = _this._config.deserializer;
        var result = tryCatch(deserializer)(e);

        if (result === errorObject) {
          observer.error(errorObject.e);
        } else {
          observer.next(result);
        }
      };
    };

    WebSocketSubject.prototype._subscribe = function (subscriber) {
      var _this = this;

      var source = this.source;

      if (source) {
        return source.subscribe(subscriber);
      }

      if (!this._socket) {
        this._connectSocket();
      }

      this._output.subscribe(subscriber);

      subscriber.add(function () {
        var _socket = _this._socket;

        if (_this._output.observers.length === 0) {
          if (_socket && _socket.readyState === 1) {
            _socket.close();
          }

          _this._resetState();
        }
      });
      return subscriber;
    };

    WebSocketSubject.prototype.unsubscribe = function () {
      var _a = this,
          source = _a.source,
          _socket = _a._socket;

      if (_socket && _socket.readyState === 1) {
        _socket.close();

        this._resetState();
      }

      _super.prototype.unsubscribe.call(this);

      if (!source) {
        this.destination = new ReplaySubject();
      }
    };

    return WebSocketSubject;
  }(AnonymousSubject);

  /** PURE_IMPORTS_START _WebSocketSubject PURE_IMPORTS_END */

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */

  // $FlowFixMe: missing definition
  var wsTransport = (function (url) {
    return new WebSocketSubject({
      url: url
    });
  });

  var ws = (function (url) {
    return new StreamRPC(wsTransport(url));
  });

  var HTTP_RE = /^https?:\/\//gi;
  var WS_RE = /^wss?:\/\//gi;
  var httpRPC = http;
  var wsRPC = ws;
  var createRPC = (function (endpoint) {
    if (typeof endpoint === 'string') {
      if (HTTP_RE.test(endpoint)) {
        return http(endpoint);
      }

      if (WS_RE.test(endpoint)) {
        return ws(endpoint);
      }

      throw new Error('Invalid endpoint provided: expecting HTTP or WebSocket URL');
    }

    return web3(endpoint);
  });

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass$2(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  var createInstantiateAPI = function createInstantiateAPI(createRPC) {
    return function instantiateAPI(maybeInstance, Cls) {
      if (maybeInstance != null) {
        return maybeInstance instanceof Cls ? maybeInstance : // $FlowFixMe: instance type
        new Cls(createRPC(maybeInstance));
      }
    };
  };

  var BaseClient =
  /*#__PURE__*/
  function () {
    function BaseClient(config) {
      if (config === void 0) {
        config = {};
      }

      _defineProperty(this, "_rpc", void 0);

      this._rpc = config.rpc;
    }

    var _proto = BaseClient.prototype;

    _proto.disconnect = function disconnect() {
      // $FlowFixMe: disconnect method is only present in StreamRPC
      if (this._rpc != null && typeof this._rpc.disconnect === 'function') {
        this._rpc.disconnect();
      }
    };

    _createClass$2(BaseClient, [{
      key: "rpc",
      get: function get() {
        if (this._rpc == null) {
          throw new Error('Could not access RPC: missing in configuration provided to client');
        }

        return this._rpc;
      }
    }]);

    return BaseClient;
  }();

  var instantiateAPI = createInstantiateAPI(createRPC);

  var BrowserClient =
  /*#__PURE__*/
  function (_BaseClient) {
    _inheritsLoose(BrowserClient, _BaseClient);

    function BrowserClient(config) {
      var _this;

      if (typeof config === 'string') {
        var rpc = createRPC(config);

        if (rpc instanceof StreamRPC) {
          // RPC supports stream
          _this = _BaseClient.call(this, {
            rpc: rpc
          }) || this;

          _defineProperty(_assertThisInitialized(_assertThisInitialized(_assertThisInitialized(_assertThisInitialized(_this)))), "_bzz", void 0);

          _defineProperty(_assertThisInitialized(_assertThisInitialized(_assertThisInitialized(_assertThisInitialized(_this)))), "_pss", void 0);
        } else {
          // Assume provided URL is HTTP
          _this = _BaseClient.call(this) || this;

          _defineProperty(_assertThisInitialized(_assertThisInitialized(_assertThisInitialized(_assertThisInitialized(_this)))), "_bzz", void 0);

          _defineProperty(_assertThisInitialized(_assertThisInitialized(_assertThisInitialized(_assertThisInitialized(_this)))), "_pss", void 0);

          _this._bzz = new Bzz(config);
        }
      } else {
        if (config.rpc == null) {
          if (config.ws != null) {
            config.rpc = wsRPC(config.ws);
          } else if (config.http != null) {
            config.rpc = httpRPC(config.http);
          }
        }

        _this = _BaseClient.call(this, config) || this;

        _defineProperty(_assertThisInitialized(_assertThisInitialized(_assertThisInitialized(_assertThisInitialized(_this)))), "_bzz", void 0);

        _defineProperty(_assertThisInitialized(_assertThisInitialized(_assertThisInitialized(_assertThisInitialized(_this)))), "_pss", void 0);

        if (config.bzz != null) {
          if (config.bzz instanceof Bzz) {
            _this._bzz = config.bzz;
          } else if (typeof config.bzz === 'string') {
            _this._bzz = new Bzz(config.bzz);
          } else if (typeof config.http === 'string') {
            _this._bzz = new Bzz(config.http);
          }
        } // $FlowFixMe: instance type


        _this._pss = instantiateAPI(config.pss, Pss);
      }

      return _assertThisInitialized(_this);
    }

    _createClass$2(BrowserClient, [{
      key: "bzz",
      get: function get() {
        if (this._bzz == null) {
          throw new Error('Missing Bzz instance or HTTP URL');
        }

        return this._bzz;
      }
    }, {
      key: "pss",
      get: function get() {
        if (this._pss == null) {
          // $FlowFixMe: runtime check
          this._pss = new Pss(this.rpc);
        }

        return this._pss;
      }
    }]);

    return BrowserClient;
  }(BaseClient);

  // Re-exports from imported libraries

  exports.BzzAPI = Bzz;
  exports.PssAPI = Pss;
  exports.createRPC = createRPC;
  exports.hexType = hexType;
  exports.hexEmpty = hexEmpty;
  exports.encodeHex = encodeHex;
  exports.decodeHex = decodeHex;
  exports.SwarmClient = BrowserClient;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
