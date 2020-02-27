// Copyright 2010 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module !== 'undefined' ? Module : {};

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)


// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
var key;
for (key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

var arguments_ = [];
var thisProgram = './this.program';
var quit_ = function(status, toThrow) {
  throw toThrow;
};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === 'object';
ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node === 'string';
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;




// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var read_,
    readAsync,
    readBinary,
    setWindowTitle;

var nodeFS;
var nodePath;

if (ENVIRONMENT_IS_NODE) {
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = require('path').dirname(scriptDirectory) + '/';
  } else {
    scriptDirectory = __dirname + '/';
  }


  read_ = function shell_read(filename, binary) {
    var ret = tryParseAsDataURI(filename);
    if (ret) {
      return binary ? ret : ret.toString();
    }
    if (!nodeFS) nodeFS = require('fs');
    if (!nodePath) nodePath = require('path');
    filename = nodePath['normalize'](filename);
    return nodeFS['readFileSync'](filename, binary ? null : 'utf8');
  };

  readBinary = function readBinary(filename) {
    var ret = read_(filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };




  if (process['argv'].length > 1) {
    thisProgram = process['argv'][1].replace(/\\/g, '/');
  }

  arguments_ = process['argv'].slice(2);

  if (typeof module !== 'undefined') {
    module['exports'] = Module;
  }

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });

  process['on']('unhandledRejection', abort);

  quit_ = function(status) {
    process['exit'](status);
  };

  Module['inspect'] = function () { return '[Emscripten Module object]'; };



} else
if (ENVIRONMENT_IS_SHELL) {


  if (typeof read != 'undefined') {
    read_ = function shell_read(f) {
      var data = tryParseAsDataURI(f);
      if (data) {
        return intArrayToString(data);
      }
      return read(f);
    };
  }

  readBinary = function readBinary(f) {
    var data;
    data = tryParseAsDataURI(f);
    if (data) {
      return data;
    }
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    arguments_ = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    arguments_ = arguments;
  }

  if (typeof quit === 'function') {
    quit_ = function(status) {
      quit(status);
    };
  }

  if (typeof print !== 'undefined') {
    // Prefer to use print/printErr where they exist, as they usually work better.
    if (typeof console === 'undefined') console = {};
    console.log = print;
    console.warn = console.error = typeof printErr !== 'undefined' ? printErr : print;
  }


} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) { // Check worker, not web, since window could be polyfilled
    scriptDirectory = self.location.href;
  } else if (document.currentScript) { // web
    scriptDirectory = document.currentScript.src;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
  // and scriptDirectory will correctly be replaced with an empty string.
  if (scriptDirectory.indexOf('blob:') !== 0) {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf('/')+1);
  } else {
    scriptDirectory = '';
  }


  // Differentiate the Web Worker from the Node Worker case, as reading must
  // be done differently.
  {


  read_ = function shell_read(url) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send(null);
      return xhr.responseText;
    } catch (err) {
      var data = tryParseAsDataURI(url);
      if (data) {
        return intArrayToString(data);
      }
      throw err;
    }
  };

  if (ENVIRONMENT_IS_WORKER) {
    readBinary = function readBinary(url) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.responseType = 'arraybuffer';
        xhr.send(null);
        return new Uint8Array(xhr.response);
      } catch (err) {
        var data = tryParseAsDataURI(url);
        if (data) {
          return data;
        }
        throw err;
      }
    };
  }

  readAsync = function readAsync(url, onload, onerror) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function xhr_onload() {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
        onload(xhr.response);
        return;
      }
      var data = tryParseAsDataURI(url);
      if (data) {
        onload(data.buffer);
        return;
      }
      onerror();
    };
    xhr.onerror = onerror;
    xhr.send(null);
  };




  }

  setWindowTitle = function(title) { document.title = title };
} else
{
}


// Set up the out() and err() hooks, which are how we can print to stdout or
// stderr, respectively.
var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.warn.bind(console);

// Merge back in the overrides
for (key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = null;

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.
if (Module['arguments']) arguments_ = Module['arguments'];
if (Module['thisProgram']) thisProgram = Module['thisProgram'];
if (Module['quit']) quit_ = Module['quit'];

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message

// TODO remove when SDL2 is fixed (also see above)



// Copyright 2017 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

// {{PREAMBLE_ADDITIONS}}

var STACK_ALIGN = 16;


function dynamicAlloc(size) {
  var ret = HEAP32[DYNAMICTOP_PTR>>2];
  var end = (ret + size + 15) & -16;
  if (end > _emscripten_get_heap_size()) {
    abort();
  }
  HEAP32[DYNAMICTOP_PTR>>2] = end;
  return ret;
}

function alignMemory(size, factor) {
  if (!factor) factor = STACK_ALIGN; // stack alignment (16-byte) by default
  return Math.ceil(size / factor) * factor;
}

function getNativeTypeSize(type) {
  switch (type) {
    case 'i1': case 'i8': return 1;
    case 'i16': return 2;
    case 'i32': return 4;
    case 'i64': return 8;
    case 'float': return 4;
    case 'double': return 8;
    default: {
      if (type[type.length-1] === '*') {
        return 4; // A pointer
      } else if (type[0] === 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 === 0, 'getNativeTypeSize invalid bits ' + bits + ', type ' + type);
        return bits / 8;
      } else {
        return 0;
      }
    }
  }
}

function warnOnce(text) {
  if (!warnOnce.shown) warnOnce.shown = {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    err(text);
  }
}






// Wraps a JS function as a wasm function with a given signature.
function convertJsFunctionToWasm(func, sig) {

  // If the type reflection proposal is available, use the new
  // "WebAssembly.Function" constructor.
  // Otherwise, construct a minimal wasm module importing the JS function and
  // re-exporting it.
  if (typeof WebAssembly.Function === "function") {
    var typeNames = {
      'i': 'i32',
      'j': 'i64',
      'f': 'f32',
      'd': 'f64'
    };
    var type = {
      parameters: [],
      results: sig[0] == 'v' ? [] : [typeNames[sig[0]]]
    };
    for (var i = 1; i < sig.length; ++i) {
      type.parameters.push(typeNames[sig[i]]);
    }
    return new WebAssembly.Function(type, func);
  }

  // The module is static, with the exception of the type section, which is
  // generated based on the signature passed in.
  var typeSection = [
    0x01, // id: section,
    0x00, // length: 0 (placeholder)
    0x01, // count: 1
    0x60, // form: func
  ];
  var sigRet = sig.slice(0, 1);
  var sigParam = sig.slice(1);
  var typeCodes = {
    'i': 0x7f, // i32
    'j': 0x7e, // i64
    'f': 0x7d, // f32
    'd': 0x7c, // f64
  };

  // Parameters, length + signatures
  typeSection.push(sigParam.length);
  for (var i = 0; i < sigParam.length; ++i) {
    typeSection.push(typeCodes[sigParam[i]]);
  }

  // Return values, length + signatures
  // With no multi-return in MVP, either 0 (void) or 1 (anything else)
  if (sigRet == 'v') {
    typeSection.push(0x00);
  } else {
    typeSection = typeSection.concat([0x01, typeCodes[sigRet]]);
  }

  // Write the overall length of the type section back into the section header
  // (excepting the 2 bytes for the section id and length)
  typeSection[1] = typeSection.length - 2;

  // Rest of the module is static
  var bytes = new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, // magic ("\0asm")
    0x01, 0x00, 0x00, 0x00, // version: 1
  ].concat(typeSection, [
    0x02, 0x07, // import section
      // (import "e" "f" (func 0 (type 0)))
      0x01, 0x01, 0x65, 0x01, 0x66, 0x00, 0x00,
    0x07, 0x05, // export section
      // (export "f" (func 0 (type 0)))
      0x01, 0x01, 0x66, 0x00, 0x00,
  ]));

   // We can compile this wasm module synchronously because it is very small.
  // This accepts an import (at "e.f"), that it reroutes to an export (at "f")
  var module = new WebAssembly.Module(bytes);
  var instance = new WebAssembly.Instance(module, {
    'e': {
      'f': func
    }
  });
  var wrappedFunc = instance.exports['f'];
  return wrappedFunc;
}

// Add a wasm function to the table.
function addFunctionWasm(func, sig) {
  var table = wasmTable;
  var ret = table.length;

  // Grow the table
  try {
    table.grow(1);
  } catch (err) {
    if (!(err instanceof RangeError)) {
      throw err;
    }
    throw 'Unable to grow wasm table. Use a higher value for RESERVED_FUNCTION_POINTERS or set ALLOW_TABLE_GROWTH.';
  }

  // Insert new element
  try {
    // Attempting to call this with JS function will cause of table.set() to fail
    table.set(ret, func);
  } catch (err) {
    if (!(err instanceof TypeError)) {
      throw err;
    }
    assert(typeof sig !== 'undefined', 'Missing signature argument to addFunction');
    var wrapped = convertJsFunctionToWasm(func, sig);
    table.set(ret, wrapped);
  }

  return ret;
}

function removeFunctionWasm(index) {
  // TODO(sbc): Look into implementing this to allow re-using of table slots
}

// 'sig' parameter is required for the llvm backend but only when func is not
// already a WebAssembly function.
function addFunction(func, sig) {

  return addFunctionWasm(func, sig);
}

function removeFunction(index) {
  removeFunctionWasm(index);
}



var funcWrappers = {};

function getFuncWrapper(func, sig) {
  if (!func) return; // on null pointer, return undefined
  assert(sig);
  if (!funcWrappers[sig]) {
    funcWrappers[sig] = {};
  }
  var sigCache = funcWrappers[sig];
  if (!sigCache[func]) {
    // optimize away arguments usage in common cases
    if (sig.length === 1) {
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func);
      };
    } else if (sig.length === 2) {
      sigCache[func] = function dynCall_wrapper(arg) {
        return dynCall(sig, func, [arg]);
      };
    } else {
      // general case
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func, Array.prototype.slice.call(arguments));
      };
    }
  }
  return sigCache[func];
}


function makeBigInt(low, high, unsigned) {
  return unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0));
}

function dynCall(sig, ptr, args) {
  if (args && args.length) {
    return Module['dynCall_' + sig].apply(null, [ptr].concat(args));
  } else {
    return Module['dynCall_' + sig].call(null, ptr);
  }
}

var tempRet0 = 0;

var setTempRet0 = function(value) {
  tempRet0 = value;
};

var getTempRet0 = function() {
  return tempRet0;
};


var Runtime = {
};

// The address globals begin at. Very low in memory, for code size and optimization opportunities.
// Above 0 is static memory, starting with globals.
// Then the stack.
// Then 'dynamic' memory for sbrk.
var GLOBAL_BASE = 1024;




// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html


var wasmBinary;if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];
var noExitRuntime;if (Module['noExitRuntime']) noExitRuntime = Module['noExitRuntime'];


if (typeof WebAssembly !== 'object') {
  err('no native wasm support detected');
}


// In MINIMAL_RUNTIME, setValue() and getValue() are only available when building with safe heap enabled, for heap safety checking.
// In traditional runtime, setValue() and getValue() are always available (although their use is highly discouraged due to perf penalties)

/** @type {function(number, number, string, boolean=)} */
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}

/** @type {function(number, string, boolean=)} */
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for getValue: ' + type);
    }
  return null;
}





// Wasm globals

var wasmMemory;

// In fastcomp asm.js, we don't need a wasm Table at all.
// In the wasm backend, we polyfill the WebAssembly object,
// so this creates a (non-native-wasm) table for us.
var wasmTable = new WebAssembly.Table({
  'initial': 964,
  'maximum': 964 + 0,
  'element': 'anyfunc'
});


//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS = 0;

/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
  return func;
}

// C calling interface.
function ccall(ident, returnType, argTypes, args, opts) {
  // For fast lookup of conversion functions
  var toC = {
    'string': function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        var len = (str.length << 2) + 1;
        ret = stackAlloc(len);
        stringToUTF8(str, ret, len);
      }
      return ret;
    },
    'array': function(arr) {
      var ret = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    }
  };

  function convertReturnValue(ret) {
    if (returnType === 'string') return UTF8ToString(ret);
    if (returnType === 'boolean') return Boolean(ret);
    return ret;
  }

  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func.apply(null, cArgs);

  ret = convertReturnValue(ret);
  if (stack !== 0) stackRestore(stack);
  return ret;
}

function cwrap(ident, returnType, argTypes, opts) {
  argTypes = argTypes || [];
  // When the function takes numbers and returns a number, we can just return
  // the original function
  var numericArgs = argTypes.every(function(type){ return type === 'number'});
  var numericRet = returnType !== 'string';
  if (numericRet && numericArgs && !opts) {
    return getCFunc(ident);
  }
  return function() {
    return ccall(ident, returnType, argTypes, arguments, opts);
  }
}

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_DYNAMIC = 2; // Cannot be freed except through sbrk
var ALLOC_NONE = 3; // Do not allocate

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
/** @type {function((TypedArray|Array<number>|number), string, number, number=)} */
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc,
    stackAlloc,
    dynamicAlloc][allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var stop;
    ptr = ret;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(/** @type {!Uint8Array} */ (slab), ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}

// Allocate memory during any stage of startup - static memory early on, dynamic memory later, malloc when ready
function getMemory(size) {
  if (!runtimeInitialized) return dynamicAlloc(size);
  return _malloc(size);
}


// runtime_strings.js: Strings related runtime functions that are part of both MINIMAL_RUNTIME and regular runtime.

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;

/**
 * @param {number} idx
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  // (As a tiny code save trick, compare endPtr against endIdx using a negation, so that undefined means Infinity)
  while (u8Array[endPtr] && !(endPtr >= endIdx)) ++endPtr;

  if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
  } else {
    var str = '';
    // If building with TextDecoder, we have already computed the string length above, so test loop end condition against that
    while (idx < endPtr) {
      // For UTF8 byte structure, see:
      // http://en.wikipedia.org/wiki/UTF-8#Description
      // https://www.ietf.org/rfc/rfc2279.txt
      // https://tools.ietf.org/html/rfc3629
      var u0 = u8Array[idx++];
      if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
      var u1 = u8Array[idx++] & 63;
      if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
      var u2 = u8Array[idx++] & 63;
      if ((u0 & 0xF0) == 0xE0) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (u8Array[idx++] & 63);
      }

      if (u0 < 0x10000) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 0x10000;
        str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
      }
    }
  }
  return str;
}

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns a
// copy of that string as a Javascript String object.
// maxBytesToRead: an optional length that specifies the maximum number of bytes to read. You can omit
//                 this parameter to scan the string until the first \0 byte. If maxBytesToRead is
//                 passed, and the string at [ptr, ptr+maxBytesToReadr[ contains a null byte in the
//                 middle, then the string will cut short at that byte index (i.e. maxBytesToRead will
//                 not produce a string of exact length [ptr, ptr+maxBytesToRead[)
//                 N.B. mixing frequent uses of UTF8ToString() with and without maxBytesToRead may
//                 throw JS JIT optimizations off, so it is worth to consider consistently using one
//                 style or the other.
/**
 * @param {number} ptr
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ToString(ptr, maxBytesToRead) {
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
}

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outU8Array: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array.
//                    This count should include the null terminator,
//                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) {
      var u1 = str.charCodeAt(++i);
      u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
    }
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      outU8Array[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      outU8Array[outIdx++] = 0xC0 | (u >> 6);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      outU8Array[outIdx++] = 0xE0 | (u >> 12);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      outU8Array[outIdx++] = 0xF0 | (u >> 18);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  outU8Array[outIdx] = 0;
  return outIdx - startIdx;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) ++len;
    else if (u <= 0x7FF) len += 2;
    else if (u <= 0xFFFF) len += 3;
    else len += 4;
  }
  return len;
}



// runtime_strings_extra.js: Strings related runtime functions that are available only in regular runtime.

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAPU8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;

function UTF16ToString(ptr) {
  var endPtr = ptr;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  var idx = endPtr >> 1;
  while (HEAP16[idx]) ++idx;
  endPtr = idx << 1;

  if (endPtr - ptr > 32 && UTF16Decoder) {
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } else {
    var i = 0;

    var str = '';
    while (1) {
      var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
      if (codeUnit == 0) return str;
      ++i;
      // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
      str += String.fromCharCode(codeUnit);
    }
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[((outPtr)>>1)]=codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)]=0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}

function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)]=codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)]=0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }

  return len;
}

// Allocate heap space for a JS string, and write it there.
// It is the responsibility of the caller to free() that memory.
function allocateUTF8(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Allocate stack space for a JS string, and write it there.
function allocateUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Deprecated: This function should not be called because it is unsafe and does not provide
// a maximum length limit of how many bytes it is allowed to write. Prefer calling the
// function stringToUTF8Array() instead, which takes in a maximum length that can be used
// to be secure from out of bounds writes.
/** @deprecated */
function writeStringToMemory(string, buffer, dontAddNull) {
  warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');

  var /** @type {number} */ lastChar, /** @type {number} */ end;
  if (dontAddNull) {
    // stringToUTF8Array always appends null. If we don't want to do that, remember the
    // character that existed at the location where the null will be placed, and restore
    // that after the write (below).
    end = buffer + lengthBytesUTF8(string);
    lastChar = HEAP8[end];
  }
  stringToUTF8(string, buffer, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
}

function writeArrayToMemory(array, buffer) {
  HEAP8.set(array, buffer);
}

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    HEAP8[((buffer++)>>0)]=str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)]=0;
}



// Memory management

var PAGE_SIZE = 16384;
var WASM_PAGE_SIZE = 65536;
var ASMJS_PAGE_SIZE = 16777216;

function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - (x % multiple);
  }
  return x;
}

var HEAP,
/** @type {ArrayBuffer} */
  buffer,
/** @type {Int8Array} */
  HEAP8,
/** @type {Uint8Array} */
  HEAPU8,
/** @type {Int16Array} */
  HEAP16,
/** @type {Uint16Array} */
  HEAPU16,
/** @type {Int32Array} */
  HEAP32,
/** @type {Uint32Array} */
  HEAPU32,
/** @type {Float32Array} */
  HEAPF32,
/** @type {Float64Array} */
  HEAPF64;

function updateGlobalBufferAndViews(buf) {
  buffer = buf;
  Module['HEAP8'] = HEAP8 = new Int8Array(buf);
  Module['HEAP16'] = HEAP16 = new Int16Array(buf);
  Module['HEAP32'] = HEAP32 = new Int32Array(buf);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buf);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buf);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buf);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buf);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buf);
}

var STATIC_BASE = 1024,
    STACK_BASE = 5296976,
    STACKTOP = STACK_BASE,
    STACK_MAX = 54096,
    DYNAMIC_BASE = 5296976,
    DYNAMICTOP_PTR = 53936;




var TOTAL_STACK = 5242880;

var INITIAL_TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 134217728;







// In standalone mode, the wasm creates the memory, and the user can't provide it.
// In non-standalone/normal mode, we create the memory here.

// Create the main memory. (Note: this isn't used in STANDALONE_WASM mode since the wasm
// memory is created in the wasm, not in JS.)

  if (Module['wasmMemory']) {
    wasmMemory = Module['wasmMemory'];
  } else
  {
    wasmMemory = new WebAssembly.Memory({
      'initial': INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE
    });
  }


if (wasmMemory) {
  buffer = wasmMemory.buffer;
}

// If the user provides an incorrect length, just use that length instead rather than providing the user to
// specifically provide the memory length with Module['TOTAL_MEMORY'].
INITIAL_TOTAL_MEMORY = buffer.byteLength;
updateGlobalBufferAndViews(buffer);

HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;










function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Module['dynCall_v'](func);
      } else {
        Module['dynCall_vi'](func, callback.arg);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;
var runtimeExited = false;


function preRun() {

  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
  runtimeInitialized = true;
  if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
TTY.init();
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  FS.ignorePermissions = false;
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  runtimeExited = true;
}

function postRun() {

  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}

function addOnExit(cb) {
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}


// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_round = Math.round;
var Math_min = Math.min;
var Math_max = Math.max;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;



// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function getUniqueRunDependency(id) {
  return id;
}

function addRunDependency(id) {
  runDependencies++;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

}

function removeRunDependency(id) {
  runDependencies--;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


function abort(what) {
  if (Module['onAbort']) {
    Module['onAbort'](what);
  }

  what += '';
  out(what);
  err(what);

  ABORT = true;
  EXITSTATUS = 1;

  what = 'abort(' + what + '). Build with -s ASSERTIONS=1 for more info.';

  // Throw a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  throw new WebAssembly.RuntimeError(what);
}


var memoryInitializer = null;





// Copyright 2017 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

// Indicates whether filename is a base64 data URI.
function isDataURI(filename) {
  return String.prototype.startsWith ?
      filename.startsWith(dataURIPrefix) :
      filename.indexOf(dataURIPrefix) === 0;
}




var wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAABuwutAWABfwF/YAABf2ACf38AYAJ/fwF/YAF/AGADf39/AX9gA39/fwBgBn9/f39/fwF/YAR/f39/AX9gAABgBn9/f39/fwBgBX9/f39/AX9gBH9/f38AYAJ/fABgCH9/f39/f39/AX9gBX9/f39/AGABfwF8YAJ/fAF8YAF8AXxgAX0BfWADf3x8AXxgAnx8AXxgB39/f39/f38Bf2AHf39/f39/fwBgAn9/AXxgBH98fHwBfGADf39/AXxgA39/fABgBX9+fn5+AGABfwF9YAZ/fHx8fHwBfGAEf39/fABgAAF+YAN/fn8BfmAEf3x8fwF8YAV8fHx8fAF8YAp/f39/f39/f39/AGAFf39+f38AYAN/fH8AYAV/f39/fgF/YAJ/fwF9YAN8fHwBfGADf3x8AGAHf39/f39+fgF/YAV/f39/fAF/YAR/f39/AX5gBX9/fHx/AXxgBn98f3x8fAF8YAV/fHx/fAF8YAV/fHx8fwF8YAh/f39/f39/fwBgB39/f39/fHwAYAZ/f39/fHwAYAR/f399AGAGf399fX9/AGAEf398fwBgBX9/fH98AGAGf398f3x8AGAHf398f3x8fABgBH9/fHwAYAV/f3x8fABgBH9+fn8AYAJ/fQBgBX99fX9/AGAEf3x/fABgBX98f3x8AGAGf3x/fHx8AGAEf3x8fABgCn9/f39/f39/f38Bf2AGf39/f35+AX9gBH9/f3wBf2AEf399fwF/YAN/fn8Bf2ADf31/AX9gAn98AX9gBn98f39/fwF/YAF8AX9gAX8BfmADf39/AX1gBH9/f38BfWAFf39/f38BfWACfX8BfWAEf39/fwF8YAN/f3wBfGAEf398fwF8YAV/f3x/fAF8YAZ/f3x/fH8BfGAHf398f3x8fAF8YAR/f3x8AXxgBn9/fHx/fAF8YAd/f3x8f3x8AXxgBX9/fHx8AXxgBn9/fHx8fwF8YAd/f3x8fH9/AXxgB39/fHx8f3wBfGAHf398fHx8fAF8YAl/f3x8fHx8f38BfGADf3x/AXxgBH98f3wBfGAFf3x/fH8BfGAGf3x8f3x8AXxgBn98fHx/fwF8YAZ/fHx8f3wBfGAIf3x8fHx8f38BfGACfH8BfGAPf39/f39/f39/f39/f39/AGADf399AGAJf39/f39/f39/AX9gC39/f39/f39/f39/AX9gDH9/f39/f39/f39/fwF/YAR/f399AX9gAn5/AX9gBH5+fn4Bf2ADf39/AX5gBH9/f34BfmACfX0BfWABfAF9YAN8fH8BfGAMf39/f39/f39/f39/AGANf39/f39/f39/f39/fwBgCH9/f39/f3x8AGAFf39/f30AYAV/f39/fABgBn9/f35/fwBgB39/f319f38AYAV/f398fwBgBn9/f3x/fABgB39/f3x/fHwAYAh/f398f3x8fABgBX9/f3x8AGAGf39/fHx8AGADf39+AGACf34AYAN/fX0AYAh/f39/f39+fgF/YAZ/f39/f34Bf2AGf39/f398AX9gBX9/f399AX9gBX9/f31/AX9gA39/fAF/YAd/f3x/f39/AX9gBn9/fHx8fwF/YAJ/fgF/YAR/fn9/AX9gA399fQF/YAN/fHwBf2ADfn9/AX9gAn5+AX9gAn1/AX9gAnx/AX9gAn9/AX5gBH9/fn8BfmABfAF+YAZ/f39/f38BfWACfn4BfWAFf39/f38BfGAEf39/fAF8YAV/f398fwF8YAZ/f398f3wBfGAHf39/fH98fwF8YAh/f398f3x8fAF8YAV/f398fAF8YAZ/f398fH8BfGAHf39/fHx/fAF8YAh/f398fH98fAF8YAZ/f398fHwBfGAHf39/fHx8fwF8YAh/f398fHx/fwF8YAh/f398fHx/fAF8YAh/f398fHx8fAF8YAp/f398fHx8fH9/AXxgAn5+AXxgAn1/AXwClgktA2VudhZfZW1iaW5kX3JlZ2lzdGVyX2NsYXNzAHcDZW52JV9lbWJpbmRfcmVnaXN0ZXJfY2xhc3NfY2xhc3NfZnVuY3Rpb24AFwNlbnYfX2VtYmluZF9yZWdpc3Rlcl9jbGFzc19wcm9wZXJ0eQAkA2VudhVfZW1iaW5kX3JlZ2lzdGVyX2VudW0ADANlbnYbX2VtYmluZF9yZWdpc3Rlcl9lbnVtX3ZhbHVlAAYDZW52Gl9lbWJpbmRfcmVnaXN0ZXJfc21hcnRfcHRyAHYDZW52Il9lbWJpbmRfcmVnaXN0ZXJfY2xhc3NfY29uc3RydWN0b3IACgNlbnYYX19jeGFfYWxsb2NhdGVfZXhjZXB0aW9uAAADZW52C19fY3hhX3Rocm93AAYDZW52H19lbWJpbmRfcmVnaXN0ZXJfY2xhc3NfZnVuY3Rpb24AMgNlbnYNX2VtdmFsX2luY3JlZgAEA2Vudg1fZW12YWxfZGVjcmVmAAQDZW52EV9lbXZhbF90YWtlX3ZhbHVlAAMDZW52C19lbXZhbF9jYWxsAAgDZW52BXJvdW5kABIDZW52BGV4aXQABANlbnYNX19hc3NlcnRfZmFpbAAMA2VudgpfX3N5c2NhbGw1AAMDZW52DF9fc3lzY2FsbDIyMQADA2VudgtfX3N5c2NhbGw1NAADFndhc2lfc25hcHNob3RfcHJldmlldzEIZmRfd3JpdGUACBZ3YXNpX3NuYXBzaG90X3ByZXZpZXcxB2ZkX3JlYWQACBZ3YXNpX3NuYXBzaG90X3ByZXZpZXcxCGZkX2Nsb3NlAAADZW52Bl9fbG9jawAEA2VudghfX3VubG9jawAEFndhc2lfc25hcHNob3RfcHJldmlldzERZW52aXJvbl9zaXplc19nZXQAAxZ3YXNpX3NuYXBzaG90X3ByZXZpZXcxC2Vudmlyb25fZ2V0AAMDZW52Cl9fbWFwX2ZpbGUAAwNlbnYLX19zeXNjYWxsOTEAAwNlbnYKc3RyZnRpbWVfbAALA2VudgVhYm9ydAAJA2VudhVfZW1iaW5kX3JlZ2lzdGVyX3ZvaWQAAgNlbnYVX2VtYmluZF9yZWdpc3Rlcl9ib29sAA8DZW52G19lbWJpbmRfcmVnaXN0ZXJfc3RkX3N0cmluZwACA2VudhxfZW1iaW5kX3JlZ2lzdGVyX3N0ZF93c3RyaW5nAAYDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfZW12YWwAAgNlbnYYX2VtYmluZF9yZWdpc3Rlcl9pbnRlZ2VyAA8DZW52Fl9lbWJpbmRfcmVnaXN0ZXJfZmxvYXQABgNlbnYcX2VtYmluZF9yZWdpc3Rlcl9tZW1vcnlfdmlldwAGA2VudhZlbXNjcmlwdGVuX3Jlc2l6ZV9oZWFwAAADZW52FWVtc2NyaXB0ZW5fbWVtY3B5X2JpZwAFA2VudgtzZXRUZW1wUmV0MAAEFndhc2lfc25hcHNob3RfcHJldmlldzEHZmRfc2VlawALA2VudgZtZW1vcnkCAIAQA2VudgV0YWJsZQFwAMQHA5wb7RoBCQkABAQEBAQJAQEBAQEAAQEEAQQAAAECBAAEAQEBAAQAAAEMBgEBAAABAgMGAAIAAgEBAQABBAICAgICAgEBAQABBAICAQEQAQ0YGwACAQEBAAEEAgIBAQEAAQQCAhANEA0BAQEAAQQCAgIBAQEAAQQRAkMCDQIAAgEBAQAfAAABRikAARkBAQEAAQQqAg0CEAIQDRANDQEBAQAEAQQAAgICAgICAgICBAICAgIBAQEABCMCIyMpAgAAAR4BAQEAAQQCAgICAQEBAAEEAgICAgACAQEBAAQCABgSAgABEQEBAQABBBQCAQEBAAQRAhQCFAEBAQABBC8CAQEBAAEELwIBAQEAAQQUAgEBAQABBA0CDR4CAQEBAAQAAAEUFRUVFRUVFRUVEhUBAQEAAQQCAgIAAgACAAIQAhACAQIDAAIBAQEAAQQiAgICAQEBAAQABBQCJgICAhgCAAIBAQEBAQEABAAEFAImAgICGAIAAgEBAQAEAQQCAgICAAAAAgAAAAMFAQEBAAQBBAICAwUBAQEABAEENAIDAgEBAQAEAQQCAgYCAAIGAgUCAQEBAAQBBAICBgIAAgYCBQIBAQEABAEEAgIGAgACBgIFAgEBAQAEAQQCAgYCAgYCAgEBAQAEAQQCAgYCAgYCAgQEBQMDAAMDKgAAAwAAAwAAAwMAAAADAAEBJgQAAgkAAQEBAAQBAQABAQMEAAAABAICEAINAjACIgIBAQEABAEDAAAEAgIwAgEBAQABBAICAgINDQACZgIxAgADjQECEBEJAAEBAQAAAwABBQMDAwABCAUDAwMAAAADAwMDAwMDAwMAAAEAEBAAAUpMAAEJAAEBAQABBBECFAIJAAEBAQABBBQCCQABAQEAAQQiAgQCBAIADwACAgACAAAEAgIAAAIAAAACBgQAAwADAAIFBgYDAAAAAQMFAwABBQAEAwMGBgYGBgIEAAAMDAMDBQMDAwQDBQMBAAAGAgYCAwMEBgMIAgAGAAADBQADAAQMAgIEAAYAAAADAAAAAwUAAgYAAgIGBgICAAABAQEABAAAAAEAAwAGAAEADAEAAwEABQAAAAEDAgEACAECBgIDAwgCAAUAAAQAAgACBgABAQEAAAEAGxIBAAEfAQABAAEDDQEARgEAAAYCBgIDAwYDCAIABgAABQADAAQCBAAGAAAAAAAABQIGAAICBgYCAgAAAQEBAAQAAAEAAwAGAQAMAQABAAEDAQABAAgBAAAGAgYCAwYDCAIAAAAFAAMABAIEAAAAAAACAAICBgYCAgAAAQEBAAQAAAEAAwABAAEAAQABAwEAAQABAAYCBgIDBgMIAgAABQADAAQCBAAAAAIAAgYGAAABAQEAAAABAAMAAWoTAQABNQEAAQABAwEdPgEAAW4BAAEBAQABAQEAAQEBAAEBAAEBAQABAAFTAQAAAVsBAAFYAQAYAQAbAQABAQEAAQABUgEAHwEAAQEBAAEAAVUBAAFWAQABAQEAAAEAAQABAAEBAQABAAE4AQABOQEAAAE6AQABAQEAAAEAAQABPAEAAQADAQABAQEAAQMBAAEBAQAAAQABOwEAAQABAAABAQEAAAAAAAABAAAEAAABAAYBAAwBAAgBAAEAAQABAAEAAgEAAQABNgEACAIBBQAAAgAAAAICAgUCAAEAAQEBAAEeARkAAQEBAAEAAVoBAAFfAQABAAEAAQEBAAABAAFdAQAAAWABAAFUAQABAAEBAQABGAERAQABAQEAAAEAAQABAQEAAQABAAEAAQEBAAABAAFXAQABAQEAAAEAAQABAQEAAAEAAQABAQEAAAEAAQABAAEBAQABAQABAQEAAQABAAEAAQABAQABAQEAAAEAAS4BAAEAAQAAAQEBAAQAAAQAAAYAAgYCAwADAQACAgACAgIDAAIDCAICAAICAAUAAwACBAACAgAAAAAFAgACAgICAgIAAQABNwEAAQABGgEAAQABAQEDAAEAAQABAAEAAQABAAABAQEAAAEAAAEPAQABRwEAASgBAAMAAQMDAgwFAAEBAAABAQEAAAEAAQABUAEBAAABAQEAAAESEhARAAEzAQAFAAEAAAEBAQAABAAAAAIAAAYAAAYAAAEAAgMIAAEDAwUDAQEDAwUFAAICAwMDAwMAAAAEBAADAwQDBgMDAwMGAAAAAQQAAAMEBQUFAAAAAAAABQMCAwAAAAQEBAYAAAIGAAAAAwABAAEAAQADAgAAAwADAwMaEAQEBgAGBgAAAwUGAgUFAAIAAwAAAAFZAQAuAQAAAQEBAQgBBQUFAAMAAAQEAwQDBAUAAAAAAAUDAgAAAAQEBAACAAEAAQABAQEAAAEAAQABAAEAAQABXgEAAVwBAAEBAQEBAQEBAQABAQEAAAEAAQABAAEBAQAAAQABAAEBAQAAAQABCQAQERERERERFBEZERERGhsAYmMUFBkZGWhA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YXRpdmVfYW5kX2J1aWx0aW5fdHlwZXMAxxkKX19kYXRhX2VuZAMBCXN0YWNrU2F2ZQCyGgpzdGFja0FsbG9jALMaDHN0YWNrUmVzdG9yZQC0GhBfX2dyb3dXYXNtTWVtb3J5ALUaCmR5bkNhbGxfaWkAthoKZHluQ2FsbF92aQC3GglkeW5DYWxsX2kAuBoLZHluQ2FsbF92aWkAuRoNZHluQ2FsbF92aWlpaQC6GgxkeW5DYWxsX3ZpaWkAuxoLZHluQ2FsbF9paWkAvBoLZHluQ2FsbF9kaWQAvRoNZHluQ2FsbF9kaWRkZAC+GgxkeW5DYWxsX2RpZGQAvxoKZHluQ2FsbF9kaQDAGgtkeW5DYWxsX3ZpZADBGgxkeW5DYWxsX2RpaWkAwhoMZHluQ2FsbF92aWlkAMMaC2R5bkNhbGxfZGlpAMQaDWR5bkNhbGxfZGlkaWQAxRoOZHluQ2FsbF9kaWRpZGkAxhoNZHluQ2FsbF92aWRpZADHGg5keW5DYWxsX3ZpZGlkZADIGg9keW5DYWxsX3ZpZGlkZGQAyRoNZHluQ2FsbF92aWRkZADKGg1keW5DYWxsX3ZpaWlkAMsaDWR5bkNhbGxfaWlpaWQAzBoMZHluQ2FsbF9kZGRkAM0aDGR5bkNhbGxfdmlkZADOGgxkeW5DYWxsX2lpaWkAzxoOZHluQ2FsbF92aWZmaWkA0BoOZHluQ2FsbF9kZGRkZGQA0RoPZHluQ2FsbF9kaWRkZGRkANIaD2R5bkNhbGxfZGlkZGlkZADTGg9keW5DYWxsX2RpZGRkaWkA1BoRZHluQ2FsbF9kaWRkZGRkaWkA1RoMZHluQ2FsbF9kaWRpANYaCmR5bkNhbGxfZGQA1xoPZHluQ2FsbF9kaWRpZGRkANgaC2R5bkNhbGxfZGRkANkaDWR5bkNhbGxfZGlkZGkA2hoMZHluQ2FsbF92aWRpANsaDGR5bkNhbGxfaWlmaQDcGgpkeW5DYWxsX2ZpAN0aDWR5bkNhbGxfZmlpaWkA3hoPZHluQ2FsbF92aWlpaWRkAN8aDGR5bkNhbGxfZGlpZADgGg5keW5DYWxsX2RpaWRkZADhGg1keW5DYWxsX2RpaWRkAOIaDWR5bkNhbGxfZGlpaWkA4xoOZHluQ2FsbF9kaWlkaWQA5BoPZHluQ2FsbF9kaWlkaWRpAOUaDmR5bkNhbGxfdmlpZGlkAOYaD2R5bkNhbGxfdmlpZGlkZADnGhBkeW5DYWxsX3ZpaWRpZGRkAOgaDmR5bkNhbGxfdmlpZGRkAOkaDWR5bkNhbGxfdmlpZGQA6hoNZHluQ2FsbF9paWlpaQDrGg9keW5DYWxsX3ZpaWZmaWkA7BoQZHluQ2FsbF9kaWlkZGlkZADtGhBkeW5DYWxsX2RpaWRkZGRkAO4aEGR5bkNhbGxfZGlpZGRkaWkA7xoSZHluQ2FsbF9kaWlkZGRkZGlpAPAaDWR5bkNhbGxfZGlpZGkA8RoQZHluQ2FsbF9kaWlkaWRkZADyGg5keW5DYWxsX2RpaWRkaQDzGg1keW5DYWxsX3ZpaWRpAPQaDmR5bkNhbGxfdmlpaWlpAPUaDWR5bkNhbGxfaWlpZmkA9hoLZHluQ2FsbF9maWkA9xoOZHluQ2FsbF9maWlpaWkA+BoQZHluQ2FsbF92aWlpaWlkZAD5GgxkeW5DYWxsX3ZpaWYA+hoNZHluQ2FsbF92aWlpZgD7Gg1keW5DYWxsX2lpaWlmAPwaDmR5bkNhbGxfZGlkZGlkAP0aD2R5bkNhbGxfZGlkZGRpZAD+Gg5keW5DYWxsX2RpZGRkaQD/Gg9keW5DYWxsX2RpaWRkaWQAgBsQZHluQ2FsbF9kaWlkZGRpZACBGw9keW5DYWxsX2RpaWRkZGkAghsLZHluQ2FsbF9paWQAgxsKZHluQ2FsbF9pZACEGwlkeW5DYWxsX3YAhRsOZHluQ2FsbF92aWlqaWkAkhsMZHluQ2FsbF9qaWppAJMbD2R5bkNhbGxfaWlkaWlpaQCIGw5keW5DYWxsX2lpaWlpaQCJGxFkeW5DYWxsX2lpaWlpaWlpaQCKGw9keW5DYWxsX2lpaWlpaWkAixsOZHluQ2FsbF9paWlpaWoAlBsOZHluQ2FsbF9paWlpaWQAjRsPZHluQ2FsbF9paWlpaWpqAJUbEGR5bkNhbGxfaWlpaWlpaWkAjxsQZHluQ2FsbF9paWlpaWlqagCWGw9keW5DYWxsX3ZpaWlpaWkAkRsJwA4BAEEBC8MHOj0+Q0RDRko9Pk9QU1ZXWFlaW1xgPWHCDsUOxg7KDssOzQ7HDsgOyQ7BDsQOww7MDsEBbD1tzg7PDnN1dnd4eVdYfT1+0Q7SDoUBPYYB1Q7WDtcO0w7UDooB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QcgLahBMIAFByAtqEKsBEKwBQdYAIAIQAUHXABCqASECEKUBQdkLIAFByAtqEEwgAUHIC2oQrwEQsAFB2AAgAhABEDQQNSECEDUhAxCyARCzARC0ARA1EDlB2QAQOyACEDsgA0HfCxA8QdoAEABB2wAQtwEgAUEANgLMCyABQdwANgLICyABIAEpA8gLNwPoBkHqCyABQegGahC5ASABQQA2AswLIAFB3QA2AsgLIAEgASkDyAs3A+AGQe8LIAFB4AZqELsBIAFBADYCzAsgAUHeADYCyAsgASABKQPICzcD2AZB+QsgAUHYBmoQvQEQsgEhAhBxIQMQciEEIAFBADYCzAsgAUHfADYCyAsgASABKQPICzcD0AYgAUHQBmoQVCEFEHEhBhB0IQcgAUEANgLECyABQeAANgLACyABIAEpA8ALNwPIBiACQf8LIAMgBEHhACAFIAYgB0HiACABQcgGahBUEAIQsgEhAhBxIQMQciEEIAFBADYCzAsgAUHjADYCyAsgASABKQPICzcDwAYgAUHABmoQVCEFEHEhBhB0IQcgAUEANgLECyABQeQANgLACyABIAEpA8ALNwO4BiACQYUMIAMgBEHhACAFIAYgB0HiACABQbgGahBUEAIQsgEhAhBxIQMQciEEIAFBADYCzAsgAUHeADYCyAsgASABKQPICzcDsAYgAUGwBmoQVCEFEHEhBhB0IQcgAUEANgLECyABQeUANgLACyABIAEpA8ALNwOoBiACQZUMIAMgBEHhACAFIAYgB0HiACABQagGahBUEAIQNBA1IQIQNSEDEMMBEMQBEMUBEDUQOUHmABA7IAIQOyADQZkMEDxB5wAQAEHoABDJASABQQA2AswLIAFB6QA2AsgLIAEgASkDyAs3A6AGQaQMIAFBoAZqEMsBIAFBADYC9AogAUHqADYC8AogASABKQPwCjcDmAYgAUH4CmogAUGYBmoQZCABKAL4CiECIAEgASgC/Ao2AswLIAEgAjYCyAsgASABKQPICzcDkAZBrgwgAUGQBmoQzAEgAUEANgLkCiABQesANgLgCiABIAEpA+AKNwOIBiABQegKaiABQYgGahBkIAEoAugKIQIgASABKALsCjYCzAsgASACNgLICyABIAEpA8gLNwOABkGuDCABQYAGahDNASABQQA2AswLIAFB7AA2AsgLIAEgASkDyAs3A/gFQbgMIAFB+AVqEM4BIAFBADYCzAsgAUHtADYCyAsgASABKQPICzcD8AVBzQwgAUHwBWoQzwEgAUEANgLUCiABQe4ANgLQCiABIAEpA9AKNwPoBSABQdgKaiABQegFahBkIAEoAtgKIQIgASABKALcCjYCzAsgASACNgLICyABIAEpA8gLNwPgBUHVDCABQeAFahDQASABQQA2AsQKIAFB7wA2AsAKIAEgASkDwAo3A9gFIAFByApqIAFB2AVqEGQgASgCyAohAiABIAEoAswKNgLMCyABIAI2AsgLIAEgASkDyAs3A9AFQdUMIAFB0AVqENEBIAFBADYCzAsgAUHwADYCyAsgASABKQPICzcDyAVB3gwgAUHIBWoQ0QEgAUEANgK0CiABQfEANgKwCiABIAEpA7AKNwPABSABQbgKaiABQcAFahBkIAEoArgKIQIgASABKAK8CjYCzAsgASACNgLICyABIAEpA8gLNwO4BUGlCyABQbgFahDQASABQQA2AqQKIAFB8gA2AqAKIAEgASkDoAo3A7AFIAFBqApqIAFBsAVqEGQgASgCqAohAiABIAEoAqwKNgLMCyABIAI2AsgLIAEgASkDyAs3A6gFQaULIAFBqAVqENEBIAFBADYClAogAUHzADYCkAogASABKQOQCjcDoAUgAUGYCmogAUGgBWoQZCABKAKYCiECIAEgASgCnAo2AswLIAEgAjYCyAsgASABKQPICzcDmAVBpQsgAUGYBWoQ0gEgAUEANgLMCyABQfQANgLICyABIAEpA8gLNwOQBUHnDCABQZAFahDSASABQQA2AswLIAFB9QA2AsgLIAEgASkDyAs3A4gFQZMKIAFBiAVqENMBIAFBADYCzAsgAUH2ADYCyAsgASABKQPICzcDgAVB7QwgAUGABWoQ0wEgAUEANgLMCyABQfcANgLICyABIAEpA8gLNwP4BEHzDCABQfgEahDVASABQQA2AswLIAFB+AA2AsgLIAEgASkDyAs3A/AEQf0MIAFB8ARqENYBIAFBADYCzAsgAUH5ADYCyAsgASABKQPICzcD6ARBhg0gAUHoBGoQ1wEgAUEANgLMCyABQfoANgLICyABIAEpA8gLNwPgBEGLDSABQeAEahDPASABQQA2AswLIAFB+wA2AsgLIAEgASkDyAs3A9gEQZANIAFB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ACABEKoBEOUFGiAAEOYFGiAACz0BAX8jAEEQayIBJAAgASAAEOcFEOgFNgIMIAEQ6QU2AgggAUEMaiABQQhqEOoFKAIAIQAgAUEQaiQAIAALCwAgACABQQAQ6wULCgAgAEEIahDMBQszACAAIAAQsgQgABCyBCAAEMcFQQN0aiAAELIEIAAQxwVBA3RqIAAQsgQgAUEDdGoQyAULBAAgAAsOACAAIAEgAhCqARD0BQsLACAAIAEgAhD2BQsRACABEKoBGiAAQQA2AgAgAAsKACAAEKoBGiAACwoAIABBCGoQzAULBwAgABDtBQsFABDuBQsJACAAIAEQ7AULHgAgABDwBSABSQRAQcgWEPEFAAsgAUEDdEEIEPIFCykBAn8jAEEQayICJAAgAkEIaiABIAAQ7wUhAyACQRBqJAAgASAAIAMbCwcAIAAQ8AULCABB/////wcLDQAgASgCACACKAIASQsIAEH/////AQscAQF/QQgQByIBIAAQ8wUaIAFBwO8BQa8EEAgACwcAIAAQ+BgLFQAgACABEP0YGiAAQaDvATYCACAACw4AIAAgASACEKoBEPUFCw8AIAEgAhCqASkDADcDAAsOACABIAJBA3RBCBD3BQsLACAAIAEgAhD4BQsJACAAIAEQ+QULBwAgABD6BQsHACAAEPoYCwcAIAAoAgQLEAAgACgCACAAKAIEQQN0ags8AQJ/IwBBEGsiBCQAIAAQyQUhBSAEQQhqIAAgAxDiBSEDIAUgASACIABBBGoQ/gUgAxDFBSAEQRBqJAALKQAgAiABayICQQFOBEAgAygCACABIAIQrhoaIAMgAygCACACajYCAAsLKQECfyMAQRBrIgIkACACQQhqIAAgARCBBiEDIAJBEGokACABIAAgAxsLKQECfyMAQRBrIgIkACACQQhqIAEgABCBBiEDIAJBEGokACABIAAgAxsLDQAgASsDACACKwMAYwsjACMAQRBrIgAkACAAQQhqIAEQhAYoAgAhASAAQRBqJAAgAQsNACAAEKIEIAEQogRGCwsAIAAgATYCACAACwcAIAAQxQULPQEBfyMAQRBrIgIkACAAEKoBGiAAQgA3AgAgAkEANgIMIABBCGogAkEMaiABEKoBEIcGGiACQRBqJAAgAAsaACAAIAEQqgEQ5QUaIAAgAhCqARCIBhogAAsKACABEKoB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QRBqJAALBQBB8BwLBQAQ/gYLBQBBiB0LBQAQgAcLBQBBkB0LOwEBfyMAQRBrIgIkACACIAAQqgE2AgwgAkEMaiABEKoBEKoBEL4BEIIHIAJBDGoQxQUgAkEQaiQAIAALGQAgACgCACABOQMAIAAgACgCAEEIajYCAAsGAEG89AELBQAQhgcLSAEBfyMAQRBrIgQkACAAKAIAIQAgARCqASEBIAIQqgEhAiAEIAMQ9wY5AwggASACIARBCGogABEFABCqASECIARBEGokACACCwUAQaAdCwoAIABBCGoQzAULCgAgAEEIahDMBQsOACAAIAEgAhCqARCPBwthAQJ/IwBBIGsiAyQAIAAQiAciAiADQQhqIAAgABDyA0EBahCQByAAEPIDIAIQkQciAigCCBCqASABEKoBEIkHIAIgAigCCEEBajYCCCAAIAIQkgcgAhCTBxogA0EgaiQAC28BAn8jAEEgayIEJAACQCAAEIcHKAIAIAAoAgRrIAFPBEAgACABIAIQrAcMAQsgABCIByEDIARBCGogACAAEPIDIAFqEJAHIAAQ8gMgAxCRByIDIAEgAhCtByAAIAMQkgcgAxCTBxoLIARBIGokAAsgAQF/IAAgARDNBSAAEPIDIQIgACABEK4HIAAgAhCvBwsKACAAKAIAIAFqCzQBAX8jAEEQayICJAAgAkEIaiABEKoBEMYHIQEgABDHByABEMwFEAw2AgAgAkEQaiQAIAALDgAgACABIAIQqgEQlAcLYgEBfyMAQRBrIgIkACACIAE2AgwgABCVByEBIAIoAgwgAU0EQCAAEJYHIgAgAUEBdkkEQCACIABBAXQ2AgggAkEIaiACQQxqEJsGKAIAIQELIAJBEGokACABDwsgABCcGQALaQECfyMAQRBrIgUkAEEAIQQgBUEANgIMIABBDGogBUEMaiADEJcHGiABBEAgABCYByABEJkHIQQLIAAgBDYCACAAIAIgBGoiAjYCCCAAIAI2AgQgABCaByABIARqNgIAIAVBEGokACAAC1wBAX8gABCbByAAEIgHIAAoAgAgACgCBCABQQRqIgIQoQYgACACEKIGIABBBGogAUEIahCiBiAAEIcHIAEQmgcQogYgASABKAIENgIAIAAgABDyAxCcByAAEMUFCyMAIAAQnQcgACgCAARAIAAQmAcgACgCACAAEJ4H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EPgHCwUAQfAhCzgBAX8jAEEQayIBJAAgABCqARogAEIANwIAIAFBADYCDCAAQQhqIAFBDGoQ+gcaIAFBEGokACAACxUAIAAgARCqARDlBRogABDmBRogAAsFABD8BwsFAEH0IQsFABD+BwsFAEGAIgsFABCACAsFAEGQIgsFABCCCAsFAEGYIgs7AQF/IwBBEGsiAiQAIAIgABCqATYCDCACQQxqIAEQqgEQqgEQhQgQ2AYgAkEMahDFBSACQRBqJAAgAAsFABCGCAsHACAALQAACwYAQdDzAQsFABCICAsFAEGwIgsKACAAQQhqEMwFCw4AIAAgASACEKoBEI8IC2EBAn8jAEEgayIDJAAgABDUBSICIANBCGogACAAENADQQFqEJAIIAAQ0AMgAhCRCCICKAIIEKoBIAEQqgEQigggAiACKAIIQQRqNgIIIAAgAhCSCCACEJMIGiADQSBqJAALcgECfyMAQSBrIgQkAAJAIAAQiQgoAgAgACgCBGtBAnUgAU8EQCAAIAEgAhCiCAwBCyAAENQFIQMgBEEIaiAAIAAQ0AMgAWoQkAggABDQAyADEJEIIgMgASACEKMIIAAgAxCSCCADEJMIGgsgBEEgaiQACyABAX8gACABEM0FIAAQ0AMhAiAAIAEQ0gUgACACENEFCzQBAX8jAEEQayICJAAgAkEIaiABEKoBELwIIQEgABC9CCABEMwFEAw2AgAgAkEQaiQAIAALDgAgACABIAIQqgEQmAYLYgEBfyMAQRBrIgIkACACIAE2AgwgABCUCCEBIAIoAgwgAU0EQCAAENMFIgAgAUEBdkkEQCACIABBAXQ2AgggAkEIaiACQQxqEJsGKAIAIQELIAJBEGokACABDwsgABCcGQALbwECfyMAQRBrIgUkAEEAIQQgBUEANgIMIABBDGogBUEMaiADEJUIGiABBEAgABCWCCABEJcIIQQLIAAgBDYCACAAIAQgAkECdGoiAjYCCCAAIAI2AgQgABCYCCAEIAFBAnRqNgIAIAVBEGokACAAC1wBAX8gABCZCCAAENQFIAAoAgAgACgCBCABQQRqIgIQoQYgACACEKIGIABBBGogAUEIahCiBiAAEIkIIAEQmAgQogYgASABKAIENgIAIAAgABDQAxCaCCAAEMUFCyMAIAAQmwggACgCAARAIAAQlgggACgCACAA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CBogAEEYahCqCBogAEEkahCqCBogAEEwahCqCBogAEHIAGoQjAwaIAALBQAQiwwLBgBBnMYACygAIABBCGoQqggaIABBFGoQqggaIABBIGoQqggaIABBLGoQqggaIAALBQAQkAwLBgBBtMYAC0gBAX8gARCqASAAKAIEIgVBAXVqIQEgACgCACEAIAVBAXEEQCABKAIAIABqKAIAIQALIAEgAhCqASADEKoBIAQQqgEgABEMAAsGAEGgxgALBQAQlAwLBgBB7MYAC0YBAX8gARCqASAAKAIEIgRBAXVqIQEgACgCACEAIARBAXEEQCABKAIAIABqKAIAIQALIAEgAhCyCCADEKoBIAARSQAQqgELBgBBwMYACwUAEJgMCwYAQfzGAAtbAgJ/AX0jAEEQayICJAAgARCqASAAKAIEIgNBAXVqIQEgACgCACEAIAIgASADQQFxBH8gASgCACAAaigCAAUgAAsRHQA4AgwgAkEMahC+CCEEIAJBEGokACAECwYAQfTGAAsFABCcDAs7AQF/IAEQqgEgACgCBCICQQF1aiEBIAAoAgAhACABIAJBAXEEfyABKAIAIABqKAIABSAACxEAABCbDAsMAEEMEPgYIAAQnQwLBgBBgMcAC0sBAn8jAEEQayICJAAgARCdCBCFBiAAIAJBCGoQngwaIAEQ0AMiAwRAIAAgAxCfDCAAIAEoAgAgASgCBCADEKAMCyACQRBqJAAgAAs9AQF/IwBBEGsiAiQAIAAQqgEaIABCADcCACACQQA2AgwgAEEIaiACQQxqIAEQqgEQoQwaIAJBEGokACAAC0QBAX8gABCUCCABSQRAIAAQnBkACyAAIAAQ1AUgARCXCCICNgIAIAAgAjYCBCAAEIkIIAIgAUECdGo2AgAgAEEAEJoICzwBAn8jAEEQayIEJAAgABDUBSEFIARBCGogACADEOIFIQMgBSABIAIgAEEEahD+BSADEMUFIARBEGokAAsaACAAIAEQqgEQ5QUaIAAgAhCqARCIBhogAAsFABCjDAsGAEGIxwALBgBB5MYACwYAQZzHAAslACAAQTxqEMAQGiAAQRhqEKUIGiAAQQxqEKUIGiAAEKUIGiAACwYAQZzHAAsGAEGwxwALBgBBzMcACyUAIAAQqggaIABBDGoQqggaIABBGGoQqggaIABBPGoQjAwaIAALBQAQ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QQAQ1REgACAMIAoQ0hEgAEEgIAEgCSAIQYDAAHMQ1REMAQsLQQAhDQsgB0HQAGokACANCxgAIAAtAABBIHFFBEAgASACIAAQvxEaCwtIAQN/QQAhASAAKAIALAAAEMkRBEADQCAAKAIAIgIsAAAhAyAAIAJBAWo2AgAgAyABQQpsakFQaiEBIAIsAAEQyRENAAsLIAELxgIAAkAgAUEUSw0AIAFBd2oiAUEJSw0AAkACQAJAAkACQAJAAkACQAJAAkAgAUEBaw4JAQIDBAUGBwgJAAsgAiACKAIAIgFBBGo2AgAgACABKAIANgIADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABMgEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMwEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMAAANwMADwsgAiACKAIAIgFBBGo2AgAgACABMQAANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgACACIAMRAgALC3sBAX8jAEGAAmsiBSQAAkAgAiADTA0AIARBgMAEcQ0AIAUgASACIANrIgRBgAIgBEGAAkkiARsQrxoaIAAgBSABBH8gBAUgAiADayECA0AgACAFQYACENIRIARBgH5qIgRB/wFLDQALIAJB/wFxCxDSEQsgBUGAAmokAAstACAAUEUEQANAIAFBf2oiASAAp0EHcUEwcjoAACAAQgOIIgBCAFINAAsLIAELNQAgAFBFBEADQCABQX9qIgEgAKdBD3FB0PMAai0AACACcjoAACAAQgSIIgBCAFINAAsLIAELgwECA38BfgJAIABCgICAgBBUBEAgACEFDAELA0AgAUF/aiIBIAAgAEIKgCIFQgp+fadBMHI6AAAgAEL/////nwFWIQIgBSEAIAINAAsLIAWnIgIEQANAIAFBf2oiASACIAJBCm4iA0EKbGtBMHI6AAAgAkEJSyEEIAMhAiAEDQALCyABCxEAIAAgASACQeoEQesEENARC7MXAxB/An4BfCMAQbAEayIKJAAgCkEANgIsAn8gARDcESIWQn9XBEAgAZoiARDc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QQFHDQACQCAHDQAgA0EASg0AIAFEAAAAAAAAAABhDQELIAZBLjoAASAGQQJqIQgLIAFEAAAAAAAAAABiDQALIABBICACIA8CfwJAIANFDQAgCCAKa0FuaiADTg0AIAMgEGogDWtBAmoMAQsgECAKQRBqayANayAIagsiBmoiDCAEENURIAAgCyAPENIRIABBMCACIAwgBEGAgARzENURIAAgCkEQaiAIIApBEGprIggQ0hEgAEEwIAYgCCAQIA1rIglqa0EAQQAQ1REgACANIAkQ0hEgAEEgIAIgDCAEQYDAAHMQ1RELIApBsARqJAAgAiAMIAwgAkgbCykAIAEgASgCAEEPakFwcSIBQRBqNgIAIAAgASkDACABKQMIEPAROQMACwUAIAC9Cw8AIAAgASACQQBBABDQEQu6AQECfyMAQaABayIEJAAgBEEIakGI9ABBkAEQrhoaAkACQCABQX9qQf////8HTwRAIAENAUEBIQEgBEGfAWohAAsgBCAANgI0IAQgADYCHCAEQX4gAGsiBSABIAEgBUsbIgE2AjggBCAAIAFqIgA2AiQgBCAANgIYIARBCGogAiADENkRIQAgAUUNASAEKAIcIgEgASAEKAIYRmtBADoAAAwBCxCtEUE9NgIAQX8hAAsgBEGgAWokACAACzQBAX8gACgCFCIDIAEgAiAAKAIQIANrIgMgAyACSxsiAxCuGhogACAAKAIUIANqNgIUIAILywQBBX8jAEHQAWsiBCQAIARCATcDCAJAIAEgAmwiB0UNACAEIAI2AhAgBCACNgIUQQAgAmshCCACIgEhBkECIQUDQCAEQRBqIAVBAnRqIAIgBmogASIGaiIBNgIAIAVBAWohBSABIAdJDQALAkAgACAHaiAIaiIGIABNBEBBASEFQQEhAQwBC0EBIQVBASEBA0ACfyAFQQNxQQNGBEAgACACIAMgASAEQRBqEOERIARBCGpBAhDiESABQQJqDAELAkAgBEEQaiABQX9qIgVBAnRqKAIAIAYgAGtPBEAgACACIAMgBEEIaiABQQAgBEEQahDjEQwBCyAAIAIgAyABIARBEGoQ4RELIAFBAUYEQCAEQQhqQQEQ5BFBAAwBCyAEQQhqIAUQ5BFBAQshASAEIAQoAghBAXIiBTYCCCAAIAJqIgAgBkkNAAsLIAAgAiADIARBCGogAUEA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A0AgACICLQAAIgMEQCACQQFqIQAgAyABQf8BcUcNAQsLIAIPCyAAEOwRIABqDwsgAAuXAQEDfyAAIQECQAJAIABBA3FFDQAgAC0AAEUEQCAAIQEMAgsgACEBA0AgAUEBaiIBQQNxRQ0BIAEtAAANAAsMAQsDQCABIgJBBGohASACKAIAIgNBf3MgA0H//ft3anFBgIGChHhxRQ0ACyADQf8BcUUEQCACIQEMAQsDQCACLQABIQMgAkEBaiIBIQIgAw0ACwsgASAAawsVACAARQRAQQAPCxCtESAANgIAQX8LUAEBfgJAIANBwABxBEAgAiADQUBqrYghAUIAIQIMAQsgA0UNACACQcAAIANrrYYgASADrSIEiIQhASACIASIIQILIAAgATcDACAAIAI3AwgLUAEBfgJAIANBwABxBEAgASADQUBqrYYhAkIAIQEMAQsgA0UNACACIAOtIgSGIAFBwAAgA2utiIQhAiABIASGIQELIAAgATcDACAAIAI3AwgL2QMCAn8CfiMAQSBrIgIkAAJAIAFC////////////AIMiBEKAgICAgIDA/0N8IARCgICAgICAwIC8f3xUBEAgAUIEhiAAQjyIhCEEIABC//////////8PgyIAQoGAgICAgICACFoEQCAEQoGAgICAgICAwAB8IQUMAgsgBEKAgICAgICAgEB9IQUgAEKAgICAgICAgAiFQgBSDQEgBUIBgyAFfCEFDAELIABQIARCgICAgICAwP//AFQgBEKAgICAgIDA//8AURtFBEAgAUIEhiAAQjyIhEL/////////A4NCgICAgICAgPz/AIQhBQwBC0KAgICAgICA+P8AIQUgBEL///////+//8MAVg0AQgAhBSAEQjCIpyIDQZH3AEkNACACIAAgAUL///////8/g0KAgICAgIDAAIQiBEGB+AAgA2sQ7hEgAkEQaiAAIAQgA0H/iH9qEO8RIAIpAwhCBIYgAikDACIEQjyIhCEFIAIpAxAgAikDGIRCAFKtIARC//////////8Pg4QiBEKBgICAgICAgAhaBEAgBUIBfCEFDAELIARCgICAgICAgIAIhUIAUg0AIAVCAYMgBXwhBQsgAkEgaiQAIAUgAUKAgICAgICAgIB/g4S/C5IBAQN8RAAAAAAAAPA/IAAgAKIiAkQAAAAAAADgP6IiA6EiBEQA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Rw0CIAIoAgwhAyAEQQFGDQALCyABENQPDAELEIkGCyEAIAJBIGokACAACyYAIAAgACgCACgCGBEAABogACABEPMSIgE2AiQgACABELoPOgAsC10BAX8CQCAALQAsRQRAQQAhAwNAIAMgAk4NAiAAIAEoAgAQqgEgACgCACgCNBEDABCJBkYNAiABQQRqIQEgA0EBaiEDDAAACwALIAFBBCACIAAoAiAQwBEhAwsgAwuCAgEFfyMAQSBrIgIkAAJ/AkACQCABEIkGEJYFDQAgAiABEKoBNgIUIAAtACwEQCACQRRqQQRBASAAKAIgEMARQQFGDQEMAgsgAiACQRhqNgIQIAJBIGohBSACQRhqIQYgAkEUaiEDA0AgACgCJCAAKAIoIAMgBiACQQxqIAJBGGogBSACQRBqENoPIQQgAigCDCADRg0CIARBA0YEQCADQQFBASAAKAIgEMARQQFHDQMMAgsgBEEBSw0CIAJBGGpBASACKAIQIAJBGGprIgMgACgCIBDAESADRw0CIAIoAgwhAyAEQQFGDQALCyABENQPDAELEIkGCyEAIAJBIGokACAACwUAEOQSCxAAIABBIEYgAEF3akEFSXILRgICfwF+IAAgATcDcCAAIAAoAggiAiAAKAIEIgNrrCIENwN4AkAgAVANACAEIAFXDQAgACADIAGnajYCaA8LIAAgAjYCaAvCAQIDfwF+AkACQCAAKQNwIgRQRQRAIAApA3ggBFkNAQsgABCrESIDQX9KDQELIABBADYCaEF/DwsgACgCCCEBAkACQCAAKQNwIgRQDQAgBCAAKQN4Qn+FfCIEIAEgACgCBCICa6xZDQAgACACIASnajYCaAwBCyAAIAE2AmgLAkAgAUUEQCAAKAIEIQIMAQsgACAAKQN4IAEgACgCBCICa0EBaqx8NwN4CyACQX9qIgAtAAAgA0cEQCAAIAM6AAALIAMLdQEBfiAAIAEgBH4gAiADfnwgA0IgiCIEIAFCIIgiAn58IANC/////w+DIgMgAUL/////D4MiAX4iBUIgiCACIAN+fCIDQiCIfCABIAR+IANC/////w+DfCIDQiCIfDcDCCAAIAVC/////w+DIANCIIaENwMAC/QKAgV/BH4jAEEQayIHJAACQAJAAkACQAJAAkAgAUEkTQRAA0ACfyAAKAIEIgQgACgCaEkEQCAA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gIDAP3wMAQsgAkGAgID8B08EQEIAIQYgBK1CGYZCgICAgICAwP//AIQMAQsgAkUEQEIAIQZCAAwBCyADIAKtQgAgAmciAkHRAGoQ7xEgAykDACEGIAMpAwhCgICAgICAwACFQYn/ACACa61CMIaECyEHIAAgBjcDACAAIAcgBa1CIIaENwMIIANBEGokAAuiCwIFfw9+IwBB4ABrIgUkACAEQi+GIANCEYiEIQ4gAkIghiABQiCIhCELIARC////////P4MiDEIPhiADQjGIhCEQIAIgBIVCgICAgICAgICAf4MhCiAMQhGIIREgAkL///////8/gyINQiCIIRIgBEIwiKdB//8BcSEGAkACfyACQjCIp0H//wFxIghBf2pB/f8BTQRAQQAgBkF/akH+/wFJDQEaCyABUCACQv///////////wCDIg9CgICAgICAwP//AFQgD0KAgICAgIDA//8AURtFBEAgAkKAgICAgIAghCEKDAILIANQIARC////////////AIMiAkKAgICAgIDA//8AVCACQoCAgICAgMD//wBRG0UEQCAEQoCAgICAgCCEIQogAyEBDAILIAEgD0KAgICAgIDA//8AhYRQBEAgAiADhFAEQEKAgICAgIDg//8AIQpCACEBDAMLIApCgICAgICAwP//AIQhCkIAIQEMAgsgAyACQoCAgICAgMD//wCFhFAEQCABIA+EIQJCACEBIAJQBEBCgICAgICA4P//ACEKDAMLIApCgICAgICAwP//AIQhCgwCCyABIA+EUARAQgAhAQwCCyACIAOEUARAQgAhAQwCC0EAIQcgD0L///////8/WARAIAVB0ABqIAEgDSABIA0gDVAiBxt5IAdBBnStfKciB0FxahDvESAFKQNYIg1CIIYgBSkDUCIBQiCIhCELIA1CIIghEkEQIAdrIQcLIAcgAkL///////8/Vg0AGiAFQUBrIAMgDCADIAwgDFAiCRt5IAlBBnStfKciCUFxahDvESAFKQNIIgJCD4YgBSkDQCIDQjGIhCEQIAJCL4YgA0IRiIQhDiACQhGIIREgByAJa0EQagshByAOQv////8PgyICIAFC/////w+DIgR+IhMgA0IPhkKAgP7/D4MiASALQv////8PgyIDfnwiDkIghiIMIAEgBH58IgsgDFStIAIgA34iFSABIA1C/////w+DIgx+fCIPIBBC/////w+DIg0gBH58IhAgDiATVK1CIIYgDkIgiIR8IhMgAiAMfiIWIAEgEkKAgASEIg5+fCISIAMgDX58IhQgEUL/////B4NCgICAgAiEIgEgBH58IhFCIIZ8Ihd8IQQgBiAIaiAHakGBgH9qIQYCQCAMIA1+IhggAiAOfnwiAiAYVK0gAiABIAN+fCIDIAJUrXwgAyAPIBVUrSAQIA9UrXx8IgIgA1StfCABIA5+fCABIAx+IgMgDSAOfnwiASADVK1CIIYgAUIgiIR8IAIgAUIghnwiASACVK18IAEgESAUVK0gEiAWVK0gFCASVK18fEIghiARQiCIhHwiAyABVK18IAMgEyAQVK0gFyATVK18fCICIANUrXwiAUKAgICAgIDAAINQRQRAIAZBAWohBgwBCyALQj+IIQMgAUIBhiACQj+IhCEBIAJCAYYgBEI/iIQhAiALQgGGIQsgAyAEQgGGhCEECyAGQf//AU4EQCAKQoCAgICAgMD//wCEIQpCACEBDAELAn4gBkEATARAQQEgBmsiCEH/AE0EQCAFQRBqIAsgBCAIEO4RIAVBIGogAiABIAZB/wBqIgYQ7xEgBUEwaiALIAQgBhDvESAFIAIgASAIEO4RIAUpAzAgBSkDOIRCAFKtIAUpAyAgBSkDEISEIQsgBSkDKCAFKQMYhCEEIAUpAwAhAiAFKQMIDAILQgAhAQwCCyABQv///////z+DIAatQjCGhAsgCoQhCiALUCAEQn9VIARCgICAgICAgICAf1EbRQRAIAogAkIBfCIBIAJUrXwhCgwBCyALIARCgICAgICAgICAf4WEUEUEQCACIQEMAQsgCiACIAJCAYN8IgEgAlStfCEKCyAAIAE3AwAgACAKNwMIIAVB4ABqJAALgwECAn8BfiMAQRBrIgMkACAAAn4gAUUEQEIAIQRCAAwBCyADIAEgAUEfdSICaiACcyICrUIAIAJnIgJB0QBqEO8RIAMpAwhCgICAgICAwACFQZ6AASACa61CMIZ8IAFBgICAgHhxrUIghoQhBCADKQMACzcDACAAIAQ3AwggA0EQaiQAC8gJAgR/BH4jAEHwAGsiBSQAIARC////////////AIMhCgJAAkAgAUJ/fCIJQn9RIAJC////////////AIMiCyAJIAFUrXxCf3wiCUL///////+///8AViAJQv///////7///wBRG0UEQCADQn98IglCf1IgCiAJIANUrXxCf3wiCUL///////+///8AVCAJQv///////7///wBRGw0BCyABUCALQoCAgICAgMD//wBUIAtCgICAgICAwP//AFEbRQRAIAJCgICAgICAIIQhBCABIQMMAgsgA1AgCkKAgICAgIDA//8AVCAKQoCAgICAgMD//wBRG0UEQCAEQoCAgICAgCCEIQQMAgsgASALQoCAgICAgMD//wCFhFAEQEKAgICAgIDg//8AIAIgASADhSACIASFQoCAgICAgICAgH+FhFAiBhshBEIAIAEgBhshAwwCCyADIApCgICAgICAwP//AIWEUA0BIAEgC4RQBEAgAyAKhEIAUg0CIAEgA4MhAyACIASDIQQMAgsgAyAKhFBFDQAgASEDIAIhBAwBCyADIAEgAyABViAKIAtWIAogC1EbIgcbIQogBCACIAcbIgtC////////P4MhCSACIAQgBxsiAkIwiKdB//8BcSEIIAtCMIinQf//AXEiBkUEQCAFQeAAaiAKIAkgCiAJIAlQIgYbeSAGQQZ0rXynIgZBcWoQ7xEgBSkDaCEJIAUpA2AhCkEQIAZrIQYLIAEgAyAHGyEDIAJC////////P4MhASAIBH4gAQUgBUHQAGogAyABIAMgASABUCIHG3kgB0EGdK18pyIHQXFqEO8RQRAgB2shCCAFKQNQIQMgBSkDWAtCA4YgA0I9iIRCgICAgICAgASEIQQgCUIDhiAKQj2IhCEBIAIgC4UhCQJ+IANCA4YiAyAGIAhrIgdFDQAaIAdB/wBLBEBCACEEQgEMAQsgBUFAayADIARBgAEgB2sQ7xEgBUEwaiADIAQgBxDuESAFKQM4IQQgBSkDMCAFKQNAIAUpA0iEQgBSrYQLIQMgAUKAgICAgICABIQhDCAKQgOGIQICQCAJQn9XBEAgAiADfSIBIAwgBH0gAiADVK19IgOEUARAQgAhA0IAIQQMAwsgA0L/////////A1YNASAFQSBqIAEgAyABIAMgA1AiBxt5IAdBBnStfKdBdGoiBxDvESAGIAdrIQYgBSkDKCEDIAUpAyAhAQwBCyACIAN8IgEgA1StIAQgDHx8IgNCgICAgICAgAiDUA0AIAFCAYMgA0I/hiABQgGIhIQhASAGQQFqIQYgA0IBiCEDCyALQoCAgICAgICAgH+DIQQgBkH//wFOBEAgBEKAgICAgIDA//8AhCEEQgAhAwwBC0EAIQcCQCAGQQBKBEAgBiEHDAELIAVBEGogASADIAZB/wBqEO8RIAUgASADQQEgBmsQ7hEgBSkDACAFKQMQIAUpAxiEQgBSrYQhASAFKQMIIQMLIANCA4hC////////P4MgBIQgB61CMIaEIANCPYYgAUIDiIQiBCABp0EHcSIGQQRLrXwiAyAEVK18IANCAYNCACAGQQRGGyIBIAN8IgMgAVStfCEECyAAIAM3AwAgACAENwMIIAVB8ABqJAALhQICAn8EfiMAQRBrIgIkACABvSIFQoCAgICAgICAgH+DIQcCfiAFQv///////////wCDIgRCgICAgICAgHh8Qv/////////v/wBYBEAgBEI8hiEGIARCBIhCgICAgICAgIA8fAwBCyAEQoCAgICAgID4/wBaBEAgBUI8hiEGIAVCBIhCgICAgICAwP//AIQMAQsgBFAEQEIAIQZCAAwBCyACIARCACAEQoCAgIAQWgR/IARCIIinZwUgBadnQSBqCyIDQTFqEO8RIAIpAwAhBiACKQMIQoCAgICAgMAAhUGM+AAgA2utQjCGhAshBCAAIAY3AwAgACAEIAeENwMIIAJBEGokAAvbAQIBfwJ+QQEhBAJAIABCAFIgAUL///////////8AgyIFQoCAgICAgMD//wBWIAVCgICAgICAwP//AFEbDQAgAkIAUiADQv///////////wCDIgZCgICAgICAwP//AFYgBkKAgICAgIDA//8AURsNACAAIAKEIAUgBoSEUARAQQAPCyABIAODQgBZBEBBfyEEIAAgAlQgASADUyABIANRGw0BIAAgAoUgASADhYRCAFIPC0F/IQQgACACViABIANVIAEgA1EbDQAgACAChSABIAOFhEIAUiEECyAEC9MBAgF/An5BfyEEAkAgAEIAUiABQv///////////wCDIgVCgICAgICAwP//AFYgBUKAgICAgIDA//8AURsNACACQgBSIANC////////////AIMiBkKAgICAgIDA//8AViAGQoCAgICAgMD//wBRGw0AIAAgAoQgBSAGhIRQBEBBAA8LIAEgA4NCAFkEQCAAIAJUIAEgA1MgASADURsNASAAIAKFIAEgA4WEQgBSDwsgACACViABIANVIAEgA1EbDQAgACAChSABIAOFhEIAUiEECyAECzUAIAAgATcDACAAIAJC////////P4MgBEIwiKdBgIACcSACQjCIp0H//wFxcq1CMIaENwMIC2sCAX8BfiMAQRBrIgIkACAAAn4gAUUEQEIAIQNCAAwBCyACIAGtQgBB8AAgAWdBH3MiAWsQ7xEgAikDCEKAgICAgIDAAIUgAUH//wBqrUIwhnwhAyACKQMACzcDACAAIAM3AwggAkEQaiQAC0UBAX8jAEEQayIFJAAgBSABIAIgAyAEQoCAgICAgICAgH+FEJQTIAUpAwAhASAAIAUpAwg3AwggACABNwMAIAVBEGokAAvEAgEBfyMAQdAAayIEJAACQCADQYCAAU4EQCAEQSBqIAEgAkIAQoCAgICAgID//wAQkhMgBCkDKCECIAQpAyAhASADQf//AUgEQCADQYGAf2ohAwwCCyAEQRBqIAEgAkIAQoCAgICAgID//wAQkhMgA0H9/wIgA0H9/wJIG0GCgH5qIQMgBCkDGCECIAQpAxAhAQwBCyADQYGAf0oNACAEQUBrIAEgAkIAQoCAgICAgMAAEJITIAQpA0ghAiAEKQNAIQEgA0GDgH5KBEAgA0H+/wBqIQMMAQsgBEEwaiABIAJCAEKAgICAgIDAABCSEyADQYaAfSADQYaAfUobQfz/AWohAyAEKQM4IQIgBCkDMCEBCyAEIAEgAkIAIANB//8Aaq1CMIYQkhMgACAEKQMINwMIIAAgBCkDADcDACAEQdAAaiQAC74RAgV/DH4jAEHAAWsiBSQAIARC////////P4MhEiACQv///////z+DIQ4gAiAEhUKAgICAgICAgIB/gyERIARCMIinQf//AXEhBwJAAkACQCACQjCIp0H//wFxIghBf2pB/f8BTQRAQQAhBiAHQX9qQf7/AUkNAQsgAVAgAkL///////////8AgyILQoCAgICAgMD//wBUIAtCgICAgICAwP//AFEbRQRAIAJCgICAgICAIIQhEQwCCyADUCAEQv///////////wCDIgJCgICAgICAwP//AFQgAkKAgICAgIDA//8AURtFBEAgBEKAgICAgIAghCERIAMhAQwCCyABIAtCgICAgICAwP//AIWEUARAIAMgAkKAgICAgIDA//8AhYRQBEBCACEBQoCAgICAgOD//wAhEQwDCyARQoCAgICAgMD//wCEIRFCACEBDAILIAMgAkKAgICAgIDA//8AhYRQBEBCACEBDAILIAEgC4RQDQIgAiADhFAEQCARQoCAgICAgMD//wCEIRFCACEBDAILQQAhBiALQv///////z9YBEAgBUGwAWogASAOIAEgDiAOUCIGG3kgBkEGdK18pyIGQXFqEO8RQRAgBmshBiAFKQO4ASEOIAUpA7ABIQELIAJC////////P1YNACAFQaABaiADIBIgAyASIBJQIgkbeSAJQQZ0rXynIglBcWoQ7xEgBiAJakFwaiEGIAUpA6gBIRIgBSkDoAEhAwsgBUGQAWogEkKAgICAgIDAAIQiFEIPhiADQjGIhCICQgBChMn5zr/mvIL1ACACfSIEQgAQjRMgBUGAAWpCACAFKQOYAX1CACAEQgAQjRMgBUHwAGogBSkDiAFCAYYgBSkDgAFCP4iEIgRCACACQgAQjRMgBUHgAGogBEIAQgAgBSkDeH1CABCNEyAFQdAAaiAFKQNoQgGGIAUpA2BCP4iEIgRCACACQgAQjRMgBUFAayAEQgBCACAFKQNYfUIAEI0TIAVBMGogBSkDSEIBhiAFKQNAQj+IhCIEQgAgAkIAEI0TIAVBIGogBEIAQgAgBSkDOH1CABCNEyAFQRBqIAUpAyhCAYYgBSkDIEI/iIQiBEIAIAJCABCNEyAFIARCAEIAIAUpAxh9QgAQjRMgBiAIIAdraiEHAn5CACAFKQMIQgGGIAUpAwBCP4iEQn98IgtC/////w+DIgQgAkIgiCIMfiIQIAtCIIgiCyACQv////8PgyIKfnwiAkIghiINIAQgCn58IgogDVStIAsgDH4gAiAQVK1CIIYgAkIgiIR8fCAKIAQgA0IRiEL/////D4MiDH4iECALIANCD4ZCgID+/w+DIg1+fCICQiCGIg8gBCANfnwgD1StIAsgDH4gAiAQVK1CIIYgAkIgiIR8fHwiAiAKVK18IAJCAFKtfH0iCkL/////D4MiDCAEfiIQIAsgDH4iDSAEIApCIIgiD358IgpCIIZ8IgwgEFStIAsgD34gCiANVK1CIIYgCkIgiIR8fCAMQgAgAn0iAkIgiCIKIAR+IhAgAkL/////D4MiDSALfnwiAkIghiIPIAQgDX58IA9UrSAKIAt+IAIgEFStQiCGIAJCIIiEfHx8IgIgDFStfCACQn58IhAgAlStfEJ/fCIKQv////8PgyICIA5CAoYgAUI+iIRC/////w+DIgR+IgwgAUIeiEL/////D4MiCyAKQiCIIgp+fCINIAxUrSANIBBCIIgiDCAOQh6IQv//7/8Pg0KAgBCEIg5+fCIPIA1UrXwgCiAOfnwgAiAOfiITIAQgCn58Ig0gE1StQiCGIA1CIIiEfCAPIA1CIIZ8Ig0gD1StfCANIAsgDH4iEyAQQv////8PgyIQIAR+fCIPIBNUrSAPIAIgAUIChkL8////D4MiE358IhUgD1StfHwiDyANVK18IA8gCiATfiINIA4gEH58IgogBCAMfnwiBCACIAt+fCICQiCIIAIgBFStIAogDVStIAQgClStfHxCIIaEfCIKIA9UrXwgCiAVIAwgE34iBCALIBB+fCILQiCIIAsgBFStQiCGhHwiBCAVVK0gBCACQiCGfCAEVK18fCIEIApUrXwiAkL/////////AFgEQCABQjGGIARC/////w+DIgEgA0L/////D4MiC34iCkIAUq19QgAgCn0iECAEQiCIIgogC34iDSABIANCIIgiDH58Ig5CIIYiD1StfSACQv////8PgyALfiABIBJC/////w+DfnwgCiAMfnwgDiANVK1CIIYgDkIgiIR8IAQgFEIgiH4gAyACQiCIfnwgAiAMfnwgCiASfnxCIIZ8fSELIAdBf2ohByAQIA99DAELIARCIYghDCABQjCGIAJCP4YgBEIBiIQiBEL/////D4MiASADQv////8PgyILfiIKQgBSrX1CACAKfSIQIAEgA0IgiCIKfiINIAwgAkIfhoQiD0L/////D4MiDiALfnwiDEIghiITVK19IAogDn4gAkIBiCIOQv////8PgyALfnwgASASQv////8Pg358IAwgDVStQiCGIAxCIIiEfCAEIBRCIIh+IAMgAkIhiH58IAogDn58IA8gEn58QiCGfH0hCyAOIQIgECATfQshASAHQYCAAU4EQCARQoCAgICAgMD//wCEIRFCACEBDAELIAdB//8AaiEIIAdBgYB/TARAAkAgCA0AIAQgAUIBhiADViALQgGGIAFCP4iEIgEgFFYgASAUURutfCIBIARUrSACQv///////z+DfCIDQoCAgICAgMAAg1ANACADIBGEIREMAgtCACEBDAELIAQgAUIBhiADWiALQgGGIAFCP4iEIgEgFFogASAUURutfCIBIARUrSACQv///////z+DIAitQjCGhHwgEYQhEQsgACABNwMAIAAgETcDCCAFQcABaiQADwsgAEIANwMAIAAgEUKAgICAgIDg//8AIAIgA4RCAFIbNwMIIAVBwAFqJAALtAgCBn8CfiMAQTBrIgYkAEIAIQoCQCACQQJNBEAgAUEEaiEFIAJBAnQiAkGMnAFqKAIAIQggAkGAnAFqKAIAIQkDQAJ/IAEoAgQiAiABKAJoSQRAIAUgAkEBajYCACACLQAADAELIAEQjBMLIgIQihMNAAsCQCACQVVqIgRBAksEQEEBIQcMAQtBASEHIARBAWtFDQBBf0EBIAJBLUYbIQcgASgCBCICIAEoAmhJBEAgBSACQQFqNgIAIAItAAAhAgwBCyABEIwTIQILQQAhBAJAAkADQCAEQbybAWosAAAgAkEgckYEQAJAIARBBksNACABKAIEIgIgASgCaEkEQCAFIAJBAWo2AgAgAi0AACECDAELIAEQjBMhAgsgBEEBaiIEQQhHDQEMAgsLIARBA0cEQCAEQQhGDQEgA0UNAiAEQQRJDQIgBEEIRg0BCyABKAJoIgEEQCAFIAUoAgBBf2o2AgALIANFDQAgBEEESQ0AA0AgAQRAIAUgBSgCAEF/ajYCAAsgBEF/aiIEQQNLDQALCyAGIAeyQwAAgH+UEJETIAYpAwghCyAGKQMAIQoMAgsCQAJAAkAgBA0AQQAhBANAIARBxZsBaiwAACACQSByRw0BAkAgBEEBSw0AIAEoAgQiAiABKAJoSQRAIAUgAkEBajYCACACLQAAIQIMAQsgARCMEyECCyAEQQFqIgRBA0cNAAsMAQsCQAJAIARBA0sNACAEQQFrDgMAAAIBCyABKAJoBEAgBSAFKAIAQX9qNgIACxCtEUEcNgIADAILAkAgAkEwRw0AAn8gASgCBCIEIAEoAmhJBEAgBSAEQQFqNgIAIAQtAAAMAQsgARCMEwtBIHJB+ABGBEAgBkEQaiABIAkgCCAHIAMQnhMgBikDGCELIAYpAxAhCgwFCyABKAJoRQ0AIAUgBSgCAEF/ajYCAAsgBkEgaiABIAIgCSAIIAcgAxCfEyAGKQMoIQsgBikDICEKDAMLAkACfyABKAIEIgIgASgCaEkEQCAFIAJBAWo2AgAgAi0AAAwBCyABEIwTC0EoRgRAQQEhBAwBC0KAgICAgIDg//8AIQsgASgCaEUNAyAFIAUoAgBBf2o2AgAMAwsDQAJ/IAEoAgQiAiABKAJoSQRAIAUgAkEBajYCACACLQAADAELIAEQjBMLIgJBv39qIQcCQAJAIAJBUGpBCkkNACAHQRpJDQAgAkGff2ohByACQd8ARg0AIAdBGk8NAQsgBEEBaiEEDAELC0KAgICAgIDg//8AIQsgAkEpRg0CIAEoAmgiAgRAIAUgBSgCAEF/ajYCAAsgAwRAIARFDQMDQCAEQX9qIQQgAgRAIAUgBSgCAEF/ajYCAAsgBA0ACwwDCxCtEUEcNgIACyABQgAQixNCACEKC0IAIQsLIAAgCjcDACAAIAs3AwggBkEwaiQAC4wOAgh/B34jAEGwA2siBiQAAn8gASgCBCIHIAEoAmhJBEAgASAHQQFqNgIEIActAAAMAQsgARCMEwshB0EAIQlCACESQQAhCgJAAn8DQAJAIAdBMEcEQCAHQS5HDQQgASgCBCIHIAEoAmhPDQEgASAHQQFqNgIEIActAAAMAwsgASgCBCIHIAEoAmhJBEBBASEKIAEgB0EBajYCBCAHLQAAIQcMAgUgARCMEyEHQQEhCgwCCwALCyABEIwTCyEHQQEhCUIAIRIgB0EwRw0AA0AgEkJ/fCESAn8gASgCBCIHIAEoAmhJBEAgASAHQQFqNgIEIActAAAMAQsgARCMEwsiB0EwRg0AC0EBIQlBASEKC0KAgICAgIDA/z8hD0EAIQhCACEOQgAhEUIAIRNBACEMQgAhEANAAkAgB0EgciELAkACQCAHQVBqIg1BCkkNACAHQS5HQQAgC0Gff2pBBUsbDQIgB0EuRw0AIAkNAkEBIQkgECESDAELIAtBqX9qIA0gB0E5ShshBwJAIBBCB1cEQCAHIAhBBHRqIQgMAQsgEEIcVwRAIAZBIGogEyAPQgBCgICAgICAwP0/EJITIAZBMGogBxCTEyAGQRBqIAYpAzAgBikDOCAGKQMgIhMgBikDKCIPEJITIAYgBikDECAGKQMYIA4gERCUEyAGKQMIIREgBikDACEODAELIAZB0ABqIBMgD0IAQoCAgICAgID/PxCSEyAGQUBrIAYpA1AgBikDWCAOIBEQlBMgDEEBIAdFIAxBAEdyIgcbIQwgESAGKQNIIAcbIREgDiAGKQNAIAcbIQ4LIBBCAXwhEEEBIQoLIAEoAgQiByABKAJoSQRAIAEgB0EBajYCBCAHLQAAIQcMAgUgARCMEyEHDAILAAsLAn4CQAJAIApFBEAgASgCaEUEQCAFDQMMAgsgASABKAIEIgdBf2o2AgQgBUUNASABIAdBfmo2AgQgCUUNAiABIAdBfWo2AgQMAgsgEEIHVwRAIBAhDwNAIAhBBHQhCCAPQgdTIQsgD0IBfCEPIAsNAAsLAkAgB0EgckHwAEYEQCABIAUQoBMiD0KAgICAgICAgIB/Ug0BIAUEQEIAIQ8gASgCaEUNAiABIAEoAgRBf2o2AgQMAgtCACEOIAFCABCLE0IADAQLQgAhDyABKAJoRQ0AIAEgASgCBEF/ajYCBAsgCEUEQCAGQfAAaiAEt0QAAAAAAAAAAKIQlRMgBikDcCEOIAYpA3gMAwsgEiAQIAkbQgKGIA98QmB8IhBBACADa6xVBEAgBkGgAWogBBCTEyAGQZABaiAGKQOgASAGKQOoAUJ/Qv///////7///wAQkhMgBkGAAWogBikDkAEgBikDmAFCf0L///////+///8AEJITEK0RQcQANgIAIAYpA4ABIQ4gBikDiAEMAwsgECADQZ5+aqxZBEAgCEF/SgRAA0AgBkGgA2ogDiARQgBCgICAgICAwP+/fxCUEyAOIBFCAEKAgICAgICA/z8QlxMhByAGQZADaiAOIBEgDiAGKQOgAyAHQQBIIgEbIBEgBikDqAMgARsQlBMgEEJ/fCEQIAYpA5gDIREgBikDkAMhDiAIQQF0IAdBf0pyIghBf0oNAAsLAn4gECADrH1CIHwiD6ciB0EAIAdBAEobIAIgDyACrFMbIgdB8QBOBEAgBkGAA2ogBBCTEyAGKQOIAyEPIAYpA4ADIRNCACEUQgAMAQsgBkHQAmogBBCTEyAGQeACakQAAAAAAADwP0GQASAHaxCsGhCVEyAGQfACaiAGKQPgAiAGKQPoAiAGKQPQAiITIAYpA9gCIg8QmBMgBikD+AIhFCAGKQPwAgshEiAGQcACaiAIIAhBAXFFIA4gEUIAQgAQlhNBAEcgB0EgSHFxIgdqEJkTIAZBsAJqIBMgDyAGKQPAAiAGKQPIAhCSEyAGQaACaiATIA9CACAOIAcbQgAgESAHGxCSEyAGQZACaiAGKQOwAiAGKQO4AiASIBQQlBMgBkGAAmogBikDoAIgBikDqAIgBikDkAIgBikDmAIQlBMgBkHwAWogBikDgAIgBikDiAIgEiAUEJoTIAYpA/ABIg4gBikD+AEiEUIAQgAQlhNFBEAQrRFBxAA2AgALIAZB4AFqIA4gESAQpxCbEyAGKQPgASEOIAYpA+gBDAMLIAZB0AFqIAQQkxMgBkHAAWogBikD0AEgBikD2AFCAEKAgICAgIDAABCSEyAGQbABaiAGKQPAASAGKQPIAUIAQoCAgICAgMAAEJITEK0RQcQANgIAIAYpA7ABIQ4gBikDuAEMAgsgAUIAEIsTCyAGQeAAaiAEt0QAAAAAAAAAAKIQlRMgBikDYCEOIAYpA2gLIRAgACAONwMAIAAgEDcDCCAGQbADaiQAC7QcAwx/Bn4BfCMAQYDGAGsiByQAQQAhCkEAIAMgBGoiEWshEkIAIRNBACEJAkACfwNAAkAgAkEwRwRAIAJBLkcNBCABKAIEIgggASgCaE8NASABIAhBAWo2AgQgCC0AAAwDCyABKAIEIgggASgCaEkEQEEBIQkgASAIQQFqNgIEIAgtAAAhAgwCBSABEIwTIQJBASEJDAILAAsLIAEQjBMLIQJBASEKQgAhEyACQTBHDQADQCATQn98IRMCfyABKAIEIgggASgCaEkEQCABIAhBAWo2AgQgCC0AAAwBCyABEIwTCyICQTBGDQALQQEhCUEBIQoLQQAhDiAHQQA2AoAGIAJBUGohDCAAAn4CQAJAAkACQAJAAkAgAkEuRiILDQBCACEUIAxBCU0NAEEAIQhBACENDAELQgAhFEEAIQ1BACEIQQAhDgNAAkAgC0EBcQRAIApFBEAgFCETQQEhCgwCCyAJQQBHIQkMBAsgFEIBfCEUIAhB/A9MBEAgFKcgDiACQTBHGyEOIAdBgAZqIAhBAnRqIgkgDQR/IAIgCSgCAEEKbGpBUGoFIAwLNgIAQQEhCUEAIA1BAWoiAiACQQlGIgIbIQ0gAiAIaiEIDAELIAJBMEYNACAHIAcoAvBFQQFyNgLwRQsCfyABKAIEIgIgASgCaEkEQCABIAJBAWo2AgQgAi0AAAwBCyABEIwTCyICQVBqIQwgAkEuRiILDQAgDEEKSQ0ACwsgEyAUIAobIRMCQCAJRQ0AIAJBIHJB5QBHDQACQCABIAYQoBMiFUKAgICAgICAgIB/Ug0AIAZFDQRCACEVIAEoAmhFDQAgASABKAIEQX9qNgIECyATIBV8IRMMBAsgCUEARyEJIAJBAEgNAQsgASgCaEUNACABIAEoAgRBf2o2AgQLIAkNARCtEUEcNgIACyABQgAQixNCACETQgAMAQsgBygCgAYiAUUEQCAHIAW3RAAAAAAAAAAAohCVEyAHKQMIIRMgBykDAAwBCwJAIBRCCVUNACATIBRSDQAgA0EeTEEAIAEgA3YbDQAgB0EgaiABEJkTIAdBMGogBRCTEyAHQRBqIAcpAzAgBykDOCAHKQMgIAcpAygQkhMgBykDGCETIAcpAxAMAQsgEyAEQX5trFUEQCAHQeAAaiAFEJMTIAdB0ABqIAcpA2AgBykDaEJ/Qv///////7///wAQkhMgB0FAayAHKQNQIAcpA1hCf0L///////+///8AEJITEK0RQcQANgIAIAcpA0ghEyAHKQNADAELIBMgBEGefmqsUwRAIAdBkAFqIAUQkxMgB0GAAWogBykDkAEgBykDmAFCAEKAgICAgIDAABCSEyAHQfAAaiAHKQOAASAHKQOIAUIAQoCAgICAgMAAEJITEK0RQcQANgIAIAcpA3ghEyAHKQNwDAELIA0EQCANQQhMBEAgB0GABmogCEECdGoiCSgCACEBA0AgAUEKbCEBIA1BCEghAiANQQFqIQ0gAg0ACyAJIAE2AgALIAhBAWohCAsgE6chCgJAIA5BCEoNACAOIApKDQAgCkERSg0AIApBCUYEQCAHQbABaiAHKAKABhCZEyAHQcABaiAFEJMTIAdBoAFqIAcpA8ABIAcpA8gBIAcpA7ABIAcpA7gBEJITIAcpA6gBIRMgBykDoAEMAgsgCkEITARAIAdBgAJqIAcoAoAGEJkTIAdBkAJqIAUQkxMgB0HwAWogBykDkAIgBykDmAIgBykDgAIgBykDiAIQkhMgB0HgAWpBACAKa0ECdEGAnAFqKAIAEJMTIAdB0AFqIAcpA/ABIAcpA/gBIAcpA+ABIAcpA+gBEJwTIAcpA9gBIRMgBykD0AEMAgsgAyAKQX1sakEbaiICQR5MQQAgBygCgAYiASACdhsNACAHQdACaiABEJkTIAdB4AJqIAUQkxMgB0HAAmogBykD4AIgBykD6AIgBykD0AIgBykD2AIQkhMgB0GwAmogCkECdEG4mwFqKAIAEJMTIAdBoAJqIAcpA8ACIAcpA8gCIAcpA7ACIAcpA7gCEJITIAcpA6gCIRMgBykDoAIMAQtBACENAkAgCkEJbyIBRQRAQQAhAgwBCyABIAFBCWogCkF/ShshBgJAIAhFBEBBACECQQAhCAwBC0GAlOvcA0EAIAZrQQJ0QYCcAWooAgAiC20hD0EAIQlBACEBQQAhAgNAIAdBgAZqIAFBAnRqIgwgDCgCACIMIAtuIg4gCWoiCTYCACACQQFqQf8PcSACIAlFIAEgAkZxIgkbIQIgCkF3aiAKIAkbIQogDyAMIAsgDmxrbCEJIAFBAWoiASAIRw0ACyAJRQ0AIAdBgAZqIAhBAnRqIAk2AgAgCEEBaiEICyAKIAZrQQlqIQoLA0AgB0GABmogAkECdGohDgJAA0AgCkEkTgRAIApBJEcNAiAOKAIAQdHp+QRPDQILIAhB/w9qIQxBACEJIAghCwNAIAshCAJ/QQAgCa0gB0GABmogDEH/D3EiAUECdGoiCzUCAEIdhnwiE0KBlOvcA1QNABogEyATQoCU69wDgCIUQoCU69wDfn0hEyAUpwshCSALIBOnIgw2AgAgCCAIIAggASAMGyABIAJGGyABIAhBf2pB/w9xRxshCyABQX9qIQwgASACRw0ACyANQWNqIQ0gCUUNAAsgCyACQX9qQf8PcSICRgRAIAdBgAZqIAtB/g9qQf8PcUECdGoiASABKAIAIAdBgAZqIAtBf2pB/w9xIghBAnRqKAIAcjYCAAsgCkEJaiEKIAdBgAZqIAJBAnRqIAk2AgAMAQsLAkADQCAIQQFqQf8PcSEGIAdBgAZqIAhBf2pB/w9xQQJ0aiEQA0BBCUEBIApBLUobIQwCQANAIAIhC0EAIQECQANAAkAgASALakH/D3EiAiAIRg0AIAdBgAZqIAJBAnRqKAIAIgIgAUECdEHQmwFqKAIAIglJDQAgAiAJSw0CIAFBAWoiAUEERw0BCwsgCkEkRw0AQgAhE0EAIQFCACEUA0AgCCABIAtqQf8PcSICRgRAIAhBAWpB/w9xIghBAnQgB2pBADYC/AULIAdB4AVqIBMgFEIAQoCAgIDlmreOwAAQkhMgB0HwBWogB0GABmogAkECdGooAgAQmRMgB0HQBWogBykD4AUgBykD6AUgBykD8AUgBykD+AUQlBMgBykD2AUhFCAHKQPQBSETIAFBAWoiAUEERw0ACyAHQcAFaiAFEJMTIAdBsAVqIBMgFCAHKQPABSAHKQPIBRCSEyAHKQO4BSEUQgAhEyAHKQOwBSEVIA1B8QBqIgkgBGsiAUEAIAFBAEobIAMgASADSCIMGyICQfAATA0CQgAhFkIAIRdCACEYDAULIAwgDWohDSALIAgiAkYNAAtBgJTr3AMgDHYhDkF/IAx0QX9zIQ9BACEBIAshAgNAIAdBgAZqIAtBAnRqIgkgCSgCACIJIAx2IAFqIgE2AgAgAkEBakH/D3EgAiABRSACIAtGcSIBGyECIApBd2ogCiABGyEKIAkgD3EgDmwhASALQQFqQf8PcSILIAhHDQALIAFFDQEgAiAGRwRAIAdBgAZqIAhBAnRqIAE2AgAgBiEIDAMLIBAgECgCAEEBcjYCACAGIQIMAQsLCyAHQYAFakQAAAAAAADwP0HhASACaxCsGhCVEyAHQaAFaiAHKQOABSAHKQOIBSAVIBQQmBMgBykDqAUhGCAHKQOgBSEXIAdB8ARqRAAAAAAAAPA/QfEAIAJrEKwaEJUTIAdBkAVqIBUgFCAHKQPwBCAHKQP4BBCpGiAHQeAEaiAVIBQgBykDkAUiEyAHKQOYBSIWEJoTIAdB0ARqIBcgGCAHKQPgBCAHKQPoBBCUEyAHKQPYBCEUIAcpA9AEIRULAkAgC0EEakH/D3EiCiAIRg0AAkAgB0GABmogCkECdGooAgAiCkH/ybXuAU0EQCAKRUEAIAtBBWpB/w9xIAhGGw0BIAdB4ANqIAW3RAAAAAAAANA/ohCVEyAHQdADaiATIBYgBykD4AMgBykD6AMQlBMgBykD2AMhFiAHKQPQAyETDAELIApBgMq17gFHBEAgB0HABGogBbdEAAAAAAAA6D+iEJUTIAdBsARqIBMgFiAHKQPABCAHKQPIBBCUEyAHKQO4BCEWIAcpA7AEIRMMAQsgBbchGSAIIAtBBWpB/w9xRgRAIAdBgARqIBlEAAAAAAAA4D+iEJUTIAdB8ANqIBMgFiAHKQOABCAHKQOIBBCUEyAHKQP4AyEWIAcpA/ADIRMMAQsgB0GgBGogGUQAAAAAAADoP6IQlRMgB0GQBGogEyAWIAcpA6AEIAcpA6gEEJQTIAcpA5gEIRYgBykDkAQhEwsgAkHvAEoNACAHQcADaiATIBZCAEKAgICAgIDA/z8QqRogBykDwAMgBykDyANCAEIAEJYTDQAgB0GwA2ogEyAWQgBCgICAgICAwP8/EJQTIAcpA7gDIRYgBykDsAMhEwsgB0GgA2ogFSAUIBMgFhCUEyAHQZADaiAHKQOgAyAHKQOoAyAXIBgQmhMgBykDmAMhFCAHKQOQAyEVAkAgCUH/////B3FBfiARa0wNACAHQYADaiAVIBRCAEKAgICAgICA/z8QkhMgEyAWQgBCABCWEyEJIBUgFBDwERDSAiEZIAcpA4gDIBQgGUQAAAAAAAAAR2YiCBshFCAHKQOAAyAVIAgbIRUgDCAIQQFzIAEgAkdycSAJQQBHcUVBACAIIA1qIg1B7gBqIBJMGw0AEK0RQcQANgIACyAHQfACaiAVIBQgDRCbEyAHKQP4AiETIAcpA/ACCzcDACAAIBM3AwggB0GAxgBqJAALiQQCBH8BfgJAAn8gACgCBCICIAAoAmhJBEAgACACQQFqNgIEIAItAAAMAQsgABCMEwsiAkFVaiIDQQJNQQAgA0EBaxtFBEAgAkFQaiEDQQAhBQwBCyACQS1GIQUCfyAAKAIEIgMgACgCaEkEQCAAIANBAWo2AgQgAy0AAAwBCyAAEIwTCyIEQVBqIQMCQCABRQ0AIANBCkkNACAAKAJoRQ0AIAAgACgCBEF/ajYCBAsgBCECCwJAIANBCkkEQEEAIQMDQCACIANBCmxqIQMCfyAAKAIEIgIgACgCaEkEQCAAIAJBAWo2AgQgAi0AAAwBCyAAEIwTCyICQVBqIgRBCU1BACADQVBqIgNBzJmz5gBIGw0ACyADrCEGAkAgBEEKTw0AA0AgAq0gBkIKfnxCUHwhBgJ/IAAoAgQiAiAAKAJoSQRAIAAgAkEBajYCBCACLQAADAELIAAQjBMLIgJBUGoiBEEJSw0BIAZCro+F18fC66MBUw0ACwsgBEEKSQRAA0ACfyAAKAIEIgIgACgCaEkEQCAAIAJBAWo2AgQgAi0AAAwBCyAAEIwTC0FQakEKSQ0ACwsgACgCaARAIAAgACgCBEF/ajYCBAtCACAGfSAGIAUbIQYMAQtCgICAgICAgICAfyEGIAAoAmhFDQAgACAAKAIEQX9qNgIEQoCAgICAgICAgH8PCyAGC7YDAgN/AX4jAEEgayIDJAACQCABQv///////////wCDIgVCgICAgICAwL9AfCAFQoCAgICAgMDAv398VARAIAFCGYinIQIgAFAgAUL///8PgyIFQoCAgAhUIAVCgICACFEbRQRAIAJBgYCAgARqIQIMAgsgAkGAgICABGohAiAAIAVCgICACIWEQgBSDQEgAkEBcSACaiECDAELIABQIAVCgICAgICAwP//AFQgBUKAgICAgIDA//8AURtFBEAgAUIZiKdB////AXFBgICA/gdyIQIMAQtBgICA/AchAiAFQv///////7+/wABWDQBBACECIAVCMIinIgRBkf4ASQ0AIAMgACABQv///////z+DQoCAgICAgMAAhCIFQYH/ACAEaxDuESADQRBqIAAgBSAEQf+Bf2oQ7xEgAykDCCIFQhmIpyECIAMpAwAgAykDECADKQMYhEIAUq2EIgBQIAVC////D4MiBUKAgIAIVCAFQoCAgAhRG0UEQCACQQFqIQIMAQsgACAFQoCAgAiFhEIAUg0AIAJBAXEgAmohAgsgA0EgaiQAIAIgAUIgiKdBgICAgHhxcr4LzRMCD38DfiMAQbACayIGJABBACENQQAhECAAKAJMQQBOBEAgABDCBCEQCwJAIAEtAAAiBEUNACAAQQRqIQdCACESQQAhDQJAA0ACQAJAIARB/wFxEIoTBEADQCABIgRBAWohASAELQABEIoTDQALIABCABCLEwNAAn8gACgCBCIBIAAoAmhJBEAgByABQQFqNgIAIAEtAAAMAQsgABCMEwsQihMNAAsCQCAAKAJoRQRAIAcoAgAhAQwBCyAHIAcoAgBBf2oiATYCAAsgASAAKAIIa6wgACkDeCASfHwhEgwBCwJ/AkACQCABLQAAIgRBJUYEQCABLQABIgNBKkYNASADQSVHDQILIABCABCLEyABIARBJUZqIQQCfyAAKAIEIgEgACgCaEkEQCAHIAFBAWo2AgAgAS0AAAwBCyAAEIwTCyIBIAQtAABHBEAgACgCaARAIAcgBygCAEF/ajYCAAtBACEOIAFBAE4NCAwFCyASQgF8IRIMAwtBACEIIAFBAmoMAQsCQCADEMkRRQ0AIAEtAAJBJEcNACACIAEtAAFBUGoQoxMhCCABQQNqDAELIAIoAgAhCCACQQRqIQIgAUEBagshBEEAIQ5BACEBIAQtAAAQyREEQANA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GiAAQdTZATYCACAACxsAIAAgARClFhogABCqARogAEHI2gE2AgAgAAsbACAAIAEQpRYaIAAQqgEaIABBvNsBNgIAIAALGwAgACABEKUWGiAAEKoBGiAAQbDcATYCACAACxsAIAAgARClFhogABCqARogAEHU3QE2AgAgAAsbACAAIAEQpRYaIAAQqgEaIABB+N4BNgIAIAALGwAgACABEKUWGiAAEKoBGiAAQZzgATYCACAACygAIAAgARClFhogAEEIahCrGCEBIABBsNIBNgIAIAFB4NIBNgIAIAALKAAgACABEKUWGiAAQQhqEKwYIQEgAEG41AE2AgAgAUHo1AE2AgAgAAseACAAIAEQpRYaIABBCGoQrRgaIABBpNYBNgIAIAALHgAgACABEKUWGiAAQQhqEK0YGiAAQcDXATYCACAACxsAIAAgARClFhogABCqARogAEHA4QE2AgAgAAsbACAAIAEQpRYaIAAQqgEaIABBuOIBNgIAIAALOAACQEHckgMtAABBAXENAEHckgMQnRlFDQAQhBcaQdiSA0HUkgM2AgBB3JIDEJ8ZC0HYkgMoAgALCwAgAEEEahCFFxoLFAAQlBdB1JIDQaCfAzYCAEHUkgMLEwAgACAAKAIAQQFqIgA2AgAgAAsPACAAQRBqIAEQkAYoAgALKAEBfyMAQRBrIgIkACACIAE2AgwgACACQQxqEIkXGiACQRBqJAAgAAsJACAAEIwXIAALDwAgACABEKoBEPIMGiAACzQBAX8gABDQAyICIAFJBEAgACABIAJrEJIXDwsgAiABSwRAIAAgACgCACABQQJ0ahCTFwsLGgEBfyAAEMwFKAIAIQEgABDMBUEANgIAIAELIgEBfyAAEMwFKAIAIQEgABDMBUEANgIAIAEEQCABEK8YCwtiAQJ/IABBwL4BNgIAIABBEGohAkEAIQEDQCABIAIQ0ANJBEAgAiABEJAGKAIABEAgAiABEJAGKAIAEIoNGgsgAUEBaiEBDAELCyAAQbABahCEGRogAhCOFxogABDmBRogAAsPACAAEI8XIAAQkBcaIAALNgAgACAAELIEIAAQsgQgABCkGEECdGogABCyBCAAENADQQJ0aiAAELIEIAAQpBhBAnRqEMgFCyMAIAAoAgAEQCAAEOMWIAAQmRggACgCACAAEKUYEKgYCyAACwoAIAAQjRcQ+hgLbgECfyMAQSBrIgMkAAJAIAAQmxgoAgAgACgCBGtBAnUgAU8EQCAAIAEQ4hYMAQsgABCZGCECIANBCGogACAAENADIAFqEK4YIAAQ0AMgAhCwGCICIAEQsRggACACELIYIAIQsxgaCyADQSBqJAALIAEBfyAAIAEQzQUgABDQAyECIAAgARCpGCAAIAIQ5BYLDABBoJ8DQQEQpBYaCxEAQeCSAxCCFxCWFxpB4JIDCxUAIAAgASgCACIBNgIAIAEQgxcgAAs4AAJAQeiSAy0AAEEBcQ0AQeiSAxCdGUUNABCVFxpB5JIDQeCSAzYCAEHokgMQnxkLQeSSAygCAAsYAQF/IAAQlxcoAgAiATYCACABEIMXIAALDwAgACgCACABEOUWEJoXCygBAX9BACECIABBEGoiABDQAyABSwR/IAAgARCQBigCAEEARwUgAgsLCgAgABCiFzYCBAsVACAAIAEpAgA3AgQgACACNgIAIAALPAEBfyMAQRBrIgIkACAAEKIEQX9HBEAgAiACQQhqIAEQqgEQoBcQhAYaIAAgAkGwBRDzGAsgAkEQaiQACwoAIAAQ5gUQ+hgLFAAgAARAIAAgACgCACgCBBEEAAsLDwAgACABEKoBELwYGiAACwcAIAAQvRgLGQEBf0HskgNB7JIDKAIAQQFqIgA2AgAgAAsNACAAEOYFGiAAEPoYCyQAQQAhACACQf8ATQR/EKUXIAJBAXRqLwEAIAFxQQBHBSAACwsIABC5EygCAAtHAANAIAEgAkZFBEBBACEAIAMgASgCAEH/AE0EfxClFyABKAIAQQF0ai8BAAUgAAs7AQAgA0ECaiEDIAFBBGohAQwBCwsgAgtBAANAAkAgAiADRwR/IAIoAgBB/wBLDQEQpRcgAigCAEEBdGovAQAgAXFFDQEgAgUgAwsPCyACQQRqIQIMAAALAAtBAAJAA0AgAiADRg0BAkAgAigCAEH/AEsNABClFyACKAIAQQF0ai8BACABcUUNACACQQRqIQIMAQsLIAIhAwsgAwsaACABQf8ATQR/EKoXIAFBAnRqKAIABSABCwsIABC6EygCAAs+AANAIAEgAkZFBEAgASABKAIAIgBB/wBNBH8QqhcgASgCAEECdGooAgAFIAALNgIAIAFBBGohAQwBCwsgAgsaACABQf8ATQR/EK0XIAFBAnRqKAIABSABCwsIABC7EygCAAs+AANAIAEgAkZFBEAgASABKAIAIgBB/wBNBH8QrRcgASgCAEECdGooAgAFIAALNgIAIAFBBGohAQwBCwsgAgsEACABCyoAA0AgASACRkUEQCADIAEsAAA2AgAgA0EEaiEDIAFBAWohAQwBCwsgAgsTACABIAIgAUGAAUkbQRh0QRh1CzUAA0AgASACRkUEQCAEIAEoAgAiACADIABBgAFJGzoAACAEQQFqIQQgAUEEaiEBDAELCyACCy8BAX8gAEHUvgE2AgACQCAAKAIIIgFFDQAgAC0ADEUNACABEPoFCyAAEOYFGiAACwoAIAAQsxcQ+hgLIwAgAUEATgR/EKoXIAFB/wFxQQJ0aigCAAUgAQtBGHRBGHULPQADQCABIAJGRQRAIAEgASwAACIAQQBOBH8QqhcgASwAAEECdGooAgAFIAALOgAAIAFBAWohAQwBCwsgAgsjACABQQBOBH8QrRcgAUH/AXFBAnRqKAIABSABC0EYdEEYdQs9AANAIAEgAkZFBEAgASABLAAAIgBBAE4EfxCtFyABLAAAQQJ0aigCAAUgAAs6AAAgAUEBaiEBDAELCyACCyoAA0AgASACRkUEQCADIAEtAAA6AAAgA0EBaiEDIAFBAWohAQwBCwsgAgsMACABIAIgAUF/ShsLNAADQCABIAJGRQRAIAQgASwAACIAIAMgAEF/Shs6AAAgBEEBaiEEIAFBAWohAQwBCwsgAgsSACAEIAI2AgAgByAFNgIAQQMLCwAgBCACNgIAQQMLNwAjAEEQayIAJAAgACAENgIMIAAgAyACazYCCCAAQQxqIABBCGoQ6gUoAgAhAyAAQRBqJAAgAwsKACAAEKMWEPoYC+sDAQV/IwBBEGsiCSQAIAIhCANAAkAgAyAIRgRAIAMhCAwBCyAIKAIARQ0AIAhBBGohCAwBCwsgByAFNgIAIAQgAjYCAEEBIQoDQAJAAkACQCAFIAZGDQAgAiADRg0AIAkgASkCADcDCAJAAkACQCAFIAQgCCACa0ECdSAGIAVrIAEgACgCCBDBFyILQQFqIgxBAU0EQCAMQQFrRQ0FIAcgBTYCAANAAkAgAiAEKAIARg0AIAUgAigCACAJQQhqIAAoAggQwhciCEF/Rg0AIAcgBygCACAIaiIFNgIAIAJBBGohAgwBCwsgBCACNgIADAELIAcgBygCACALaiIFNgIAIAUgBkYNAiADIAhGBEAgBCgCACECIAMhCAwHCyAJQQRqQQAgASAAKAIIEMIXIghBf0cNAQtBAiEKDAMLIAlBBGohBSAIIAYgBygCAGtLBEBBASEKDAMLA0AgCARAIAUtAAAhAiAHIAcoAgAiC0EBajYCACALIAI6AAAgCEF/aiEIIAVBAWohBQwBCwsgBCAEKAIAQQRqIgI2AgAgAiEIA0AgAyAIRgRAIAMhCAwFCyAIKAIARQ0EIAhBBGohCAwAAAsACyAEKAIAIQILIAIgA0chCgsgCUEQaiQAIAoPCyAHKAIAIQUMAAALAAtBAQF/IwBBEGsiBiQAIAYgBTYCDCAGQQhqIAZBDGoQlhQhBSAAIAEgAiADIAQQvRMhACAFEJcUGiAGQRBqJAAgAAs9AQF/IwBBEGsiBCQAIAQgAzYCDCAEQQhqIARBDGoQlhQhAyAAIAEgAhDMESEAIAMQlxQaIARBEGokACAAC8ADAQN/IwBBEGsiCSQAIAIhCANAAkAgAyAIRgRAIAMhCAwBCyAILQAARQ0AIAhBAWohCAwBCwsgByAFNgIAIAQgAjYCAANAAkACfwJAIAUgBkYNACACIANGDQAgCSABKQIANwMIAkACQAJAAkAgBSAEIAggAmsgBiAFa0ECdSABIAAoAggQxBciCkF/RgRAA0ACQCAHIAU2AgAgAiAEKAIARg0AAkAgBSACIAggAmsgCUEIaiAAKAIIEMUXIgVBAmoiBkECSw0AQQEhBQJAIAZBAWsOAgABBwsgBCACNgIADAQLIAIgBWohAiAHKAIAQQRqIQUMAQsLIAQgAjYCAAwFCyAHIAcoAgAgCkECdGoiBTYCACAFIAZGDQMgBCgCACECIAMgCEYEQCADIQgMCAsgBSACQQEgASAAKAIIEMUXRQ0BC0ECDAQLIAcgBygCAEEEajYCACAEIAQoAgBBAWoiAjYCACACIQgDQCADIAhGBEAgAyEIDAYLIAgtAABFDQUgCEEBaiEIDAAACwALIAQgAjYCAEEBDAILIAQoAgAhAgsgAiADRwshCCAJQRBqJAAgCA8LIAcoAgAhBQwAAAsAC0EBAX8jAEEQayIGJAAgBiAFNgIMIAZBCGogBkEMahCWFCEFIAAgASACIAMgBBC/EyEAIAUQlxQaIAZBEGokACAACz8BAX8jAEEQayIFJAAgBSAENgIMIAVBCGogBUEMahCWFCEEIAAgASACIAMQjxMhACAEEJcUGiAFQRBqJAAgAAuUAQEBfyMAQRBrIgUkACAEIAI2AgACf0ECIAVBDGpBACABIAAoAggQwhciAUEBakECSQ0AGkEBIAFBf2oiASADIAQoAgBrSw0AGiAFQQxqIQIDfyABBH8gAi0AACEAIAQgBCgCACIDQQFqNgIAIAMgADoAACABQX9qIQEgAkEBaiECDAEFQQALCwshAiAFQRBqJAAgAgszAQF/QX8hAQJAQQBBAEEEIAAoAggQyBcEfyABBSAAKAIIIgANAUEBCw8LIAAQyRdBAUYLPQEBfyMAQRBrIgQkACAEIAM2AgwgBEEIaiAEQQxqEJYUIQMgACABIAIQwBMhACADEJcUGiAEQRBqJAAgAAs3AQJ/IwBBEGsiASQAIAEgADYCDCABQQhqIAFBDGoQlhQhABDBEyECIAAQlxQaIAFBEGokACACC2IBBH9BACEFQQAhBgNAAkAgAiADRg0AIAYgBE8NACACIAMgAmsgASAAKAIIEMsXIgdBAmoiCEECTQRAQQEhByAIQQJrDQELIAZBAWohBiAFIAdqIQUgAiAHaiECDAELCyAFCz0BAX8jAEEQayIEJAAgBCADNgIMIARBCGogBEEMahCWFCEDIAAgASACEMITIQAgAxCXFBogBEEQaiQAIAALFQAgACgCCCIARQRAQQEPCyAAEMkXC1QAIwBBEGsiACQAIAAgAjYCDCAAIAU2AgggAiADIABBDGogBSAGIABBCGpB///DAEEAEM4XIQUgBCAAKAIMNgIAIAcgACgCCDYCACAAQRBqJAAgBQuPBgEBfyACIAA2AgAgBSADNgIAAkAgB0ECcQRAQQEhACAEIANrQQNIDQEgBSADQQFqNgIAIANB7wE6AAAgBSAFKAIAIgNBAWo2AgAgA0G7AToAACAFIAUoAgAiA0EBajYCACADQb8BOgAACyACKAIAIQcCQANAIAcgAU8EQEEAIQAMAwtBAiEAIAcvAQAiAyAGSw0CAkACQCADQf8ATQRAQQEhACAEIAUoAgAiB2tBAUgNBSAFIAdBAWo2AgAgByADOgAADAELIANB/w9NBEAgBCAFKAIAIgdrQQJIDQQgBSAHQQFqNgIAIAcgA0EGdkHAAXI6AAAgBSAFKAIAIgdBAWo2AgAgByADQT9xQYABcjoAAAwBCyADQf+vA00EQCAEIAUoAgAiB2tBA0gNBCAFIAdBAWo2AgAgByADQQx2QeABcjoAACAFIAUoAgAiB0EBajYCACAHIANBBnZBP3FBgAFyOgAAIAUgBSgCACIHQQFqNgIAIAcgA0E/cUGAAXI6AAAMAQsgA0H/twNNBEBBASEAIAEgB2tBBEgNBSAHLwECIghBgPgDcUGAuANHDQIgBCAFKAIAa0EESA0FIAhB/wdxIANBCnRBgPgDcSADQcAHcSIAQQp0cnJBgIAEaiAGSw0CIAIgB0ECajYCACAFIAUoAgAiB0EBajYCACAHIABBBnZBAWoiAEECdkHwAXI6AAAgBSAFKAIAIgdBAWo2AgAgByAAQQR0QTBxIANBAnZBD3FyQYABcjoAACAFIAUoAgAiB0EBajYCACAHIAhBBnZBD3EgA0EEdEEwcXJBgAFyOgAAIAUgBSgCACIDQQFqNgIAIAMgCEE/cUGAAXI6AAAMAQsgA0GAwANJDQQgBCAFKAIAIgdrQQNIDQMgBSAHQQFqNgIAIAcgA0EMdkHgAXI6AAAgBSAFKAIAIgdBAWo2AgAgByADQQZ2QT9xQYABcjoAACAFIAUoAgAiB0EBajYCACAHIANBP3FBgAFyOgAACyACIAIoAgBBAmoiBzYCAAwBCwtBAg8LQQEPCyAAC1QAIwBBEGsiACQAIAAgAjYCDCAAIAU2AgggAiADIABBDGogBSAGIABBCGpB///DAEEAENAXIQUgBCAAKAIMNgIAIAcgACgCCDYCACAAQRBqJAAgBQvYBQEEfyACIAA2AgAgBSADNgIAAkAgB0EEcUUNACABIAIoAgAiB2tBA0gNACAHLQAAQe8BRw0AIActAAFBuwFHDQAgBy0AAkG/AUcNACACIAdBA2o2AgALAkADQCACKAIAIgMgAU8EQEEAIQoMAgtBASEKIAUoAgAiACAETw0BAkAgAy0AACIHIAZLDQAgAgJ/IAdBGHRBGHVBAE4EQCAAIAc7AQAgA0EBagwBCyAHQcIBSQ0BIAdB3wFNBEAgASADa0ECSA0EIAMtAAEiCEHAAXFBgAFHDQJBAiEKIAhBP3EgB0EGdEHAD3FyIgcgBksNBCAAIAc7AQAgA0ECagwBCyAHQe8BTQRAIAEgA2tBA0gNBCADLQACIQkgAy0AASEIAkACQCAHQe0BRwRAIAdB4AFHDQEgCEHgAXFBoAFHDQUMAgsgCEHgAXFBgAFHDQQMAQsgCEHAAXFBgAFHDQMLIAlBwAFxQYABRw0CQQIhCiAJQT9xIAhBP3FBBnQgB0EMdHJyIgdB//8DcSAGSw0EIAAgBzsBACADQQNqDAELIAdB9AFLDQEgASADa0EESA0DIAMtAAMhCSADLQACIQggAy0AASEDAkACQCAHQZB+aiILQQRLDQACQAJAIAtBAWsOBAICAgEACyADQfAAakH/AXFBME8NBAwCCyADQfABcUGAAUcNAwwBCyADQcABcUGAAUcNAgsgCEHAAXFBgAFHDQEgCUHAAXFBgAFHDQEgBCAAa0EESA0DQQIhCiAJQT9xIgkgCEEGdCILQcAfcSADQQx0QYDgD3EgB0EHcSIHQRJ0cnJyIAZLDQMgACADQQJ0IgNBwAFxIAdBCHRyIAhBBHZBA3EgA0E8cXJyQcD/AGpBgLADcjsBACAFIABBAmo2AgAgACALQcAHcSAJckGAuANyOwECIAIoAgBBBGoLNgIAIAUgBSgCAEECajYCAAwBCwtBAg8LIAoLEgAgAiADIARB///DAEEAENIXC7wEAQZ/IAAhBQJAIARBBHFFDQAgASAAIgVrQQNIDQAgACIFLQAAQe8BRw0AIAAiBS0AAUG7AUcNACAAQQNqIAAgAC0AAkG/AUYbIQULQQAhBwNAAkAgByACTw0AIAUgAU8NACAFLQAAIgQgA0sNAAJ/IAVBAWogBEEYdEEYdUEATg0AGiAEQcIBSQ0BIARB3wFNBEAgASAFa0ECSA0CIAUtAAEiBkHAAXFBgAFHDQIgBkE/cSAEQQZ0QcAPcXIgA0sNAiAFQQJqDAELAkACQCAEQe8BTQRAIAEgBWtBA0gNBCAFLQACIQggBS0AASEGIARB7QFGDQEgBEHgAUYEQCAGQeABcUGgAUYNAwwFCyAGQcABcUGAAUcNBAwCCyAEQfQBSw0DIAIgB2tBAkkNAyABIAVrQQRIDQMgBS0AAyEJIAUtAAIhCCAFLQABIQYCQAJAIARBkH5qIgpBBEsNAAJAAkAgCkEBaw4EAgICAQALIAZB8ABqQf8BcUEwSQ0CDAYLIAZB8AFxQYABRg0BDAULIAZBwAFxQYABRw0ECyAIQcABcUGAAUcNAyAJQcABcUGAAUcNAyAJQT9xIAhBBnRBwB9xIARBEnRBgIDwAHEgBkE/cUEMdHJyciADSw0DIAdBAWohByAFQQRqDAILIAZB4AFxQYABRw0CCyAIQcABcUGAAUcNASAIQT9xIARBDHRBgOADcSAGQT9xQQZ0cnIgA0sNASAFQQNqCyEFIAdBAWohBwwBCwsgBSAAawtUACMAQRBrIgAkACAAIAI2AgwgACAFNgIIIAIgAyAAQQxqIAUgBiAAQQhqQf//wwBBABDUFyEFIAQgACgCDDYCACAHIAAoAgg2AgAgAEEQaiQAIAULqAQAIAIgADYCACAFIAM2AgACQCAHQQJxBEBBASEHIAQgA2tBA0gNASAFIANBAWo2AgAgA0HvAToAACAFIAUoAgAiA0EBajYCACADQbsBOgAAIAUgBSgCACIDQQFqNgIAIANBvwE6AAALIAIoAgAhAwNAIAMgAU8EQEEAIQcMAgtBAiEHIAMoAgAiAyAGSw0BIANBgHBxQYCwA0YNAQJAAkAgA0H/AE0EQEEBIQcgBCAFKAIAIgBrQQFIDQQgBSAAQQFqNgIAIAAgAzoAAAwBCyADQf8PTQRAIAQgBSgCACIHa0ECSA0CIAUgB0EBajYCACAHIANBBnZBwAFyOgAAIAUgBSgCACIHQQFqNgIAIAcgA0E/cUGAAXI6AAAMAQsgBCAFKAIAIgdrIQAgA0H//wNNBEAgAEEDSA0CIAUgB0EBajYCACAHIANBDHZB4AFyOgAAIAUgBSgCACIHQQFqNgIAIAcgA0EGdkE/cUGAAXI6AAAgBSAFKAIAIgdBAWo2AgAgByADQT9xQYABcjoAAAwBCyAAQQRIDQEgBSAHQQFqNgIAIAcgA0ESdkHwAXI6AAAgBSAFKAIAIgdBAWo2AgAgByADQQx2QT9xQYABcjoAACAFIAUoAgAiB0EBajYCACAHIANBBnZBP3FBgAFyOgAAIAUgBSgCACIHQQFqNgIAIAcgA0E/cUGAAXI6AAALIAIgAigCAEEEaiIDNgIADAELC0EBDwsgBwtUACMAQRBrIgAkACAAIAI2AgwgACAFNgIIIAIgAyAAQQxqIAUgBiAAQQhqQf//wwBBABDWFyEFIAQgACgCDDYCACAHIAAoAgg2AgAgAEEQaiQAIAUL9wQBBX8gAiAANgIAIAUgAzYCAAJAIAdBBHFFDQAgASACKAIAIgdrQQNIDQAgBy0AAEHvAUcNACAHLQABQbsBRw0AIActAAJBvwFHDQAgAiAHQQNqNgIACwNAIAIoAgAiAyABTwRAQQAPC0EBIQkCQAJAAkAgBSgCACIMIARPDQAgAywAACIAQf8BcSEHIABBAE4EQCAHIAZLDQNBASEADAILIAdBwgFJDQIgB0HfAU0EQCABIANrQQJIDQFBAiEJIAMtAAEiCEHAAXFBgAFHDQFBAiEAQQIhCSAIQT9xIAdBBnRBwA9xciIHIAZNDQIMAQsCQCAHQe8BTQRAIAEgA2tBA0gNAiADLQACIQogAy0AASEIAkACQCAHQe0BRwRAIAdB4AFHDQEgCEHgAXFBoAFGDQIMBwsgCEHgAXFBgAFGDQEMBgsgCEHAAXFBgAFHDQULIApBwAFxQYABRg0BDAQLIAdB9AFLDQMgASADa0EESA0BIAMtAAMhCyADLQACIQogAy0AASEIAkACQCAHQZB+aiIAQQRLDQACQAJAIABBAWsOBAICAgEACyAIQfAAakH/AXFBME8NBgwCCyAIQfABcUGAAUcNBQwBCyAIQcABcUGAAUcNBAsgCkHAAXFBgAFHDQMgC0HAAXFBgAFHDQNBBCEAQQIhCSALQT9xIApBBnRBwB9xIAdBEnRBgIDwAHEgCEE/cUEMdHJyciIHIAZLDQEMAgtBAyEAQQIhCSAKQT9xIAdBDHRBgOADcSAIQT9xQQZ0cnIiByAGTQ0BCyAJDwsgDCAHNgIAIAIgACADajYCACAFIAUoAgBBBGo2AgAMAQsLQQILEgAgAiADIARB///DAEEAENgXC68EAQZ/IAAhBQJAIARBBHFFDQAgASAAIgVrQQNIDQAgACIFLQAAQe8BRw0AIAAiBS0AAUG7AUcNACAAQQNqIAAgAC0AAkG/AUYbIQULQQAhCANAAkAgCCACTw0AIAUgAU8NACAFLAAAIgZB/wFxIQQCfyAGQQBOBEAgBCADSw0CIAVBAWoMAQsgBEHCAUkNASAEQd8BTQRAIAEgBWtBAkgNAiAFLQABIgZBwAFxQYABRw0CIAZBP3EgBEEGdEHAD3FyIANLDQIgBUECagwBCwJAAkAgBEHvAU0EQCABIAVrQQNIDQQgBS0AAiEHIAUtAAEhBiAEQe0BRg0BIARB4AFGBEAgBkHgAXFBoAFGDQMMBQsgBkHAAXFBgAFHDQQMAgsgBEH0AUsNAyABIAVrQQRIDQMgBS0AAyEJIAUtAAIhByAFLQABIQYCQAJAIARBkH5qIgpBBEsNAAJAAkAgCkEBaw4EAgICAQALIAZB8ABqQf8BcUEwSQ0CDAYLIAZB8AFxQYABRg0BDAULIAZBwAFxQYABRw0ECyAHQcABcUGAAUcNAyAJQcABcUGAAUcNAyAJQT9xIAdBBnRBwB9xIARBEnRBgIDwAHEgBkE/cUEMdHJyciADSw0DIAVBBGoMAgsgBkHgAXFBgAFHDQILIAdBwAFxQYABRw0BIAdBP3EgBEEMdEGA4ANxIAZBP3FBBnRyciADSw0BIAVBA2oLIQUgCEEBaiEIDAELCyAFIABrCxwAIABBuL8BNgIAIABBDGoQhBkaIAAQ5gUaIAALCgAgABDZFxD6GAscACAAQeC/ATYCACAAQRBqEIQZGiAAEOYFGiAACwoAIAAQ2xcQ+hgLBwAgACwACAsHACAALAAJCw0AIAAgAUEMahCBGRoLDQAgACABQRBqEIEZGgsMACAAQYDAARDbEhoLDAAgAEGIwAEQ4xcaCxYAIAAQ2hMaIAAgASABEOQXEJEZIAALBwAgABC4EwsMACAAQZzAARDbEhoLDAAgAEGkwAEQ4xcaCwkAIAAgARCPGQstAAJAIAAgAUYNAANAIAAgAUF8aiIBTw0BIAAgARDLGCAAQQRqIQAMAAALAAsLNwACQEG0kwMtAABBAXENAEG0kwMQnRlFDQAQ6hdBsJMDQeCUAzYCAEG0kwMQnxkLQbCTAygCAAvmAQEBfwJAQYiWAy0AAEEBcQ0AQYiWAxCdGUUNAEHglAMhAANAIAAQ2wlBDGoiAEGIlgNHDQALQYiWAxCfGQtB4JQDQYjjARDnFxpB7JQDQY/jARDnFxpB+JQDQZbjARDnFxpBhJUDQZ7jARDnFxpBkJUDQajjARDnFxpBnJUDQbHjARDnFxpBqJUDQbjjARDnFxpBtJUDQcHjARDnFxpBwJUDQcXjARDnFxpBzJUDQcnjARDnFxpB2JUDQc3jARDnFxpB5JUDQdHjARDnFxpB8JUDQdXjARDnFxpB/JUDQdnjARDnFxoLHABBiJYDIQADQCAAQXRqEIQZIgBB4JQDRw0ACws3AAJAQbyTAy0AAEEBcQ0AQbyTAxCdGUUNABDtF0G4kwNBkJYDNgIAQbyTAxCfGQtBuJMDKAIAC+YBAQF/AkBBuJcDLQAAQQFxDQBBuJcDEJ0ZRQ0AQZCWAyEAA0AgABC4FUEMaiIAQbiXA0cNAAtBuJcDEJ8ZC0GQlgNB4OMBEO8XGkGclgNB/OMBEO8XGkGolgNBmOQBEO8XGkG0lgNBuOQBEO8XGkHAlgNB4OQBEO8XGkHMlgNBhOUBEO8XGkHYlgNBoOUBEO8XGkHklgNBxOUBEO8XGkHwlgNB1OUBEO8XGkH8lgNB5OUBEO8XGkGIlwNB9OUBEO8XGkGUlwNBhOYBEO8XGkGglwNBlOYBEO8XGkGslwNBpOYBEO8XGgscAEG4lwMhAANAIABBdGoQkhkiAEGQlgNHDQALCwkAIAAgARCaGQs3AAJAQcSTAy0AAEEBcQ0AQcSTAxCdGUUNABDxF0HAkwNBwJcDNgIAQcSTAxCfGQtBwJMDKAIAC94CAQF/AkBB4JkDLQAAQQFxDQBB4JkDEJ0ZRQ0AQcCXAyEAA0AgABDbCUEMaiIAQeCZA0cNAAtB4JkDEJ8ZC0HAlwNBtOYBEOcXGkHMlwNBvOYBEOcXGkHYlwNBxeYBEOcXGkHklwNBy+YBEOcXGkHwlwNB0eYBEOcXGkH8lwNB1eYBEOcXGkGImANB2uYBEOcXGkGUmANB3+YBEOcXGkGgmANB5uYBEOcXGkGsmANB8OYBEOcXGkG4mANB+OYBEOcXGkHEmANBgecBEOcXGkHQmANBiucBEOcXGkHcmANBjucBEOcXGkHomANBkucBEOcXGkH0mANBlucBEOcXGkGAmQNB0eYBEOcXGkGMmQNBmucBEOcXGkGYmQNBnucBEOcXGkGkmQNBoucBEOcXGkGwmQNBpucBEOcXGkG8mQNBqucBEOcXGkHImQNBrucBEOcXGkHUmQNBsucBEOcXGgscAEHgmQMhAANAIABBdGoQhBkiAEHAlwNHDQALCzcAAkBBzJMDLQAAQQFxDQBBzJMDEJ0ZRQ0AEPQXQciTA0HwmQM2AgBBzJMDEJ8ZC0HIkwMoAgAL3gIBAX8CQEGQnAMtAABBAXENAEGQnAMQnRlFDQBB8JkDIQADQCAAELgVQQxqIgBBkJwDRw0AC0GQnAMQnxkLQfCZA0G45wEQ7xcaQfyZA0HY5wEQ7xcaQYiaA0H85wEQ7xcaQZSaA0GU6AEQ7xcaQaCaA0Gs6AEQ7xcaQayaA0G86AEQ7xcaQbiaA0HQ6AEQ7xcaQcSaA0Hk6AEQ7xcaQdCaA0GA6QEQ7xcaQdyaA0Go6QEQ7xcaQeiaA0HI6QEQ7xcaQfSaA0Hs6QEQ7xcaQYCbA0GQ6gEQ7xcaQYybA0Gg6gEQ7xcaQZibA0Gw6gEQ7xcaQaSbA0HA6gEQ7xcaQbCbA0Gs6AEQ7xcaQbybA0HQ6gEQ7xcaQcibA0Hg6gEQ7xcaQdSbA0Hw6gEQ7xcaQeCbA0GA6wEQ7xcaQeybA0GQ6wEQ7xcaQfibA0Gg6wEQ7xcaQYScA0Gw6wEQ7xcaCxwAQZCcAyEAA0AgAEF0ahCSGSIAQfCZA0cNAAsLNwACQEHUkwMtAABBAXENAEHUkwMQnRlFDQAQ9xdB0JMDQaCcAzYCAEHUkwMQnxkLQdCTAygCAAtWAQF/AkBBuJwDLQAAQQFxDQBBuJwDEJ0ZRQ0AQaCcAyEAA0AgABDbCUEMaiIAQbicA0cNAAtBuJwDEJ8ZC0GgnANBwOsBEOcXGkGsnANBw+sBEOcXGgscAEG4nAMhAANAIABBdGoQhBkiAEGgnANHDQALCzcAAkBB3JMDLQAAQQFxDQBB3JMDEJ0ZRQ0AEPoXQdiTA0HAnAM2AgBB3JMDEJ8ZC0HYkwMoAgALVgEBfwJAQdicAy0AAEEBcQ0AQdicAxCdGUUNAEHAnAMhAANAIAAQuBVBDGoiAEHYnANHDQALQdicAxCfGQtBwJwDQcjrARDvFxpBzJwDQdTrARDvFxoLHABB2JwDIQADQCAAQXRqEJIZIgBBwJwDRw0ACwsyAAJAQeyTAy0AAEEBcQ0AQeyTAxCdGUUNAEHgkwNBvMABENsSGkHskwMQnxkLQeCTAwsKAEHgkwMQhBkaCzIAAkBB/JMDLQAAQQFxDQBB/JMDEJ0ZRQ0AQfCTA0HIwAEQ4xcaQfyTAxCfGQtB8JMDCwoAQfCTAxCSGRoLMgACQEGMlAMtAABBAXENAEGMlAMQnRlFDQBBgJQDQezAARDbEhpBjJQDEJ8ZC0GAlAMLCgBBgJQDEIQZGgsyAAJAQZyUAy0AAEEBcQ0AQZyUAxCdGUUNAEGQlANB+MABEOMXGkGclAMQnxkLQZCUAwsKAEGQlAMQkhkaCzIAAkBBrJQDLQAAQQFxDQBBrJQDEJ0ZRQ0AQaCUA0GcwQEQ2xIaQayUAxCfGQtBoJQDCwoAQaCUAxCEGRoLMgACQEG8lAMtAABBAXENAEG8lAMQnRlFDQBBsJQDQbTBARDjFxpBvJQDEJ8ZC0GwlAMLCgBBsJQDEJIZGgsyAAJAQcyUAy0AAEEBcQ0AQcyUAxCdGUUNAEHAlANBiMIBENsSGkHMlAMQnxkLQcCUAwsKAEHAlAMQhBkaCzIAAkBB3JQDLQAAQQFxDQBB3JQDEJ0ZRQ0AQdCUA0GUwgEQ4xcaQdyUAxCfGQtB0JQDCwoAQdCUAxCSGRoLCQAgACABEKwVCxsBAX9BASEBIAAQjBUEfyAAEJYYQX9qBSABCwsZACAAEIwVBEAgACABEPAVDwsgACABEPIVCxgAIAAoAgAQkhRHBEAgACgCABC3EwsgAAsTACAAQQhqEKoBGiAAEOYFGiAACwoAIAAQkBgQ+hgLCgAgABCQGBD6GAsKACAAEJQYEPoYCxMAIABBCGoQjxgaIAAQ5gUaIAALBwAgABDMBQsRACAAEMwFKAIIQf////8HcQsYACAAIAEQqgEQ5QUaIABBEGoQnhgaIAALPQEBfyMAQRBrIgEkACABIAAQoBgQoRg2AgwgARDpBTYCCCABQQxqIAFBCGoQ6gUoAgAhACABQRBqJAAgAAsKACAAQRBqEKMYCwsAIAAgAUEAEKIYCwoAIABBEGoQzAULMwAgACAAELIEIAAQsgQgABCkGEECdGogABCyBCAAEKQYQQJ0aiAAELIEIAFBAnRqEMgFCwkAIAAgARCnGAsKACAAEJ8YGiAACwsAIABBADoAcCAACwoAIABBEGoQoxgLBwAgABCrBgsnAAJAIAFBHEsNACAALQBwDQAgAEEBOgBwIAAPCyABQQJ0QQQQ8gULCgAgAEEQahCqAQsHACAAEKUYCxMAIAAQphgoAgAgACgCAGtBAnULCgAgAEEQahDMBQsJACABQQA2AgALCwAgACABIAIQqhgLMgEBfyAAKAIEIQIDQCABIAJGRQRAIAAQmRggAkF8aiICEKoBEMsFDAELCyAAIAE2AgQLHgAgACABRgRAIABBADoAcA8LIAEgAkECdEEEEPcFCw0AIABBrOwBNgIAIAALDQAgAEHQ7AE2AgAgAAsMACAAEJIUNgIAIAALXQECfyMAQRBrIgIkACACIAE2AgwgABCYGCIDIAFPBEAgABCkGCIAIANBAXZJBEAgAiAAQQF0NgIIIAJBCGogAkEMahCbBigCACEDCyACQRBqJAAgAw8LIAAQnBkACwgAIAAQig0aC28BAn8jAEEQayIFJABBACEEIAVBADYCDCAAQQxqIAVBDGogAxC0GBogAQRAIAAQtRggARCaGCEECyAAIAQ2AgAgACAEIAJBAnRqIgI2AgggACACNgIEIAAQthggBCABQQJ0ajYCACAFQRBqJAAgAAs3AQJ/IAAQtRghAyAAKAIIIQIDQCADIAIQqgEQnRggACAAKAIIQQRqIgI2AgggAUF/aiIBDQALC1wBAX8gABCPFyAAEJkYIAAoAgAgACgCBCABQQRqIgIQoQYgACACEKIGIABBBGogAUEIahCiBiAAEJsYIAEQthgQogYgASABKAIENgIAIAAgABDQAxCcGCAAEMUFCyMAIAAQtxggACgCAARAIAAQtRggACgCACAAELgYEKgYCyAACx0AIAAgARCqARDlBRogAEEEaiACEKoBEK4GGiAACwoAIABBDGoQsAYLCgAgAEEMahDMBQsMACAAIAAoAgQQuRgLEwAgABC6GCgCACAAKAIAa0ECdQsJACAAIAEQuxgLCgAgAEEMahDMBQs1AQJ/A0AgACgCCCABRkUEQCAAELUYIQIgACAAKAIIQXxqIgM2AgggAiADEKoBEMsFDAELCwsPACAAIAEQqgEQrgYaIAALBwAgABC+GAsQACAAKAIAEKoBEL0EEL8YCwoAIAAQqgEQwBgLOAECfyAAKAIAIAAoAggiAkEBdWohASAAKAIEIQAgASACQQFxBH8gASgCACAAaigCAAUgAAsRBAALCQAgACABEKcVCw0AIAAQxxgQyBhBcGoLKgEBf0EBIQEgAEECTwR/IABBAWoQyRgiACAAQX9qIgAgAEECRhsFIAELCwsAIAAgAUEAEMoYCwwAIAAQzAUgATYCAAsTACAAEMwFIAFBgICAgHhyNgIICwcAIAAQzAULBwAgABCrBgsKACAAQQNqQXxxCx8AIAAQrAYgAUkEQEHg6wEQ8QUACyABQQJ0QQQQ8gULCQAgACABEKIGCx0AIAAgARCqARDyDBogAEEEaiACEKoBEPIMGiAACzIAIAAQzBUgABDUCQRAIAAQ1QkgABDWCSAAEPATQQFqEJ8HIABBABCHCiAAQQAQggoLCwkAIAAgARDPGAsRACABENUJ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A1AhAwsgCkL///////8/g0KAgICAgIDAAIQiCiALQv///////z+DQoCAgICAgMAAhCINfSAEIANUrX0iDEJ/VSEHIAQgA30hCyAGIAhKBEADQAJ+IAdBAXEEQCALIAyEUARAIAVBIGogASACQgBCABCSEyAFKQMoIQIgBSkDICEEDAULIAxCAYYhDCALQj+IDAELIARCP4ghDCAEIQsgCkIBhgsgDIQiCiANfSALQgGGIgQgA1StfSIMQn9VIQcgBCADfSELIAZBf2oiBiAISg0ACyAIIQYLAkAgB0UNACALIgQgDCIKhEIAUg0AIAVBMGogASACQgBCABCSEyAFKQM4IQIgBSkDMCEEDAELIApC////////P1gEQANAIARCP4ghAyAGQX9qIQYgBEIBhiEEIAMgCkIBhoQiCkKAgICAgIDAAFQNAAsLIAlBgIACcSEHIAZBAEwEQCAFQUBrIAQgCkL///////8/gyAGQfgAaiAHcq1CMIaEQgBCgICAgICAwMM/EJITIAUpA0ghAiAFKQNAIQQMAQsgCkL///////8/gyAGIAdyrUIwhoQhAgsgACAENwMAIAAgAjcDCCAFQYABaiQAC+YDAwN/AX4GfAJAAkACQAJAIAC9IgRCAFkEQCAEQiCIpyIBQf//P0sNAQsgBEL///////////8Ag1AEQEQAAAAAAADwvyAAIACiow8LIARCf1UNASAAIAChRAAAAAAAAAAAow8LIAFB//+//wdLDQJBgIDA/wMhAkGBeCEDIAFBgIDA/wNHBEAgASECDAILIASnDQFEAAAAAAAAAAAPCyAARAAAAAAAAFBDor0iBEIgiKchAkHLdyEDCyADIAJB4r4laiIBQRR2arciCUQAYJ9QE0TTP6IiBSAEQv////8PgyABQf//P3FBnsGa/wNqrUIghoS/RAAAAAAAAPC/oCIAIAAgAEQAAAAAAADgP6KiIgehvUKAgICAcIO/IghEAAAgFXvL2z+iIgagIgogBiAFIAqhoCAAIABEAAAAAAAAAECgoyIFIAcgBSAFoiIGIAaiIgUgBSAFRJ/GeNAJmsM/okSveI4dxXHMP6CiRAT6l5mZmdk/oKIgBiAFIAUgBUREUj7fEvHCP6JE3gPLlmRGxz+gokRZkyKUJEnSP6CiRJNVVVVVVeU/oKKgoKIgACAIoSAHoaAiAEQA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aiEDIARBfGoiBEEDSw0ACyACQQNxIQILIAJFDQADQCADIAEtAAA6AAAgA0EBaiEDIAFBAWohASACQX9qIgINAAsLIAALHwBBpKUDKAIARQRAQailAyABNgIAQaSlAyAANgIACwsEACMACxAAIwAgAGtBcHEiACQAIAALBgAgACQACwYAIABAAAsJACABIAARAAALCQAgASAAEQQACwcAIAARAQALCwAgASACIAARAgALDwAgASACIAMgBCAAEQwACw0AIAEgAiADIAARBgALCwAgASACIAARAwALCwAgASACIAAREQALDwAgASACIAMgBCAAERkACw0AIAEgAiADIAARFAALCQAgASAAERAACwsAIAEgAiAAEQ0ACw0AIAEgAiADIAARGgALDQAgASACIAMgABEbAAsLACABIAIgABEYAAsPACABIAIgAyAEIAARYgALEQAgASACIAMgBCAFIAARYwALDwAgASACIAMgBCAAEUAACxEAIAEgAiADIAQgBSAAEUEACxMAIAEgAiADIAQgBSAGIAARQgALDwAgASACIAMgBCAAEUMACw8AIAEgAiADIAQgABEfAAsPACABIAIgAyAEIAARRgALDQAgASACIAMgABEpAAsNACABIAIgAyAAESoACw0AIAEgAiADIAARBQALEQAgASACIAMgBCAFIAARPwALEQAgASACIAMgBCAFIAARIwALEwAgASACIAMgBCAFIAYgABEeAAsTACABIAIgAyAEIAUgBiAAEWQACxMAIAEgAiADIAQgBSAGIAARZQALFwAgASACIAMgBCAFIAYgByAIIAARZwALDQAgASACIAMgABFhAAsJACABIAAREgALEwAgASACIAMgBCAFIAYgABEvAAsLACABIAIgABEVAAsPACABIAIgAyAEIAARIgALDQAgASACIAMgABEmAAsNACABIAIgAyAAEUkACwkAIAEgABEdAAsPACABIAIgAyAEIAARTwALEwAgASACIAMgBCAFIAYgABE0AAsNACABIAIgAyAAEVMACxEAIAEgAiADIAQgBSAAEVsACw8AIAEgAiADIAQgABFYAAsPACABIAIgAyAEIAARUgALEQAgASACIAMgBCAFIAARVQALEwAgASACIAMgBCAFIAYgABFWAAsRACABIAIgAyAEIAUgABE4AAsTACABIAIgAyAEIAUgBiAAETkACxUAIAEgAiADIAQgBSAGIAcgABE6AAsRACABIAIgAyAEIAUgABE8AAsPACABIAIgAyAEIAAROwALDwAgASACIAMgBCAAEQgACxMAIAEgAiADIAQgBSAGIAARNgALFQAgASACIAMgBCAFIAYgByAAEVoACxUAIAEgAiADIAQgBSAGIAcgABFfAAsVACABIAIgAyAEIAUgBiAHIAARXQALGQAgASACIAMgBCAFIAYgByAIIAkgABFgAAsPACABIAIgAyAEIAARVAALFQAgASACIAMgBCAFIAYgByAAEVcACxEAIAEgAiADIAQgBSAAES4ACw8AIAEgAiADIAQgABE3AAsRACABIAIgAyAEIAUgABEPAAsPACABIAIgAyAEIAARRwALCwAgASACIAARKAALEQAgASACIAMgBCAFIAARUAALFQAgASACIAMgBCAFIAYgByAAETMACw0AIAEgAiADIAARagALDwAgASACIAMgBCAAETUACw8AIAEgAiADIAQgABFuAAsRACABIAIgAyAEIAUgABEwAAsTACABIAIgAyAEIAUgBiAAEWYACxEAIAEgAiADIAQgBSAAETEACxMAIAEgAiADIAQgBSAGIAARWQALFQAgASACIAMgBCAFIAYgByAAEV4ACxMAIAEgAiADIAQgBSAGIAARXAALCwAgASACIAARSgALCQAgASAAEUwACwcAIAARCQALEQAgASACIAMgBCAFIAARJQALDQAgASACIAMgABEhAAsTACABIAIgAyAEIAUgBiAAEUsACxEAIAEgAiADIAQgBSAAEQsACxcAIAEgAiADIAQgBSAGIAcgCCAAEQ4ACxMAIAEgAiADIAQgBSAGIAARBwALEQAgASACIAMgBCAFIAARJwALEQAgASACIAMgBCAFIAARLAALEwAgASACIAMgBCAFIAYgABFFAAsVACABIAIgAyAEIAUgBiAHIAARFgALFQAgASACIAMgBCAFIAYgByAAESsACxMAIAEgAiADIAQgBSAGIAARCgALGQAgACABIAIgA60gBK1CIIaEIAUgBhCGGwsiAQF+IAAgASACrSADrUIghoQgBBCHGyIFQiCIpxApIAWnCxkAIAAgASACIAMgBCAFrSAGrUIghoQQjBsLIwAgACABIAIgAyAEIAWtIAatQiCGhCAHrSAIrUIghoQQjhsLJQAgACABIAIgAyAEIAUgBq0gB61CIIaEIAitIAmtQiCGhBCQGwsTACAAIAGnIAFCIIinIAIgAxAqCwvuywJUAEGACAvgEVZlY3RvckludABWZWN0b3JEb3VibGUAVmVjdG9yQ2hhcgBWZWN0b3JVQ2hhcgBWZWN0b3JGbG9hdAB2ZWN0b3JUb29scwBjbGVhclZlY3RvckRibABjbGVhclZlY3RvckZsb2F0AG1heGlTZXR0aW5ncwBzZXR1cABzYW1wbGVSYXRlAGNoYW5uZWxzAGJ1ZmZlclNpemUAbWF4aU9zYwBzaW5ld2F2ZQBjb3N3YXZlAHBoYXNvcgBzYXcAdHJpYW5nbGUAc3F1YXJlAHB1bHNlAGltcHVsc2UAbm9pc2UAc2luZWJ1ZgBzaW5lYnVmNABzYXduAHBoYXNlUmVzZXQAbWF4aUVudmVsb3BlAGxpbmUAdHJpZ2dlcgBhbXBsaXR1ZGUAdmFsaW5kZXgAbWF4aURlbGF5bGluZQBkbABtYXhpRmlsdGVyAGxvcmVzAGhpcmVzAGJhbmRwYXNzAGxvcGFzcwBoaXBhc3MAY3V0b2ZmAHJlc29uYW5jZQBtYXhpTWl4AHN0ZXJlbwBxdWFkAGFtYmlzb25pYwBtYXhpTGluZQBwbGF5AHByZXBhcmUAdHJpZ2dlckVuYWJsZQBpc0xpbmVDb21wbGV0ZQBtYXhpWEZhZGUAeGZhZGUAbWF4aUxhZ0V4cABpbml0AGFkZFNhbXBsZQB2YWx1ZQBhbHBoYQBhbHBoYVJlY2lwcm9jYWwAdmFsAG1heGlTYW1wbGUAZ2V0TGVuZ3RoAHNldFNhbXBsZQBzZXRTYW1wbGVGcm9tT2dnQmxvYgBpc1JlYWR5AHBsYXlPbmNlAHBsYXlPblpYAHBsYXk0AGNsZWFyAG5vcm1hbGlzZQBhdXRvVHJpbQBsb2FkAHJlYWQAbG9vcFNldFBvc09uWlgAbWF4aU1hcABsaW5saW4AbGluZXhwAGV4cGxpbgBjbGFtcABtYXhpRHluAGdhdGUAY29tcHJlc3NvcgBjb21wcmVzcwBzZXRBdHRhY2sAc2V0UmVsZWFzZQBzZXRUaHJlc2hvbGQAc2V0UmF0aW8AbWF4aUVudgBhcgBhZHNyAHNldERlY2F5AHNldFN1c3RhaW4AY29udmVydABtdG9mAG1zVG9TYW1wcwBtYXhpU2FtcGxlQW5kSG9sZABzYWgAbWF4aURpc3RvcnRpb24AZmFzdEF0YW4AYXRhbkRpc3QAZmFzdEF0YW5EaXN0AG1heGlGbGFuZ2VyAGZsYW5nZQBtYXhpQ2hvcnVzAGNob3J1cwBtYXhpRENCbG9ja2VyAG1heGlTVkYAc2V0Q3V0b2ZmAHNldFJlc29uYW5jZQBtYXhpTWF0aABhZGQAc3ViAG11bABkaXYAZ3QAbHQAZ3RlAGx0ZQBtb2QAYWJzAHBvdwBtYXhpQ2xvY2sAdGlja2VyAHNldFRlbXBvAHNldFRpY2tzUGVyQmVhdABpc1RpY2sAY3VycmVudENvdW50AHBsYXlIZWFkAGJwcwBicG0AdGljawB0aWNrcwBtYXhpS3VyYW1vdG9Pc2NpbGxhdG9yAHNldFBoYXNlAGdldFBoYXNlAG1heGlLdXJhbW90b09zY2lsbGF0b3JTZXQAc2V0UGhhc2VzAHNpemUAbWF4aUFzeW5jS3VyYW1vdG9Pc2NpbGxhdG9yAG1heGlGRlQAcHJvY2VzcwBzcGVjdHJhbEZsYXRuZXNzAHNwZWN0cmFsQ2VudHJvaWQAZ2V0TWFnbml0dWRlcwBnZXRNYWduaXR1ZGVzREIAZ2V0UGhhc2VzAGdldE51bUJpbnMAZ2V0RkZUU2l6ZQBnZXRIb3BTaXplAGdldFdpbmRvd1NpemUAbWF4aUZGVE1vZGVzAFdJVEhfUE9MQVJfQ09OVkVSU0lPTgBOT19QT0xBUl9DT05WRVJTSU9OAG1heGlJRkZUAG1heGlJRkZUTW9kZXMAU1BFQ1RSVU0AQ09NUExFWABtYXhpTUZDQwBtZmNjAG1heGlUaW1lU3RyZXRjaABzaGFyZWRfcHRyPG1heGlUaW1lc3RyZXRjaDxoYW5uV2luRnVuY3Rvcj4gPgBnZXROb3JtYWxpc2VkUG9zaXRpb24AZ2V0UG9zaXRpb24Ac2V0UG9zaXRpb24AcGxheUF0UG9zaXRpb24AbWF4aVBpdGNoU2hpZnQAc2hhcmVkX3B0cjxtYXhpUGl0Y2hTaGlmdDxoYW5uV2luRnVuY3Rvcj4gPgBtYXhpU3RyZXRjaABzZXRMb29wU3RhcnQAc2V0TG9vcEVuZABnZXRMb29wRW5kAG1heGlCaXRzAHNpZwBhdABzaGwAc2hyAHIAbGFuZABsb3IAbHhvcgBuZWcAaW5jAGRlYwBlcQB0b1NpZ25hbAB0b1RyaWdTaWduYWwAZnJvbVNpZ25hbABtYXhpVHJpZ2dlcgBvblpYAG9uQ2hhbmdlZABtYXhpQ291bnRlcgBjb3VudABtYXhpSW5kZXgAcHVsbABhbGxvY2F0b3I8VD46OmFsbG9jYXRlKHNpemVfdCBuKSAnbicgZXhjZWVkcyBtYXhpbXVtIHN1cHBvcnRlZCBzaXplAHB1c2hfYmFjawByZXNpemUAZ2V0AHNldABOU3QzX18yNnZlY3RvcklpTlNfOWFsbG9jYXRvcklpRUVFRQBOU3QzX18yMTNfX3ZlY3Rvcl9iYXNlSWlOU185YWxsb2NhdG9ySWlFRUVFAE5TdDNfXzIyMF9fdmVjdG9yX2Jhc2VfY29tbW9uSUxiMUVFRQAAAJh6AAD1CwAAHHsAAMkLAAAAAAAAAQAAABwMAAAAAAAAHHsAAKULAAAAAAAAAQAAACQMAAAAAAAAUE5TdDNfXzI2dmVjdG9ySWlOU185YWxsb2NhdG9ySWlFRUVFAAAAAHh7AABUDAAAAAAAADwMAABQS05TdDNfXzI2dmVjdG9ySWlOU185YWxsb2NhdG9ySWlFRUVFAAAAeHsAAIwMAAABAAAAPAwAAGlpAHYAdmkAfAwAAKB5AAB8DAAAAHoAAHZpaWkAQfAZC1CgeQAAfAwAACR6AAAAegAAdmlpaWkAAAAkegAAtAwAAGlpaQA0DQAAPAwAACR6AABOMTBlbXNjcmlwdGVuM3ZhbEUAAJh6AAAgDQAAaWlpaQBB0BoL5gS4eQAAPAwAACR6AAAAegAAaWlpaWkATlN0M19fMjZ2ZWN0b3JJZE5TXzlhbGxvY2F0b3JJZEVFRUUATlN0M19fMjEzX192ZWN0b3JfYmFzZUlkTlNfOWFsbG9jYXRvcklkRUVFRQAAABx7AACKDQAAAAAAAAEAAAAcDAAAAAAAABx7AABmDQAAAAAAAAEAAAC4DQAAAAAAAFBOU3QzX18yNnZlY3RvcklkTlNfOWFsbG9jYXRvcklkRUVFRQAAAAB4ewAA6A0AAAAAAADQDQAAUEtOU3QzX18yNnZlY3RvcklkTlNfOWFsbG9jYXRvcklkRUVFRQAAAHh7AAAgDgAAAQAAANANAAAQ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AAABAAAAnCMAALAjAACgeQAAsCMAAAB6AAAAegAAAHoAQYDIAAviDTB6AACwIwAAqBEAAKgRAAAsJAAATjhtYXhpSUZGVDhmZnRNb2Rlc0UAAAAATHoAABQkAABmaWlpaWkAMTZtYXhpTUZDQ0FuYWx5c2VySWRFAAAAAJh6AAA7JAAAUDE2bWF4aU1GQ0NBbmFseXNlcklkRQAAeHsAAFwkAAAAAAAAVCQAAFBLMTZtYXhpTUZDQ0FuYWx5c2VySWRFAHh7AACEJAAAAQAAAFQkAAB0JAAAoHkAAHQkAAAMegAADHoAAAx6AAA8egAAPHoAAHZpaWlpaWRkAAAAANANAAB0JAAAqBEAADE1bWF4aVRpbWVTdHJldGNoSTE0aGFubldpbkZ1bmN0b3JFAJh6AADkJAAAUDE1bWF4aVRpbWVTdHJldGNoSTE0aGFubldpbkZ1bmN0b3JFAAAAAHh7AAAQJQAAAAAAAAglAABQSzE1bWF4aVRpbWVTdHJldGNoSTE0aGFubldpbkZ1bmN0b3JFAAAAeHsAAEglAAABAAAACCUAAAAAAAA4JgAAMQIAADICAAAzAgAANAIAADUCAABOU3QzX18yMjBfX3NoYXJlZF9wdHJfcG9pbnRlcklQMTVtYXhpVGltZVN0cmV0Y2hJMTRoYW5uV2luRnVuY3RvckVOMTBlbXNjcmlwdGVuMTVzbWFydF9wdHJfdHJhaXRJTlNfMTBzaGFyZWRfcHRySVMzX0VFRTExdmFsX2RlbGV0ZXJFTlNfOWFsbG9jYXRvcklTM19FRUVFAADAegAAnCUAAOB2AABOMTBlbXNjcmlwdGVuMTVzbWFydF9wdHJfdHJhaXRJTlN0M19fMjEwc2hhcmVkX3B0ckkxNW1heGlUaW1lU3RyZXRjaEkxNGhhbm5XaW5GdW5jdG9yRUVFRTExdmFsX2RlbGV0ZXJFAJh6AABEJgAATlN0M19fMjEwc2hhcmVkX3B0ckkxNW1heGlUaW1lU3RyZXRjaEkxNGhhbm5XaW5GdW5jdG9yRUVFAAAAmHoAALQmAABpAAAA8CYAAAAAAAB0JwAANgIAADcCAAA4AgAAOQIAADoCAABOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUkxNW1heGlUaW1lU3RyZXRjaEkxNGhhbm5XaW5GdW5jdG9yRU5TXzlhbGxvY2F0b3JJUzNfRUVFRQAAwHoAABwnAADgdgAAoHkAADglAACEGAAAPHoAADglAACgeQAAOCUAADx6AAAAAAAA7CcAADsCAAA8AgAAPQIAADltYXhpR3JhaW5JMTRoYW5uV2luRnVuY3RvckUAMTNtYXhpR3JhaW5CYXNlAAAAAJh6AADRJwAAwHoAALQnAADkJwAAAAAAAOQnAAA+AgAAPAIAAD8CAAAAAAAAPHoAADglAAA8egAAPHoAAAB6AAA8egAAZGlpZGRpZAA8egAAOCUAADx6AAA8egAAAHoAADE0bWF4aVBpdGNoU2hpZnRJMTRoYW5uV2luRnVuY3RvckUAAJh6AABEKAAAUDE0bWF4aVBpdGNoU2hpZnRJMTRoYW5uV2luRnVuY3RvckUAeHsAAHAoAAAAAAAAaCgAAFBLMTRtYXhpUGl0Y2hTaGlmdEkxNGhhbm5XaW5GdW5jdG9yRQAAAAB4ewAApCgAAAEAAABoKAAAAAAAAJQpAABAAgAAQQIAAEICAABDAgAARAIAAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9wb2ludGVySVAxNG1heGlQaXRjaFNoaWZ0STE0aGFubldpbkZ1bmN0b3JFTjEwZW1zY3JpcHRlbjE1c21hcnRfcHRyX3RyYWl0SU5TXzEwc2hhcmVkX3B0cklTM19FRUUxMXZhbF9kZWxldGVyRU5TXzlhbGxvY2F0b3JJUzNfRUVFRQAAAMB6AAD4KAAA4HYAAE4xMGVtc2NyaXB0ZW4xNXNtYXJ0X3B0cl90cmFpdElOU3QzX18yMTBzaGFyZWRfcHRySTE0bWF4aVBpdGNoU2hpZnRJMTRoYW5uV2luRnVuY3RvckVFRUUxMXZhbF9kZWxldGVyRQAAmHoAAKApAABOU3QzX18yMTBzaGFyZWRfcHRySTE0bWF4aVBpdGNoU2hpZnRJMTRoYW5uV2luRnVuY3RvckVFRQAAAACYegAAECoAAEwqAAAAAAAAzCoAAEUCAABGAgAARwIAADkCAABIAgAATlN0M19fMjIwX19zaGFyZWRfcHRyX2VtcGxhY2VJMTRtYXhpUGl0Y2hTaGlmdEkxNGhhbm5XaW5GdW5jdG9yRU5TXzlhbGxvY2F0b3JJUzNfRUVFRQAAAMB6AAB0KgAA4HYAAKB5AACUKAAAhBgAQfDVAAvSATx6AACUKAAAPHoAADx6AAAAegAAPHoAADExbWF4aVN0cmV0Y2hJMTRoYW5uV2luRnVuY3RvckUAmHoAAAgrAABQMTFtYXhpU3RyZXRjaEkxNGhhbm5XaW5GdW5jdG9yRQAAAAB4ewAAMCsAAAAAAAAoKwAAUEsxMW1heGlTdHJldGNoSTE0aGFubldpbkZ1bmN0b3JFAAAAeHsAAGQrAAABAAAAKCsAAFQrAACgeQAAVCsAAIQYAAA8egAAVCsAAKB5AABUKwAAPHoAACR6AABUKwBB0NcACyQ8egAAVCsAADx6AAA8egAAPHoAAAB6AAA8egAAZGlpZGRkaWQAQYDYAAviAzx6AABUKwAAPHoAADx6AAA8egAAAHoAAGRpaWRkZGkAOG1heGlCaXRzAAAAmHoAACAsAABQOG1heGlCaXRzAAB4ewAANCwAAAAAAAAsLAAAUEs4bWF4aUJpdHMAeHsAAFAsAAABAAAALCwAAAx6AAAMegAADHoAAAx6AAAMegAADHoAAAx6AAAMegAADHoAAAx6AAA8egAADHoAAAx6AAA8egAAaWlkADExbWF4aVRyaWdnZXIAAACYegAAqCwAAFAxMW1heGlUcmlnZ2VyAAB4ewAAwCwAAAAAAAC4LAAAUEsxMW1heGlUcmlnZ2VyAHh7AADgLAAAAQAAALgsAADQLAAAPHoAANAsAAA8egAAPHoAANAsAAA8egAAPHoAADExbWF4aUNvdW50ZXIAAACYegAAIC0AAFAxMW1heGlDb3VudGVyAAB4ewAAOC0AAAAAAAAwLQAAUEsxMW1heGlDb3VudGVyAHh7AABYLQAAAQAAADAtAABILQAAAAAAADx6AABILQAAPHoAADx6AAA5bWF4aUluZGV4AACYegAAkC0AAFA5bWF4aUluZGV4AHh7AACkLQAAAAAAAJwtAABQSzltYXhpSW5kZXgAAAAAeHsAAMAtAAABAAAAnC0AALAtAEHw2wAL5wc8egAAsC0AADx6AAA8egAA0A0AAApjaGFubmVscyA9ICVkCmxlbmd0aCA9ICVkAExvYWRpbmc6IABkYXRhAENoOiAALCBsZW46IABFUlJPUjogQ291bGQgbm90IGxvYWQgc2FtcGxlLgBBdXRvdHJpbTogc3RhcnQ6IAAsIGVuZDogAABsAAAAAAAAAAQvAABMAgAATQIAAJT///+U////BC8AAE4CAABPAgAAgC4AALguAADMLgAAlC4AAGwAAAAAAAAAJEkAAFACAABRAgAAlP///5T///8kSQAAUgIAAFMCAABOU3QzX18yMTRiYXNpY19pZnN0cmVhbUljTlNfMTFjaGFyX3RyYWl0c0ljRUVFRQDAegAA1C4AACRJAAAAAAAAgC8AAFQCAABVAgAAVgIAAFcCAABYAgAAWQIAAFoCAABbAgAAXAIAAF0CAABeAgAAXwIAAGACAABhAgAATlN0M19fMjEzYmFzaWNfZmlsZWJ1ZkljTlNfMTFjaGFyX3RyYWl0c0ljRUVFRQAAwHoAAFAvAACwSAAAYWxsb2NhdG9yPFQ+OjphbGxvY2F0ZShzaXplX3QgbikgJ24nIGV4Y2VlZHMgbWF4aW11bSBzdXBwb3J0ZWQgc2l6ZQB3AGEAcgByKwB3KwBhKwB3YgBhYgByYgByK2IAdytiAGErYgAlZCBpcyBub3QgYSBwb3dlciBvZiB0d28KAEVycm9yOiBGRlQgY2FsbGVkIHdpdGggc2l6ZSAlZAoAZi0+YWxsb2MuYWxsb2NfYnVmZmVyX2xlbmd0aF9pbl9ieXRlcyA9PSBmLT50ZW1wX29mZnNldAAuLi8uLi9zcmMvbGlicy9zdGJfdm9yYmlzLmMAdm9yYmlzX2RlY29kZV9pbml0aWFsAGYtPmJ5dGVzX2luX3NlZyA+IDAAZ2V0OF9wYWNrZXRfcmF3AGYtPmJ5dGVzX2luX3NlZyA9PSAwAG5leHRfc2VnbWVudAAAAAABAgIDAwMDBAQEBAQEBAQAAQAAgAAAAFYAAABAAAAAdm9yYmlzX2RlY29kZV9wYWNrZXRfcmVzdABjLT5zb3J0ZWRfY29kZXdvcmRzIHx8IGMtPmNvZGV3b3JkcwBjb2RlYm9va19kZWNvZGVfc2NhbGFyX3JhdwAhYy0+c3BhcnNlACFjLT5zcGFyc2UgfHwgeiA8IGMtPnNvcnRlZF9lbnRyaWVzAGNvZGVib29rX2RlY29kZV9kZWludGVybGVhdmVfcmVwZWF0AHogPCBjLT5zb3J0ZWRfZW50cmllcwBjb2RlYm9va19kZWNvZGVfc3RhcnQAQeDjAAv4Cj605DMJkfMzi7IBNDwgCjQjGhM0YKkcNKfXJjRLrzE0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AACwSwAA7EgAQeCXAQvjBP////////////////////////////////////////////////////////////////8AAQIDBAUGBwgJ/////////woLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIj////////CgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiP/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AAECBAcDBgUAAAAAAAAAAgAAwAMAAMAEAADABQAAwAYAAMAHAADACAAAwAkAAMAKAADACwAAwAwAAMANAADADgAAwA8AAMAQAADAEQAAwBIAAMATAADAFAAAwBUAAMAWAADAFwAAwBgAAMAZAADAGgAAwBsAAMAcAADAHQAAwB4AAMAfAADAAAAAswEAAMMCAADDAwAAwwQAAMMFAADDBgAAwwcAAMMIAADDCQAAwwoAAMMLAADDDAAAww0AANMOAADDDwAAwwAADLsBAAzDAgAMwwMADMMEAAzTaW5maW5pdHkAbmFuAAAAAAAAAADRdJ4AV529KoBwUg///z4nCgAAAGQAAADoAwAAECcAAKCGAQBAQg8AgJaYAADh9QUYAAAANQAAAHEAAABr////zvv//5K///8AAAAAAAAAAN4SBJUAAAAA////////////////IE4AABQAAABDLlVURi04AEHonAELAjROAEGAnQELBkxDX0FMTABBkJ0BC25MQ19DVFlQRQAAAABMQ19OVU1FUklDAABMQ19USU1FAAAAAABMQ19DT0xMQVRFAABMQ19NT05FVEFSWQBMQ19NRVNTQUdFUwBMQU5HAEMuVVRGLTgAUE9TSVgATVVTTF9MT0NQQVRIAAAAAAAAUABBgKABC/8BAgACAAIAAgACAAIAAgACAAIAAyACIAIgAiACIAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAFgBMAEwATABMAEwATABMAEwATABMAEwATABMAEwATACNgI2AjYCNgI2AjYCNgI2AjYCNgEwATABMAEwATA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ZCBjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaG9ydD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgc2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgaW50PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDE2X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8ZmxvYXQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGRvdWJsZT4ATlN0M19fMjEyYmFzaWNfc3RyaW5nSWhOU18xMWNoYXJfdHJhaXRzSWhFRU5TXzlhbGxvY2F0b3JJaEVFRUUAAAAAHHsAAKJ+AAAAAAAAAQAAANgZAAAAAAAATlN0M19fMjEyYmFzaWNfc3RyaW5nSXdOU18xMWNoYXJfdHJhaXRzSXdFRU5TXzlhbGxvY2F0b3JJd0VFRUUAABx7AAD8fgAAAAAAAAEAAADYGQAAAAAAAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0lEc05TXzExY2hhcl90cmFpdHNJRHNFRU5TXzlhbGxvY2F0b3JJRHNFRUVFAAAAHHsAAFR/AAAAAAAAAQAAANgZAAAAAAAATlN0M19fMjEyYmFzaWNfc3RyaW5nSURpTlNfMTFjaGFyX3RyYWl0c0lEaUVFTlNfOWFsbG9jYXRvcklEaUVFRUUAAAAcewAAsH8AAAAAAAABAAAA2BkAAAAAAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0ljRUUAAJh6AAAMgAAATjEwZW1zY3JpcHRlbjExbWVtb3J5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';
if (!isDataURI(wasmBinaryFile)) {
  wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinary() {
  try {
    if (wasmBinary) {
      return new Uint8Array(wasmBinary);
    }

    var binary = tryParseAsDataURI(wasmBinaryFile);
    if (binary) {
      return binary;
    }
    if (readBinary) {
      return readBinary(wasmBinaryFile);
    } else {
      throw "sync fetching of the wasm failed: you can preload it to Module['wasmBinary'] manually, or emcc.py will do that for you when generating HTML (but not JS)";
    }
  }
  catch (err) {
    abort(err);
  }
}

function getBinaryPromise() {
  // if we don't have the binary yet, and have the Fetch api, use that
  // in some environments, like Electron's render process, Fetch api may be present, but have a different context than expected, let's only use it on the Web
  if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === 'function') {
    return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function(response) {
      if (!response['ok']) {
        throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
      }
      return response['arrayBuffer']();
    }).catch(function () {
      return getBinary();
    });
  }
  // Otherwise, getBinary should be able to get it synchronously
  return new Promise(function(resolve, reject) {
    resolve(getBinary());
  });
}



// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm() {
  // prepare imports
  var info = {
    'env': asmLibraryArg,
    'wasi_snapshot_preview1': asmLibraryArg
  };
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/
  function receiveInstance(instance, module) {
    var exports = instance.exports;
    Module['asm'] = exports;
    removeRunDependency('wasm-instantiate');
  }
   // we can't run yet (except in a pthread, where we have a custom sync instantiator)
  addRunDependency('wasm-instantiate');


  function receiveInstantiatedSource(output) {
    // 'output' is a WebAssemblyInstantiatedSource object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
      // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
      // When the regression is fixed, can restore the above USE_PTHREADS-enabled path.
    receiveInstance(output['instance']);
  }


  function instantiateArrayBuffer(receiver) {
    return getBinaryPromise().then(function(binary) {
      return WebAssembly.instantiate(binary, info);
    }).then(receiver, function(reason) {
      err('failed to asynchronously prepare wasm: ' + reason);
      abort(reason);
    });
  }

  // Prefer streaming instantiation if available.
  function instantiateSync() {
    var instance;
    var module;
    var binary;
    try {
      binary = getBinary();
      module = new WebAssembly.Module(binary);
      instance = new WebAssembly.Instance(module, info);
    } catch (e) {
      var str = e.toString();
      err('failed to compile wasm module: ' + str);
      if (str.indexOf('imported Memory') >= 0 ||
          str.indexOf('memory import') >= 0) {
        err('Memory size incompatibility issues may be due to changing TOTAL_MEMORY at runtime to something too large. Use ALLOW_MEMORY_GROWTH to allow any size memory (and also make sure not to set TOTAL_MEMORY at runtime to something smaller than it was at compile time).');
      }
      throw e;
    }
    receiveInstance(instance, module);
  }
  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
  // to any other async startup actions they are performing.
  if (Module['instantiateWasm']) {
    try {
      var exports = Module['instantiateWasm'](info, receiveInstance);
      return exports;
    } catch(e) {
      err('Module.instantiateWasm callback failed with error: ' + e);
      return false;
    }
  }

  instantiateSync();
  return Module['asm']; // exports were assigned here
}


// Globals used by JS i64 conversions
var tempDouble;
var tempI64;

// === Body ===

var ASM_CONSTS = {
  
};




// STATICTOP = STATIC_BASE + 53072;
/* global initializers */  __ATINIT__.push({ func: function() { ___wasm_call_ctors() } });




/* no memory initializer */
// {{PRE_LIBRARY}}


  function demangle(func) {
      return func;
    }

  function demangleAll(text) {
      var regex =
        /\b_Z[\w\d_]+/g;
      return text.replace(regex,
        function(x) {
          var y = demangle(x);
          return x === y ? x : (y + ' [' + x + ']');
        });
    }

  function jsStackTrace() {
      var err = new Error();
      if (!err.stack) {
        // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
        // so try that as a special-case.
        try {
          throw new Error();
        } catch(e) {
          err = e;
        }
        if (!err.stack) {
          return '(no stack trace available)';
        }
      }
      return err.stack.toString();
    }

  function stackTrace() {
      var js = jsStackTrace();
      if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
      return demangleAll(js);
    }

  function ___assert_fail(condition, filename, line, func) {
      abort('Assertion failed: ' + UTF8ToString(condition) + ', at: ' + [filename ? UTF8ToString(filename) : 'unknown filename', line, func ? UTF8ToString(func) : 'unknown function']);
    }

  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }

  
  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }function ___cxa_atexit(
  ) {
  return _atexit.apply(null, arguments)
  }

  
  var ___exception_infos={};
  
  var ___exception_last=0;function ___cxa_throw(ptr, type, destructor) {
      ___exception_infos[ptr] = {
        ptr: ptr,
        adjusted: [ptr],
        type: type,
        destructor: destructor,
        refcount: 0,
        caught: false,
        rethrown: false
      };
      ___exception_last = ptr;
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exceptions = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exceptions++;
      }
      throw ptr;
    }

  function ___lock() {}

  
  function ___setErrNo(value) {
      if (Module['___errno_location']) HEAP32[((Module['___errno_location']())>>2)]=value;
      return value;
    }function ___map_file(pathname, size) {
      ___setErrNo(63);
      return -1;
    }

  
  
  var PATH={splitPath:function(filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function(parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up; up--) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function(path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function(path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function(path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function(path) {
        return PATH.splitPath(path)[3];
      },join:function() {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function(l, r) {
        return PATH.normalize(l + '/' + r);
      }};
  
  
  var PATH_FS={resolve:function() {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            return ''; // an invalid portion invalidates the whole thing
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function(from, to) {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function(dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function(stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(43);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function(stream) {
          // flush any pending line data
          stream.tty.ops.flush(stream.tty);
        },flush:function(stream) {
          stream.tty.ops.flush(stream.tty);
        },read:function(stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(60);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(29);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(6);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function(stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(60);
          }
          try {
            for (var i = 0; i < length; i++) {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            }
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function(tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              // we will read data by chunks of BUFSIZE
              var BUFSIZE = 256;
              var buf = Buffer.alloc ? Buffer.alloc(BUFSIZE) : new Buffer(BUFSIZE);
              var bytesRead = 0;
  
              try {
                bytesRead = nodeFS.readSync(process.stdin.fd, buf, 0, BUFSIZE, null);
              } catch(e) {
                // Cross-platform differences: on Windows, reading EOF throws an exception, but on other OSes,
                // reading EOF returns 0. Uniformize behavior by treating the EOF exception to return 0.
                if (e.toString().indexOf('EOF') != -1) bytesRead = 0;
                else throw e;
              }
  
              if (bytesRead > 0) {
                result = buf.slice(0, bytesRead).toString('utf-8');
              } else {
                result = null;
              }
            } else
            if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function(tty, val) {
          if (val === null || val === 10) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        },flush:function(tty) {
          if (tty.output && tty.output.length > 0) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }},default_tty1_ops:{put_char:function(tty, val) {
          if (val === null || val === 10) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },flush:function(tty) {
          if (tty.output && tty.output.length > 0) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }}};
  
  var MEMFS={ops_table:null,mount:function(mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(63);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap,
                msync: MEMFS.stream_ops.msync
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            }
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.length which gives the whole capacity.
          // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
          // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
          // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
          node.contents = null; 
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },getFileDataAsRegularArray:function(node) {
        if (node.contents && node.contents.subarray) {
          var arr = [];
          for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
          return arr; // Returns a copy of the original data.
        }
        return node.contents; // No-op, the file contents are already in a JS array. Return as-is.
      },getFileDataAsTypedArray:function(node) {
        if (!node.contents) return new Uint8Array;
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
        return new Uint8Array(node.contents);
      },expandFileStorage:function(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
        // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
        // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
        // avoid overshooting the allocation cap by a very large margin.
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) | 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity); // Allocate new storage.
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
        return;
      },resizeFileStorage:function(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null; // Fully decommit when requesting a resize to zero.
          node.usedBytes = 0;
          return;
        }
        if (!node.contents || node.contents.subarray) { // Resize a typed array if that is being used as the backing store.
          var oldContents = node.contents;
          node.contents = new Uint8Array(newSize); // Allocate new storage.
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
          }
          node.usedBytes = newSize;
          return;
        }
        // Backing with a JS array.
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize;
      },node_ops:{getattr:function(node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function(node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },lookup:function(parent, name) {
          throw FS.genericErrors[44];
        },mknod:function(parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function(old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(55);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function(parent, name) {
          delete parent.contents[name];
        },rmdir:function(parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(55);
          }
          delete parent.contents[name];
        },readdir:function(node) {
          var entries = ['.', '..'];
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function(parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function(node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(28);
          }
          return node.link;
        }},stream_ops:{read:function(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else {
            for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
          }
          return size;
        },write:function(stream, buffer, offset, length, position, canOwn) {
          // If the buffer is located in main memory (HEAP), and if
          // memory can grow, we can't hold on to references of the
          // memory buffer, as they may get invalidated. That means we
          // need to do copy its contents.
          if (buffer.buffer === HEAP8.buffer) {
            canOwn = false;
          }
  
          if (!length) return 0;
          var node = stream.node;
          node.timestamp = Date.now();
  
          if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
            if (canOwn) {
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
              node.contents = buffer.slice(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
              node.contents.set(buffer.subarray(offset, offset + length), position);
              return length;
            }
          }
  
          // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
          MEMFS.expandFileStorage(node, position+length);
          if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position); // Use typed array write if available.
          else {
            for (var i = 0; i < length; i++) {
             node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
            }
          }
          node.usedBytes = Math.max(node.usedBytes, position+length);
          return length;
        },llseek:function(stream, offset, whence) {
          var position = offset;
          if (whence === 1) {
            position += stream.position;
          } else if (whence === 2) {
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(28);
          }
          return position;
        },allocate:function(stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },mmap:function(stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                contents.buffer === buffer.buffer ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < stream.node.usedBytes) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            // malloc() can lead to growing the heap. If targeting the heap, we need to
            // re-acquire the heap buffer object in case growth had occurred.
            var fromHeap = (buffer.buffer == HEAP8.buffer);
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(48);
            }
            (fromHeap ? HEAP8 : buffer).set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        },msync:function(stream, buffer, offset, length, mmapFlags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          if (mmapFlags & 2) {
            // MAP_PRIVATE calls need not to be synced back to underlying fs
            return 0;
          }
  
          var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          // should we check if bytesWritten and length are the same?
          return 0;
        }}};var FS={root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},filesystems:null,syncFSRequests:0,handleFSError:function(e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function(path, opts) {
        path = PATH_FS.resolve(FS.cwd(), path);
        opts = opts || {};
  
        if (!path) return { path: '', node: null };
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(32);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
  
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(32);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function(node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function(parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function(parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
          throw new FS.ErrnoError(errCode, parent);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function(parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); }
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); }
            }
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function(node) {
        FS.hashRemoveNode(node);
      },isRoot:function(node) {
        return node === node.parent;
      },isMountpoint:function(node) {
        return !!node.mounted;
      },isFile:function(mode) {
        return (mode & 61440) === 32768;
      },isDir:function(mode) {
        return (mode & 61440) === 16384;
      },isLink:function(mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function(mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function(mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function(mode) {
        return (mode & 61440) === 4096;
      },isSocket:function(mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function(str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function(flag) {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function(node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return 2;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return 2;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return 2;
        }
        return 0;
      },mayLookup:function(dir) {
        var errCode = FS.nodePermissions(dir, 'x');
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0;
      },mayCreate:function(dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return 20;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function(dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var errCode = FS.nodePermissions(dir, 'wx');
        if (errCode) {
          return errCode;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return 54;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return 10;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return 31;
          }
        }
        return 0;
      },mayOpen:function(node, flags) {
        if (!node) {
          return 44;
        }
        if (FS.isLink(node.mode)) {
          return 32;
        } else if (FS.isDir(node.mode)) {
          if (FS.flagsToPermissionString(flags) !== 'r' || // opening for write
              (flags & 512)) { // TODO: check for O_SEARCH? (== search for dir only)
            return 31;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function(fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(33);
      },getStream:function(fd) {
        return FS.streams[fd];
      },createStream:function(stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function(fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function(stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function() {
          throw new FS.ErrnoError(70);
        }},major:function(dev) {
        return ((dev) >> 8);
      },minor:function(dev) {
        return ((dev) & 0xff);
      },makedev:function(ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function(dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function(dev) {
        return FS.devices[dev];
      },getMounts:function(mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function(populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        FS.syncFSRequests++;
  
        if (FS.syncFSRequests > 1) {
          err('warning: ' + FS.syncFSRequests + ' FS.syncfs operations in flight at once, probably just doing extra work');
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function doCallback(errCode) {
          FS.syncFSRequests--;
          return callback(errCode);
        }
  
        function done(errCode) {
          if (errCode) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(errCode);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function(type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(10);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(28);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        node.mount.mounts.splice(idx, 1);
      },lookup:function(parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function(path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === '.' || name === '..') {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function(path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function(path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdirTree:function(path, mode) {
        var dirs = path.split('/');
        var d = '';
        for (var i = 0; i < dirs.length; ++i) {
          if (!dirs[i]) continue;
          d += '/' + dirs[i];
          try {
            FS.mkdir(d, mode);
          } catch(e) {
            if (e.errno != 20) throw e;
          }
        }
      },mkdev:function(path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
          throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(10);
        }
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(75);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(28);
        }
        // new path should not be an ancestor of the old path
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(55);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        errCode = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(10);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          errCode = FS.nodePermissions(old_dir, 'w');
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        try {
          if (FS.trackingDelegate['willMovePath']) {
            FS.trackingDelegate['willMovePath'](old_path, new_path);
          }
        } catch(e) {
          err("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
        try {
          if (FS.trackingDelegate['onMovePath']) FS.trackingDelegate['onMovePath'](old_path, new_path);
        } catch(e) {
          err("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
      },rmdir:function(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          err("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          err("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readdir:function(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(54);
        }
        return node.node_ops.readdir(node);
      },unlink:function(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
          // According to POSIX, we should map EISDIR to EPERM, but
          // we instead do what Linux does (and we must, as we use
          // the musl linux libc).
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          err("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          err("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readlink:function(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(28);
        }
        return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
      },stat:function(path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(63);
        }
        return node.node_ops.getattr(node);
      },lstat:function(path) {
        return FS.stat(path, true);
      },chmod:function(path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function(path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function(fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        FS.chmod(stream.node, mode);
      },chown:function(path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function(path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function(fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function(path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.nodePermissions(node, 'w');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function(fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(28);
        }
        FS.truncate(stream.node, len);
      },utime:function(path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function(path, flags, mode, fd_start, fd_end) {
        if (path === "") {
          throw new FS.ErrnoError(44);
        }
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(20);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // if asked only for a directory, then this must be one
        if ((flags & 65536) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(54);
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var errCode = FS.mayOpen(node, flags);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            err("FS.trackingDelegate error on read file: " + path);
          }
        }
        try {
          if (FS.trackingDelegate['onOpenFile']) {
            var trackingFlags = 0;
            if ((flags & 2097155) !== 1) {
              trackingFlags |= FS.tracking.openFlags.READ;
            }
            if ((flags & 2097155) !== 0) {
              trackingFlags |= FS.tracking.openFlags.WRITE;
            }
            FS.trackingDelegate['onOpenFile'](path, trackingFlags);
          }
        } catch(e) {
          err("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: " + e.message);
        }
        return stream;
      },close:function(stream) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (stream.getdents) stream.getdents = null; // free readdir state
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
        stream.fd = null;
      },isClosed:function(stream) {
        return stream.fd === null;
      },llseek:function(stream, offset, whence) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(70);
        }
        if (whence != 0 && whence != 1 && whence != 2) {
          throw new FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },read:function(stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(28);
        }
        var seeking = typeof position !== 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function(stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(28);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position !== 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
          if (stream.path && FS.trackingDelegate['onWriteToFile']) FS.trackingDelegate['onWriteToFile'](stream.path);
        } catch(e) {
          err("FS.trackingDelegate['onWriteToFile']('"+stream.path+"') threw an exception: " + e.message);
        }
        return bytesWritten;
      },allocate:function(stream, offset, length) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(28);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(138);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function(stream, buffer, offset, length, position, prot, flags) {
        // User requests writing to file (prot & PROT_WRITE != 0).
        // Checking if we have permissions to write to the file unless
        // MAP_PRIVATE flag is set. According to POSIX spec it is possible
        // to write to file opened in read-only mode with MAP_PRIVATE flag,
        // as all modifications will be visible only in the memory of
        // the current process.
        if ((prot & 2) !== 0
            && (flags & 2) === 0
            && (stream.flags & 2097155) !== 2) {
          throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(43);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },msync:function(stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      },munmap:function(stream) {
        return 0;
      },ioctl:function(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function(path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = UTF8ArrayToString(buf, 0);
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function(path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data === 'string') {
          var buf = new Uint8Array(lengthBytesUTF8(data)+1);
          var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
          FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
        } else if (ArrayBuffer.isView(data)) {
          FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        } else {
          throw new Error('Unsupported data type');
        }
        FS.close(stream);
      },cwd:function() {
        return FS.currentPath;
      },chdir:function(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
          throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(54);
        }
        var errCode = FS.nodePermissions(lookup.node, 'x');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function() {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },createDefaultDevices:function() {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function(stream, buffer, offset, length, pos) { return length; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        var random_device;
        if (typeof crypto === 'object' && typeof crypto['getRandomValues'] === 'function') {
          // for modern web browsers
          var randomBuffer = new Uint8Array(1);
          random_device = function() { crypto.getRandomValues(randomBuffer); return randomBuffer[0]; };
        } else
        if (ENVIRONMENT_IS_NODE) {
          // for nodejs with or without crypto support included
          try {
            var crypto_module = require('crypto');
            // nodejs has crypto support
            random_device = function() { return crypto_module['randomBytes'](1)[0]; };
          } catch (e) {
            // nodejs doesn't have crypto support
          }
        } else
        {}
        if (!random_device) {
          // we couldn't find a proper implementation, as Math.random() is not suitable for /dev/random, see emscripten-core/emscripten/pull/7096
          random_device = function() { abort("random_device"); };
        }
        FS.createDevice('/dev', 'random', random_device);
        FS.createDevice('/dev', 'urandom', random_device);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createSpecialDirectories:function() {
        // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the name of the stream for fd 6 (see test_unistd_ttyname)
        FS.mkdir('/proc');
        FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount({
          mount: function() {
            var node = FS.createNode('/proc/self', 'fd', 16384 | 511 /* 0777 */, 73);
            node.node_ops = {
              lookup: function(parent, name) {
                var fd = +name;
                var stream = FS.getStream(fd);
                if (!stream) throw new FS.ErrnoError(8);
                var ret = {
                  parent: null,
                  mount: { mountpoint: 'fake' },
                  node_ops: { readlink: function() { return stream.path } }
                };
                ret.parent = ret; // make it look like a simple root node
                return ret;
              }
            };
            return node;
          }
        }, {}, '/proc/self/fd');
      },createStandardStreams:function() {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        var stdout = FS.open('/dev/stdout', 'w');
        var stderr = FS.open('/dev/stderr', 'w');
      },ensureErrnoError:function() {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
          this.node = node;
          this.setErrno = function(errno) {
            this.errno = errno;
          };
          this.setErrno(errno);
          this.message = 'FS error';
  
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [44].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function() {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
  
        FS.filesystems = {
          'MEMFS': MEMFS,
        };
      },init:function(input, output, error) {
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function() {
        FS.init.initialized = false;
        // force-flush all streams, so we get musl std streams printed out
        var fflush = Module['_fflush'];
        if (fflush) fflush(0);
        // close all of our streams
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function(canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function(parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function(relative, base) {
        return PATH_FS.resolve(base, relative);
      },standardizePath:function(path) {
        return PATH.normalize(path);
      },findObject:function(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function(path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function(parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function(parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function(parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function(parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(6);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function(parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (read_) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(read_(obj.url), true);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(29);
        return success;
      },createLazyFile:function(parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = (idx / this.chunkSize)|0;
          return this.getter(chunkNum)[chunkOffset];
        };
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        };
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
  
          var chunkSize = 1024*1024; // Chunk size in bytes
  
          if (!hasByteServing) chunkSize = datalength;
  
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
  
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = this;
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * chunkSize;
            var end = (chunkNum+1) * chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
  
          if (usesGzip || !datalength) {
            // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
            chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
            datalength = this.getter(0).length;
            chunkSize = datalength;
            out("LazyFiles on gzip forces download of the whole file when length is accessed");
          }
  
          this._length = datalength;
          this._chunkSize = chunkSize;
          this.lengthKnown = true;
        };
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperties(lazyArray, {
            length: {
              get: function() {
                if(!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._length;
              }
            },
            chunkSize: {
              get: function() {
                if(!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._chunkSize;
              }
            }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperties(node, {
          usedBytes: {
            get: function() { return this.contents.length; }
          }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(29);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(29);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init(); // XXX perhaps this method should move onto Browser?
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency('cp ' + fullname); // might have several active requests for the same fullname
        function processData(byteArray) {
          function finish(byteArray) {
            if (preFinish) preFinish();
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency(dep);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency(dep);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency(dep);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function() {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function() {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function(paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          out('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function(paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};var SYSCALLS={DEFAULT_POLLMASK:5,mappings:{},umask:511,calculateAt:function(dirfd, path) {
        if (path[0] !== '/') {
          // relative path
          var dir;
          if (dirfd === -100) {
            dir = FS.cwd();
          } else {
            var dirstream = FS.getStream(dirfd);
            if (!dirstream) throw new FS.ErrnoError(8);
            dir = dirstream.path;
          }
          path = PATH.join2(dir, path);
        }
        return path;
      },doStat:function(func, path, buf) {
        try {
          var stat = func(path);
        } catch (e) {
          if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
            // an error occurred while trying to look up the path; we should just report ENOTDIR
            return -54;
          }
          throw e;
        }
        HEAP32[((buf)>>2)]=stat.dev;
        HEAP32[(((buf)+(4))>>2)]=0;
        HEAP32[(((buf)+(8))>>2)]=stat.ino;
        HEAP32[(((buf)+(12))>>2)]=stat.mode;
        HEAP32[(((buf)+(16))>>2)]=stat.nlink;
        HEAP32[(((buf)+(20))>>2)]=stat.uid;
        HEAP32[(((buf)+(24))>>2)]=stat.gid;
        HEAP32[(((buf)+(28))>>2)]=stat.rdev;
        HEAP32[(((buf)+(32))>>2)]=0;
        (tempI64 = [stat.size>>>0,(tempDouble=stat.size,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((buf)+(40))>>2)]=tempI64[0],HEAP32[(((buf)+(44))>>2)]=tempI64[1]);
        HEAP32[(((buf)+(48))>>2)]=4096;
        HEAP32[(((buf)+(52))>>2)]=stat.blocks;
        HEAP32[(((buf)+(56))>>2)]=(stat.atime.getTime() / 1000)|0;
        HEAP32[(((buf)+(60))>>2)]=0;
        HEAP32[(((buf)+(64))>>2)]=(stat.mtime.getTime() / 1000)|0;
        HEAP32[(((buf)+(68))>>2)]=0;
        HEAP32[(((buf)+(72))>>2)]=(stat.ctime.getTime() / 1000)|0;
        HEAP32[(((buf)+(76))>>2)]=0;
        (tempI64 = [stat.ino>>>0,(tempDouble=stat.ino,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((buf)+(80))>>2)]=tempI64[0],HEAP32[(((buf)+(84))>>2)]=tempI64[1]);
        return 0;
      },doMsync:function(addr, stream, len, flags, offset) {
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags);
      },doMkdir:function(path, mode) {
        // remove a trailing slash, if one - /a/b/ has basename of '', but
        // we want to create b in the context of this function
        path = PATH.normalize(path);
        if (path[path.length-1] === '/') path = path.substr(0, path.length-1);
        FS.mkdir(path, mode, 0);
        return 0;
      },doMknod:function(path, mode, dev) {
        // we don't want this in the JS API as it uses mknod to create all nodes.
        switch (mode & 61440) {
          case 32768:
          case 8192:
          case 24576:
          case 4096:
          case 49152:
            break;
          default: return -28;
        }
        FS.mknod(path, mode, dev);
        return 0;
      },doReadlink:function(path, buf, bufsize) {
        if (bufsize <= 0) return -28;
        var ret = FS.readlink(path);
  
        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[buf+len];
        stringToUTF8(ret, buf, bufsize+1);
        // readlink is one of the rare functions that write out a C string, but does never append a null to the output buffer(!)
        // stringToUTF8() always appends a null byte, so restore the character under the null byte after the write.
        HEAP8[buf+len] = endChar;
  
        return len;
      },doAccess:function(path, amode) {
        if (amode & ~7) {
          // need a valid mode
          return -28;
        }
        var node;
        var lookup = FS.lookupPath(path, { follow: true });
        node = lookup.node;
        if (!node) {
          return -44;
        }
        var perms = '';
        if (amode & 4) perms += 'r';
        if (amode & 2) perms += 'w';
        if (amode & 1) perms += 'x';
        if (perms /* otherwise, they've just passed F_OK */ && FS.nodePermissions(node, perms)) {
          return -2;
        }
        return 0;
      },doDup:function(path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest) FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
      },doReadv:function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(((iov)+(i*8))>>2)];
          var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
          var curr = FS.read(stream, HEAP8,ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
          if (curr < len) break; // nothing more to read
        }
        return ret;
      },doWritev:function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(((iov)+(i*8))>>2)];
          var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
          var curr = FS.write(stream, HEAP8,ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
        }
        return ret;
      },varargs:0,get:function(varargs) {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
        return ret;
      },getStr:function() {
        var ret = UTF8ToString(SYSCALLS.get());
        return ret;
      },getStreamFromFD:function(fd) {
        // TODO: when all syscalls use wasi, can remove the next line
        if (fd === undefined) fd = SYSCALLS.get();
        var stream = FS.getStream(fd);
        if (!stream) throw new FS.ErrnoError(8);
        return stream;
      },get64:function() {
        var low = SYSCALLS.get(), high = SYSCALLS.get();
        return low;
      },getZero:function() {
        SYSCALLS.get();
      }};function ___syscall221(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // fcntl64
      var stream = SYSCALLS.getStreamFromFD(), cmd = SYSCALLS.get();
      switch (cmd) {
        case 0: {
          var arg = SYSCALLS.get();
          if (arg < 0) {
            return -28;
          }
          var newStream;
          newStream = FS.open(stream.path, stream.flags, 0, arg);
          return newStream.fd;
        }
        case 1:
        case 2:
          return 0;  // FD_CLOEXEC makes no sense for a single process.
        case 3:
          return stream.flags;
        case 4: {
          var arg = SYSCALLS.get();
          stream.flags |= arg;
          return 0;
        }
        case 12:
        /* case 12: Currently in musl F_GETLK64 has same value as F_GETLK, so omitted to avoid duplicate case blocks. If that changes, uncomment this */ {
          
          var arg = SYSCALLS.get();
          var offset = 0;
          // We're always unlocked.
          HEAP16[(((arg)+(offset))>>1)]=2;
          return 0;
        }
        case 13:
        case 14:
        /* case 13: Currently in musl F_SETLK64 has same value as F_SETLK, so omitted to avoid duplicate case blocks. If that changes, uncomment this */
        /* case 14: Currently in musl F_SETLKW64 has same value as F_SETLKW, so omitted to avoid duplicate case blocks. If that changes, uncomment this */
          
          
          return 0; // Pretend that the locking is successful.
        case 16:
        case 8:
          return -28; // These are for sockets. We don't have them fully implemented yet.
        case 9:
          // musl trusts getown return values, due to a bug where they must be, as they overlap with errors. just return -1 here, so fnctl() returns that, and we set errno ourselves.
          ___setErrNo(28);
          return -1;
        default: {
          return -28;
        }
      }
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall5(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // open
      var pathname = SYSCALLS.getStr(), flags = SYSCALLS.get(), mode = SYSCALLS.get(); // optional TODO
      var stream = FS.open(pathname, flags, mode);
      return stream.fd;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall54(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // ioctl
      var stream = SYSCALLS.getStreamFromFD(), op = SYSCALLS.get();
      switch (op) {
        case 21509:
        case 21505: {
          if (!stream.tty) return -59;
          return 0;
        }
        case 21510:
        case 21511:
        case 21512:
        case 21506:
        case 21507:
        case 21508: {
          if (!stream.tty) return -59;
          return 0; // no-op, not actually adjusting terminal settings
        }
        case 21519: {
          if (!stream.tty) return -59;
          var argp = SYSCALLS.get();
          HEAP32[((argp)>>2)]=0;
          return 0;
        }
        case 21520: {
          if (!stream.tty) return -59;
          return -28; // not supported
        }
        case 21531: {
          var argp = SYSCALLS.get();
          return FS.ioctl(stream, op, argp);
        }
        case 21523: {
          // TODO: in theory we should write to the winsize struct that gets
          // passed in, but for now musl doesn't read anything on it
          if (!stream.tty) return -59;
          return 0;
        }
        case 21524: {
          // TODO: technically, this ioctl call should change the window size.
          // but, since emscripten doesn't have any concept of a terminal window
          // yet, we'll just silently throw it away as we do TIOCGWINSZ
          if (!stream.tty) return -59;
          return 0;
        }
        default: abort('bad ioctl syscall ' + op);
      }
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  
  function __emscripten_syscall_munmap(addr, len) {
      if (addr === -1 || len === 0) {
        return -28;
      }
      // TODO: support unmmap'ing parts of allocations
      var info = SYSCALLS.mappings[addr];
      if (!info) return 0;
      if (len === info.len) {
        var stream = FS.getStream(info.fd);
        SYSCALLS.doMsync(addr, stream, len, info.flags, info.offset);
        FS.munmap(stream);
        SYSCALLS.mappings[addr] = null;
        if (info.allocated) {
          _free(info.malloc);
        }
      }
      return 0;
    }function ___syscall91(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // munmap
      var addr = SYSCALLS.get(), len = SYSCALLS.get();
      return __emscripten_syscall_munmap(addr, len);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___unlock() {}

  
  function getShiftFromSize(size) {
      switch (size) {
          case 1: return 0;
          case 2: return 1;
          case 4: return 2;
          case 8: return 3;
          default:
              throw new TypeError('Unknown type size: ' + size);
      }
    }
  
  
  
  function embind_init_charCodes() {
      var codes = new Array(256);
      for (var i = 0; i < 256; ++i) {
          codes[i] = String.fromCharCode(i);
      }
      embind_charCodes = codes;
    }var embind_charCodes=undefined;function readLatin1String(ptr) {
      var ret = "";
      var c = ptr;
      while (HEAPU8[c]) {
          ret += embind_charCodes[HEAPU8[c++]];
      }
      return ret;
    }
  
  
  var awaitingDependencies={};
  
  var registeredTypes={};
  
  var typeDependencies={};
  
  
  
  
  
  
  var char_0=48;
  
  var char_9=57;function makeLegalFunctionName(name) {
      if (undefined === name) {
          return '_unknown';
      }
      name = name.replace(/[^a-zA-Z0-9_]/g, '$');
      var f = name.charCodeAt(0);
      if (f >= char_0 && f <= char_9) {
          return '_' + name;
      } else {
          return name;
      }
    }function createNamedFunction(name, body) {
      name = makeLegalFunctionName(name);
      /*jshint evil:true*/
      return new Function(
          "body",
          "return function " + name + "() {\n" +
          "    \"use strict\";" +
          "    return body.apply(this, arguments);\n" +
          "};\n"
      )(body);
    }function extendError(baseErrorType, errorName) {
      var errorClass = createNamedFunction(errorName, function(message) {
          this.name = errorName;
          this.message = message;
  
          var stack = (new Error(message)).stack;
          if (stack !== undefined) {
              this.stack = this.toString() + '\n' +
                  stack.replace(/^Error(:[^\n]*)?\n/, '');
          }
      });
      errorClass.prototype = Object.create(baseErrorType.prototype);
      errorClass.prototype.constructor = errorClass;
      errorClass.prototype.toString = function() {
          if (this.message === undefined) {
              return this.name;
          } else {
              return this.name + ': ' + this.message;
          }
      };
  
      return errorClass;
    }var BindingError=undefined;function throwBindingError(message) {
      throw new BindingError(message);
    }
  
  
  
  var InternalError=undefined;function throwInternalError(message) {
      throw new InternalError(message);
    }function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
      myTypes.forEach(function(type) {
          typeDependencies[type] = dependentTypes;
      });
  
      function onComplete(typeConverters) {
          var myTypeConverters = getTypeConverters(typeConverters);
          if (myTypeConverters.length !== myTypes.length) {
              throwInternalError('Mismatched type converter count');
          }
          for (var i = 0; i < myTypes.length; ++i) {
              registerType(myTypes[i], myTypeConverters[i]);
          }
      }
  
      var typeConverters = new Array(dependentTypes.length);
      var unregisteredTypes = [];
      var registered = 0;
      dependentTypes.forEach(function(dt, i) {
          if (registeredTypes.hasOwnProperty(dt)) {
              typeConverters[i] = registeredTypes[dt];
          } else {
              unregisteredTypes.push(dt);
              if (!awaitingDependencies.hasOwnProperty(dt)) {
                  awaitingDependencies[dt] = [];
              }
              awaitingDependencies[dt].push(function() {
                  typeConverters[i] = registeredTypes[dt];
                  ++registered;
                  if (registered === unregisteredTypes.length) {
                      onComplete(typeConverters);
                  }
              });
          }
      });
      if (0 === unregisteredTypes.length) {
          onComplete(typeConverters);
      }
    }function registerType(rawType, registeredInstance, options) {
      options = options || {};
  
      if (!('argPackAdvance' in registeredInstance)) {
          throw new TypeError('registerType registeredInstance requires argPackAdvance');
      }
  
      var name = registeredInstance.name;
      if (!rawType) {
          throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
      }
      if (registeredTypes.hasOwnProperty(rawType)) {
          if (options.ignoreDuplicateRegistrations) {
              return;
          } else {
              throwBindingError("Cannot register type '" + name + "' twice");
          }
      }
  
      registeredTypes[rawType] = registeredInstance;
      delete typeDependencies[rawType];
  
      if (awaitingDependencies.hasOwnProperty(rawType)) {
          var callbacks = awaitingDependencies[rawType];
          delete awaitingDependencies[rawType];
          callbacks.forEach(function(cb) {
              cb();
          });
      }
    }function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
      var shift = getShiftFromSize(size);
  
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(wt) {
              // ambiguous emscripten ABI: sometimes return values are
              // true or false, and sometimes integers (0 or 1)
              return !!wt;
          },
          'toWireType': function(destructors, o) {
              return o ? trueValue : falseValue;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': function(pointer) {
              // TODO: if heap is fixed (like in asm.js) this could be executed outside
              var heap;
              if (size === 1) {
                  heap = HEAP8;
              } else if (size === 2) {
                  heap = HEAP16;
              } else if (size === 4) {
                  heap = HEAP32;
              } else {
                  throw new TypeError("Unknown boolean type size: " + name);
              }
              return this['fromWireType'](heap[pointer >> shift]);
          },
          destructorFunction: null, // This type does not need a destructor
      });
    }

  
  
  
  function ClassHandle_isAliasOf(other) {
      if (!(this instanceof ClassHandle)) {
          return false;
      }
      if (!(other instanceof ClassHandle)) {
          return false;
      }
  
      var leftClass = this.$$.ptrType.registeredClass;
      var left = this.$$.ptr;
      var rightClass = other.$$.ptrType.registeredClass;
      var right = other.$$.ptr;
  
      while (leftClass.baseClass) {
          left = leftClass.upcast(left);
          leftClass = leftClass.baseClass;
      }
  
      while (rightClass.baseClass) {
          right = rightClass.upcast(right);
          rightClass = rightClass.baseClass;
      }
  
      return leftClass === rightClass && left === right;
    }
  
  
  function shallowCopyInternalPointer(o) {
      return {
          count: o.count,
          deleteScheduled: o.deleteScheduled,
          preservePointerOnDelete: o.preservePointerOnDelete,
          ptr: o.ptr,
          ptrType: o.ptrType,
          smartPtr: o.smartPtr,
          smartPtrType: o.smartPtrType,
      };
    }
  
  function throwInstanceAlreadyDeleted(obj) {
      function getInstanceTypeName(handle) {
        return handle.$$.ptrType.registeredClass.name;
      }
      throwBindingError(getInstanceTypeName(obj) + ' instance already deleted');
    }
  
  
  var finalizationGroup=false;
  
  function detachFinalizer(handle) {}
  
  
  function runDestructor($$) {
      if ($$.smartPtr) {
          $$.smartPtrType.rawDestructor($$.smartPtr);
      } else {
          $$.ptrType.registeredClass.rawDestructor($$.ptr);
      }
    }function releaseClassHandle($$) {
      $$.count.value -= 1;
      var toDelete = 0 === $$.count.value;
      if (toDelete) {
          runDestructor($$);
      }
    }function attachFinalizer(handle) {
      if ('undefined' === typeof FinalizationGroup) {
          attachFinalizer = function (handle) { return handle; };
          return handle;
      }
      // If the running environment has a FinalizationGroup (see
      // https://github.com/tc39/proposal-weakrefs), then attach finalizers
      // for class handles.  We check for the presence of FinalizationGroup
      // at run-time, not build-time.
      finalizationGroup = new FinalizationGroup(function (iter) {
          for (var result = iter.next(); !result.done; result = iter.next()) {
              var $$ = result.value;
              if (!$$.ptr) {
                  console.warn('object already deleted: ' + $$.ptr);
              } else {
                  releaseClassHandle($$);
              }
          }
      });
      attachFinalizer = function(handle) {
          finalizationGroup.register(handle, handle.$$, handle.$$);
          return handle;
      };
      detachFinalizer = function(handle) {
          finalizationGroup.unregister(handle.$$);
      };
      return attachFinalizer(handle);
    }function ClassHandle_clone() {
      if (!this.$$.ptr) {
          throwInstanceAlreadyDeleted(this);
      }
  
      if (this.$$.preservePointerOnDelete) {
          this.$$.count.value += 1;
          return this;
      } else {
          var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), {
              $$: {
                  value: shallowCopyInternalPointer(this.$$),
              }
          }));
  
          clone.$$.count.value += 1;
          clone.$$.deleteScheduled = false;
          return clone;
      }
    }
  
  function ClassHandle_delete() {
      if (!this.$$.ptr) {
          throwInstanceAlreadyDeleted(this);
      }
  
      if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
          throwBindingError('Object already scheduled for deletion');
      }
  
      detachFinalizer(this);
      releaseClassHandle(this.$$);
  
      if (!this.$$.preservePointerOnDelete) {
          this.$$.smartPtr = undefined;
          this.$$.ptr = undefined;
      }
    }
  
  function ClassHandle_isDeleted() {
      return !this.$$.ptr;
    }
  
  
  var delayFunction=undefined;
  
  var deletionQueue=[];
  
  function flushPendingDeletes() {
      while (deletionQueue.length) {
          var obj = deletionQueue.pop();
          obj.$$.deleteScheduled = false;
          obj['delete']();
      }
    }function ClassHandle_deleteLater() {
      if (!this.$$.ptr) {
          throwInstanceAlreadyDeleted(this);
      }
      if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
          throwBindingError('Object already scheduled for deletion');
      }
      deletionQueue.push(this);
      if (deletionQueue.length === 1 && delayFunction) {
          delayFunction(flushPendingDeletes);
      }
      this.$$.deleteScheduled = true;
      return this;
    }function init_ClassHandle() {
      ClassHandle.prototype['isAliasOf'] = ClassHandle_isAliasOf;
      ClassHandle.prototype['clone'] = ClassHandle_clone;
      ClassHandle.prototype['delete'] = ClassHandle_delete;
      ClassHandle.prototype['isDeleted'] = ClassHandle_isDeleted;
      ClassHandle.prototype['deleteLater'] = ClassHandle_deleteLater;
    }function ClassHandle() {
    }
  
  var registeredPointers={};
  
  
  function ensureOverloadTable(proto, methodName, humanName) {
      if (undefined === proto[methodName].overloadTable) {
          var prevFunc = proto[methodName];
          // Inject an overload resolver function that routes to the appropriate overload based on the number of arguments.
          proto[methodName] = function() {
              // TODO This check can be removed in -O3 level "unsafe" optimizations.
              if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
                  throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
              }
              return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
          };
          // Move the previous function into the overload table.
          proto[methodName].overloadTable = [];
          proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
      }
    }function exposePublicSymbol(name, value, numArguments) {
      if (Module.hasOwnProperty(name)) {
          if (undefined === numArguments || (undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments])) {
              throwBindingError("Cannot register public name '" + name + "' twice");
          }
  
          // We are exposing a function with the same name as an existing function. Create an overload table and a function selector
          // that routes between the two.
          ensureOverloadTable(Module, name, name);
          if (Module.hasOwnProperty(numArguments)) {
              throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
          }
          // Add the new function into the overload table.
          Module[name].overloadTable[numArguments] = value;
      }
      else {
          Module[name] = value;
          if (undefined !== numArguments) {
              Module[name].numArguments = numArguments;
          }
      }
    }
  
  function RegisteredClass(
      name,
      constructor,
      instancePrototype,
      rawDestructor,
      baseClass,
      getActualType,
      upcast,
      downcast
    ) {
      this.name = name;
      this.constructor = constructor;
      this.instancePrototype = instancePrototype;
      this.rawDestructor = rawDestructor;
      this.baseClass = baseClass;
      this.getActualType = getActualType;
      this.upcast = upcast;
      this.downcast = downcast;
      this.pureVirtualFunctions = [];
    }
  
  
  
  function upcastPointer(ptr, ptrClass, desiredClass) {
      while (ptrClass !== desiredClass) {
          if (!ptrClass.upcast) {
              throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name);
          }
          ptr = ptrClass.upcast(ptr);
          ptrClass = ptrClass.baseClass;
      }
      return ptr;
    }function constNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
          if (this.isReference) {
              throwBindingError('null is not a valid ' + this.name);
          }
          return 0;
      }
  
      if (!handle.$$) {
          throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
      }
      if (!handle.$$.ptr) {
          throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      return ptr;
    }
  
  function genericPointerToWireType(destructors, handle) {
      var ptr;
      if (handle === null) {
          if (this.isReference) {
              throwBindingError('null is not a valid ' + this.name);
          }
  
          if (this.isSmartPointer) {
              ptr = this.rawConstructor();
              if (destructors !== null) {
                  destructors.push(this.rawDestructor, ptr);
              }
              return ptr;
          } else {
              return 0;
          }
      }
  
      if (!handle.$$) {
          throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
      }
      if (!handle.$$.ptr) {
          throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
      }
      if (!this.isConst && handle.$$.ptrType.isConst) {
          throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
  
      if (this.isSmartPointer) {
          // TODO: this is not strictly true
          // We could support BY_EMVAL conversions from raw pointers to smart pointers
          // because the smart pointer can hold a reference to the handle
          if (undefined === handle.$$.smartPtr) {
              throwBindingError('Passing raw pointer to smart pointer is illegal');
          }
  
          switch (this.sharingPolicy) {
              case 0: // NONE
                  // no upcasting
                  if (handle.$$.smartPtrType === this) {
                      ptr = handle.$$.smartPtr;
                  } else {
                      throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
                  }
                  break;
  
              case 1: // INTRUSIVE
                  ptr = handle.$$.smartPtr;
                  break;
  
              case 2: // BY_EMVAL
                  if (handle.$$.smartPtrType === this) {
                      ptr = handle.$$.smartPtr;
                  } else {
                      var clonedHandle = handle['clone']();
                      ptr = this.rawShare(
                          ptr,
                          __emval_register(function() {
                              clonedHandle['delete']();
                          })
                      );
                      if (destructors !== null) {
                          destructors.push(this.rawDestructor, ptr);
                      }
                  }
                  break;
  
              default:
                  throwBindingError('Unsupporting sharing policy');
          }
      }
      return ptr;
    }
  
  function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
          if (this.isReference) {
              throwBindingError('null is not a valid ' + this.name);
          }
          return 0;
      }
  
      if (!handle.$$) {
          throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
      }
      if (!handle.$$.ptr) {
          throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
      }
      if (handle.$$.ptrType.isConst) {
          throwBindingError('Cannot convert argument of type ' + handle.$$.ptrType.name + ' to parameter type ' + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      return ptr;
    }
  
  
  function simpleReadValueFromPointer(pointer) {
      return this['fromWireType'](HEAPU32[pointer >> 2]);
    }
  
  function RegisteredPointer_getPointee(ptr) {
      if (this.rawGetPointee) {
          ptr = this.rawGetPointee(ptr);
      }
      return ptr;
    }
  
  function RegisteredPointer_destructor(ptr) {
      if (this.rawDestructor) {
          this.rawDestructor(ptr);
      }
    }
  
  function RegisteredPointer_deleteObject(handle) {
      if (handle !== null) {
          handle['delete']();
      }
    }
  
  
  function downcastPointer(ptr, ptrClass, desiredClass) {
      if (ptrClass === desiredClass) {
          return ptr;
      }
      if (undefined === desiredClass.baseClass) {
          return null; // no conversion
      }
  
      var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
      if (rv === null) {
          return null;
      }
      return desiredClass.downcast(rv);
    }
  
  
  
  
  function getInheritedInstanceCount() {
      return Object.keys(registeredInstances).length;
    }
  
  function getLiveInheritedInstances() {
      var rv = [];
      for (var k in registeredInstances) {
          if (registeredInstances.hasOwnProperty(k)) {
              rv.push(registeredInstances[k]);
          }
      }
      return rv;
    }
  
  function setDelayFunction(fn) {
      delayFunction = fn;
      if (deletionQueue.length && delayFunction) {
          delayFunction(flushPendingDeletes);
      }
    }function init_embind() {
      Module['getInheritedInstanceCount'] = getInheritedInstanceCount;
      Module['getLiveInheritedInstances'] = getLiveInheritedInstances;
      Module['flushPendingDeletes'] = flushPendingDeletes;
      Module['setDelayFunction'] = setDelayFunction;
    }var registeredInstances={};
  
  function getBasestPointer(class_, ptr) {
      if (ptr === undefined) {
          throwBindingError('ptr should not be undefined');
      }
      while (class_.baseClass) {
          ptr = class_.upcast(ptr);
          class_ = class_.baseClass;
      }
      return ptr;
    }function getInheritedInstance(class_, ptr) {
      ptr = getBasestPointer(class_, ptr);
      return registeredInstances[ptr];
    }
  
  function makeClassHandle(prototype, record) {
      if (!record.ptrType || !record.ptr) {
          throwInternalError('makeClassHandle requires ptr and ptrType');
      }
      var hasSmartPtrType = !!record.smartPtrType;
      var hasSmartPtr = !!record.smartPtr;
      if (hasSmartPtrType !== hasSmartPtr) {
          throwInternalError('Both smartPtrType and smartPtr must be specified');
      }
      record.count = { value: 1 };
      return attachFinalizer(Object.create(prototype, {
          $$: {
              value: record,
          },
      }));
    }function RegisteredPointer_fromWireType(ptr) {
      // ptr is a raw pointer (or a raw smartpointer)
  
      // rawPointer is a maybe-null raw pointer
      var rawPointer = this.getPointee(ptr);
      if (!rawPointer) {
          this.destructor(ptr);
          return null;
      }
  
      var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
      if (undefined !== registeredInstance) {
          // JS object has been neutered, time to repopulate it
          if (0 === registeredInstance.$$.count.value) {
              registeredInstance.$$.ptr = rawPointer;
              registeredInstance.$$.smartPtr = ptr;
              return registeredInstance['clone']();
          } else {
              // else, just increment reference count on existing object
              // it already has a reference to the smart pointer
              var rv = registeredInstance['clone']();
              this.destructor(ptr);
              return rv;
          }
      }
  
      function makeDefaultHandle() {
          if (this.isSmartPointer) {
              return makeClassHandle(this.registeredClass.instancePrototype, {
                  ptrType: this.pointeeType,
                  ptr: rawPointer,
                  smartPtrType: this,
                  smartPtr: ptr,
              });
          } else {
              return makeClassHandle(this.registeredClass.instancePrototype, {
                  ptrType: this,
                  ptr: ptr,
              });
          }
      }
  
      var actualType = this.registeredClass.getActualType(rawPointer);
      var registeredPointerRecord = registeredPointers[actualType];
      if (!registeredPointerRecord) {
          return makeDefaultHandle.call(this);
      }
  
      var toType;
      if (this.isConst) {
          toType = registeredPointerRecord.constPointerType;
      } else {
          toType = registeredPointerRecord.pointerType;
      }
      var dp = downcastPointer(
          rawPointer,
          this.registeredClass,
          toType.registeredClass);
      if (dp === null) {
          return makeDefaultHandle.call(this);
      }
      if (this.isSmartPointer) {
          return makeClassHandle(toType.registeredClass.instancePrototype, {
              ptrType: toType,
              ptr: dp,
              smartPtrType: this,
              smartPtr: ptr,
          });
      } else {
          return makeClassHandle(toType.registeredClass.instancePrototype, {
              ptrType: toType,
              ptr: dp,
          });
      }
    }function init_RegisteredPointer() {
      RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
      RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
      RegisteredPointer.prototype['argPackAdvance'] = 8;
      RegisteredPointer.prototype['readValueFromPointer'] = simpleReadValueFromPointer;
      RegisteredPointer.prototype['deleteObject'] = RegisteredPointer_deleteObject;
      RegisteredPointer.prototype['fromWireType'] = RegisteredPointer_fromWireType;
    }function RegisteredPointer(
      name,
      registeredClass,
      isReference,
      isConst,
  
      // smart pointer properties
      isSmartPointer,
      pointeeType,
      sharingPolicy,
      rawGetPointee,
      rawConstructor,
      rawShare,
      rawDestructor
    ) {
      this.name = name;
      this.registeredClass = registeredClass;
      this.isReference = isReference;
      this.isConst = isConst;
  
      // smart pointer properties
      this.isSmartPointer = isSmartPointer;
      this.pointeeType = pointeeType;
      this.sharingPolicy = sharingPolicy;
      this.rawGetPointee = rawGetPointee;
      this.rawConstructor = rawConstructor;
      this.rawShare = rawShare;
      this.rawDestructor = rawDestructor;
  
      if (!isSmartPointer && registeredClass.baseClass === undefined) {
          if (isConst) {
              this['toWireType'] = constNoSmartPtrRawPointerToWireType;
              this.destructorFunction = null;
          } else {
              this['toWireType'] = nonConstNoSmartPtrRawPointerToWireType;
              this.destructorFunction = null;
          }
      } else {
          this['toWireType'] = genericPointerToWireType;
          // Here we must leave this.destructorFunction undefined, since whether genericPointerToWireType returns
          // a pointer that needs to be freed up is runtime-dependent, and cannot be evaluated at registration time.
          // TODO: Create an alternative mechanism that allows removing the use of var destructors = []; array in
          //       craftInvokerFunction altogether.
      }
    }
  
  function replacePublicSymbol(name, value, numArguments) {
      if (!Module.hasOwnProperty(name)) {
          throwInternalError('Replacing nonexistant public symbol');
      }
      // If there's an overload table for this symbol, replace the symbol in the overload table instead.
      if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
          Module[name].overloadTable[numArguments] = value;
      }
      else {
          Module[name] = value;
          Module[name].argCount = numArguments;
      }
    }
  
  function embind__requireFunction(signature, rawFunction) {
      signature = readLatin1String(signature);
  
      function makeDynCaller(dynCall) {
          var args = [];
          for (var i = 1; i < signature.length; ++i) {
              args.push('a' + i);
          }
  
          var name = 'dynCall_' + signature + '_' + rawFunction;
          var body = 'return function ' + name + '(' + args.join(', ') + ') {\n';
          body    += '    return dynCall(rawFunction' + (args.length ? ', ' : '') + args.join(', ') + ');\n';
          body    += '};\n';
  
          return (new Function('dynCall', 'rawFunction', body))(dynCall, rawFunction);
      }
  
      var fp;
      if (Module['FUNCTION_TABLE_' + signature] !== undefined) {
          fp = Module['FUNCTION_TABLE_' + signature][rawFunction];
      } else if (typeof FUNCTION_TABLE !== "undefined") {
          fp = FUNCTION_TABLE[rawFunction];
      } else {
          // asm.js does not give direct access to the function tables,
          // and thus we must go through the dynCall interface which allows
          // calling into a signature's function table by pointer value.
          //
          // https://github.com/dherman/asm.js/issues/83
          //
          // This has three main penalties:
          // - dynCall is another function call in the path from JavaScript to C++.
          // - JITs may not predict through the function table indirection at runtime.
          var dc = Module['dynCall_' + signature];
          if (dc === undefined) {
              // We will always enter this branch if the signature
              // contains 'f' and PRECISE_F32 is not enabled.
              //
              // Try again, replacing 'f' with 'd'.
              dc = Module['dynCall_' + signature.replace(/f/g, 'd')];
              if (dc === undefined) {
                  throwBindingError("No dynCall invoker for signature: " + signature);
              }
          }
          fp = makeDynCaller(dc);
      }
  
      if (typeof fp !== "function") {
          throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction);
      }
      return fp;
    }
  
  
  var UnboundTypeError=undefined;
  
  function getTypeName(type) {
      var ptr = ___getTypeName(type);
      var rv = readLatin1String(ptr);
      _free(ptr);
      return rv;
    }function throwUnboundTypeError(message, types) {
      var unboundTypes = [];
      var seen = {};
      function visit(type) {
          if (seen[type]) {
              return;
          }
          if (registeredTypes[type]) {
              return;
          }
          if (typeDependencies[type]) {
              typeDependencies[type].forEach(visit);
              return;
          }
          unboundTypes.push(type);
          seen[type] = true;
      }
      types.forEach(visit);
  
      throw new UnboundTypeError(message + ': ' + unboundTypes.map(getTypeName).join([', ']));
    }function __embind_register_class(
      rawType,
      rawPointerType,
      rawConstPointerType,
      baseClassRawType,
      getActualTypeSignature,
      getActualType,
      upcastSignature,
      upcast,
      downcastSignature,
      downcast,
      name,
      destructorSignature,
      rawDestructor
    ) {
      name = readLatin1String(name);
      getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
      if (upcast) {
          upcast = embind__requireFunction(upcastSignature, upcast);
      }
      if (downcast) {
          downcast = embind__requireFunction(downcastSignature, downcast);
      }
      rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
      var legalFunctionName = makeLegalFunctionName(name);
  
      exposePublicSymbol(legalFunctionName, function() {
          // this code cannot run if baseClassRawType is zero
          throwUnboundTypeError('Cannot construct ' + name + ' due to unbound types', [baseClassRawType]);
      });
  
      whenDependentTypesAreResolved(
          [rawType, rawPointerType, rawConstPointerType],
          baseClassRawType ? [baseClassRawType] : [],
          function(base) {
              base = base[0];
  
              var baseClass;
              var basePrototype;
              if (baseClassRawType) {
                  baseClass = base.registeredClass;
                  basePrototype = baseClass.instancePrototype;
              } else {
                  basePrototype = ClassHandle.prototype;
              }
  
              var constructor = createNamedFunction(legalFunctionName, function() {
                  if (Object.getPrototypeOf(this) !== instancePrototype) {
                      throw new BindingError("Use 'new' to construct " + name);
                  }
                  if (undefined === registeredClass.constructor_body) {
                      throw new BindingError(name + " has no accessible constructor");
                  }
                  var body = registeredClass.constructor_body[arguments.length];
                  if (undefined === body) {
                      throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!");
                  }
                  return body.apply(this, arguments);
              });
  
              var instancePrototype = Object.create(basePrototype, {
                  constructor: { value: constructor },
              });
  
              constructor.prototype = instancePrototype;
  
              var registeredClass = new RegisteredClass(
                  name,
                  constructor,
                  instancePrototype,
                  rawDestructor,
                  baseClass,
                  getActualType,
                  upcast,
                  downcast);
  
              var referenceConverter = new RegisteredPointer(
                  name,
                  registeredClass,
                  true,
                  false,
                  false);
  
              var pointerConverter = new RegisteredPointer(
                  name + '*',
                  registeredClass,
                  false,
                  false,
                  false);
  
              var constPointerConverter = new RegisteredPointer(
                  name + ' const*',
                  registeredClass,
                  false,
                  true,
                  false);
  
              registeredPointers[rawType] = {
                  pointerType: pointerConverter,
                  constPointerType: constPointerConverter
              };
  
              replacePublicSymbol(legalFunctionName, constructor);
  
              return [referenceConverter, pointerConverter, constPointerConverter];
          }
      );
    }

  
  
  function new_(constructor, argumentList) {
      if (!(constructor instanceof Function)) {
          throw new TypeError('new_ called with constructor type ' + typeof(constructor) + " which is not a function");
      }
  
      /*
       * Previously, the following line was just:
  
       function dummy() {};
  
       * Unfortunately, Chrome was preserving 'dummy' as the object's name, even though at creation, the 'dummy' has the
       * correct constructor name.  Thus, objects created with IMVU.new would show up in the debugger as 'dummy', which
       * isn't very helpful.  Using IMVU.createNamedFunction addresses the issue.  Doublely-unfortunately, there's no way
       * to write a test for this behavior.  -NRD 2013.02.22
       */
      var dummy = createNamedFunction(constructor.name || 'unknownFunctionName', function(){});
      dummy.prototype = constructor.prototype;
      var obj = new dummy;
  
      var r = constructor.apply(obj, argumentList);
      return (r instanceof Object) ? r : obj;
    }
  
  function runDestructors(destructors) {
      while (destructors.length) {
          var ptr = destructors.pop();
          var del = destructors.pop();
          del(ptr);
      }
    }function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
      // humanName: a human-readable string name for the function to be generated.
      // argTypes: An array that contains the embind type objects for all types in the function signature.
      //    argTypes[0] is the type object for the function return value.
      //    argTypes[1] is the type object for function this object/class type, or null if not crafting an invoker for a class method.
      //    argTypes[2...] are the actual function parameters.
      // classType: The embind type object for the class to be bound, or null if this is not a method of a class.
      // cppInvokerFunc: JS Function object to the C++-side function that interops into C++ code.
      // cppTargetFunc: Function pointer (an integer to FUNCTION_TABLE) to the target C++ function the cppInvokerFunc will end up calling.
      var argCount = argTypes.length;
  
      if (argCount < 2) {
          throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
      }
  
      var isClassMethodFunc = (argTypes[1] !== null && classType !== null);
  
      // Free functions with signature "void function()" do not need an invoker that marshalls between wire types.
  // TODO: This omits argument count check - enable only at -O3 or similar.
  //    if (ENABLE_UNSAFE_OPTS && argCount == 2 && argTypes[0].name == "void" && !isClassMethodFunc) {
  //       return FUNCTION_TABLE[fn];
  //    }
  
  
      // Determine if we need to use a dynamic stack to store the destructors for the function parameters.
      // TODO: Remove this completely once all function invokers are being dynamically generated.
      var needsDestructorStack = false;
  
      for(var i = 1; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here.
          if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) { // The type does not define a destructor function - must use dynamic stack
              needsDestructorStack = true;
              break;
          }
      }
  
      var returns = (argTypes[0].name !== "void");
  
      var argsList = "";
      var argsListWired = "";
      for(var i = 0; i < argCount - 2; ++i) {
          argsList += (i!==0?", ":"")+"arg"+i;
          argsListWired += (i!==0?", ":"")+"arg"+i+"Wired";
      }
  
      var invokerFnBody =
          "return function "+makeLegalFunctionName(humanName)+"("+argsList+") {\n" +
          "if (arguments.length !== "+(argCount - 2)+") {\n" +
              "throwBindingError('function "+humanName+" called with ' + arguments.length + ' arguments, expected "+(argCount - 2)+" args!');\n" +
          "}\n";
  
  
      if (needsDestructorStack) {
          invokerFnBody +=
              "var destructors = [];\n";
      }
  
      var dtorStack = needsDestructorStack ? "destructors" : "null";
      var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
      var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
  
  
      if (isClassMethodFunc) {
          invokerFnBody += "var thisWired = classParam.toWireType("+dtorStack+", this);\n";
      }
  
      for(var i = 0; i < argCount - 2; ++i) {
          invokerFnBody += "var arg"+i+"Wired = argType"+i+".toWireType("+dtorStack+", arg"+i+"); // "+argTypes[i+2].name+"\n";
          args1.push("argType"+i);
          args2.push(argTypes[i+2]);
      }
  
      if (isClassMethodFunc) {
          argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
      }
  
      invokerFnBody +=
          (returns?"var rv = ":"") + "invoker(fn"+(argsListWired.length>0?", ":"")+argsListWired+");\n";
  
      if (needsDestructorStack) {
          invokerFnBody += "runDestructors(destructors);\n";
      } else {
          for(var i = isClassMethodFunc?1:2; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here. Also skip class type if not a method.
              var paramName = (i === 1 ? "thisWired" : ("arg"+(i - 2)+"Wired"));
              if (argTypes[i].destructorFunction !== null) {
                  invokerFnBody += paramName+"_dtor("+paramName+"); // "+argTypes[i].name+"\n";
                  args1.push(paramName+"_dtor");
                  args2.push(argTypes[i].destructorFunction);
              }
          }
      }
  
      if (returns) {
          invokerFnBody += "var ret = retType.fromWireType(rv);\n" +
                           "return ret;\n";
      } else {
      }
      invokerFnBody += "}\n";
  
      args1.push(invokerFnBody);
  
      var invokerFunction = new_(Function, args1).apply(null, args2);
      return invokerFunction;
    }
  
  function heap32VectorToArray(count, firstElement) {
      var array = [];
      for (var i = 0; i < count; i++) {
          array.push(HEAP32[(firstElement >> 2) + i]);
      }
      return array;
    }function __embind_register_class_class_function(
      rawClassType,
      methodName,
      argCount,
      rawArgTypesAddr,
      invokerSignature,
      rawInvoker,
      fn
    ) {
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      methodName = readLatin1String(methodName);
      rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
      whenDependentTypesAreResolved([], [rawClassType], function(classType) {
          classType = classType[0];
          var humanName = classType.name + '.' + methodName;
  
          function unboundTypesHandler() {
              throwUnboundTypeError('Cannot call ' + humanName + ' due to unbound types', rawArgTypes);
          }
  
          var proto = classType.registeredClass.constructor;
          if (undefined === proto[methodName]) {
              // This is the first function to be registered with this name.
              unboundTypesHandler.argCount = argCount-1;
              proto[methodName] = unboundTypesHandler;
          } else {
              // There was an existing function with the same name registered. Set up a function overload routing table.
              ensureOverloadTable(proto, methodName, humanName);
              proto[methodName].overloadTable[argCount-1] = unboundTypesHandler;
          }
  
          whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
              // Replace the initial unbound-types-handler stub with the proper function. If multiple overloads are registered,
              // the function handlers go into an overload table.
              var invokerArgsArray = [argTypes[0] /* return value */, null /* no class 'this'*/].concat(argTypes.slice(1) /* actual params */);
              var func = craftInvokerFunction(humanName, invokerArgsArray, null /* no class 'this'*/, rawInvoker, fn);
              if (undefined === proto[methodName].overloadTable) {
                  func.argCount = argCount-1;
                  proto[methodName] = func;
              } else {
                  proto[methodName].overloadTable[argCount-1] = func;
              }
              return [];
          });
          return [];
      });
    }

  function __embind_register_class_constructor(
      rawClassType,
      argCount,
      rawArgTypesAddr,
      invokerSignature,
      invoker,
      rawConstructor
    ) {
      assert(argCount > 0);
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      invoker = embind__requireFunction(invokerSignature, invoker);
      var args = [rawConstructor];
      var destructors = [];
  
      whenDependentTypesAreResolved([], [rawClassType], function(classType) {
          classType = classType[0];
          var humanName = 'constructor ' + classType.name;
  
          if (undefined === classType.registeredClass.constructor_body) {
              classType.registeredClass.constructor_body = [];
          }
          if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
              throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount-1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
          }
          classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
              throwUnboundTypeError('Cannot construct ' + classType.name + ' due to unbound types', rawArgTypes);
          };
  
          whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
              classType.registeredClass.constructor_body[argCount - 1] = function constructor_body() {
                  if (arguments.length !== argCount - 1) {
                      throwBindingError(humanName + ' called with ' + arguments.length + ' arguments, expected ' + (argCount-1));
                  }
                  destructors.length = 0;
                  args.length = argCount;
                  for (var i = 1; i < argCount; ++i) {
                      args[i] = argTypes[i]['toWireType'](destructors, arguments[i - 1]);
                  }
  
                  var ptr = invoker.apply(null, args);
                  runDestructors(destructors);
  
                  return argTypes[0]['fromWireType'](ptr);
              };
              return [];
          });
          return [];
      });
    }

  function __embind_register_class_function(
      rawClassType,
      methodName,
      argCount,
      rawArgTypesAddr, // [ReturnType, ThisType, Args...]
      invokerSignature,
      rawInvoker,
      context,
      isPureVirtual
    ) {
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      methodName = readLatin1String(methodName);
      rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
  
      whenDependentTypesAreResolved([], [rawClassType], function(classType) {
          classType = classType[0];
          var humanName = classType.name + '.' + methodName;
  
          if (isPureVirtual) {
              classType.registeredClass.pureVirtualFunctions.push(methodName);
          }
  
          function unboundTypesHandler() {
              throwUnboundTypeError('Cannot call ' + humanName + ' due to unbound types', rawArgTypes);
          }
  
          var proto = classType.registeredClass.instancePrototype;
          var method = proto[methodName];
          if (undefined === method || (undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2)) {
              // This is the first overload to be registered, OR we are replacing a function in the base class with a function in the derived class.
              unboundTypesHandler.argCount = argCount - 2;
              unboundTypesHandler.className = classType.name;
              proto[methodName] = unboundTypesHandler;
          } else {
              // There was an existing function with the same name registered. Set up a function overload routing table.
              ensureOverloadTable(proto, methodName, humanName);
              proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
          }
  
          whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
  
              var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);
  
              // Replace the initial unbound-handler-stub function with the appropriate member function, now that all types
              // are resolved. If multiple overloads are registered for this function, the function goes into an overload table.
              if (undefined === proto[methodName].overloadTable) {
                  // Set argCount in case an overload is registered later
                  memberFunction.argCount = argCount - 2;
                  proto[methodName] = memberFunction;
              } else {
                  proto[methodName].overloadTable[argCount - 2] = memberFunction;
              }
  
              return [];
          });
          return [];
      });
    }

  
  function validateThis(this_, classType, humanName) {
      if (!(this_ instanceof Object)) {
          throwBindingError(humanName + ' with invalid "this": ' + this_);
      }
      if (!(this_ instanceof classType.registeredClass.constructor)) {
          throwBindingError(humanName + ' incompatible with "this" of type ' + this_.constructor.name);
      }
      if (!this_.$$.ptr) {
          throwBindingError('cannot call emscripten binding method ' + humanName + ' on deleted object');
      }
  
      // todo: kill this
      return upcastPointer(
          this_.$$.ptr,
          this_.$$.ptrType.registeredClass,
          classType.registeredClass);
    }function __embind_register_class_property(
      classType,
      fieldName,
      getterReturnType,
      getterSignature,
      getter,
      getterContext,
      setterArgumentType,
      setterSignature,
      setter,
      setterContext
    ) {
      fieldName = readLatin1String(fieldName);
      getter = embind__requireFunction(getterSignature, getter);
  
      whenDependentTypesAreResolved([], [classType], function(classType) {
          classType = classType[0];
          var humanName = classType.name + '.' + fieldName;
          var desc = {
              get: function() {
                  throwUnboundTypeError('Cannot access ' + humanName + ' due to unbound types', [getterReturnType, setterArgumentType]);
              },
              enumerable: true,
              configurable: true
          };
          if (setter) {
              desc.set = function() {
                  throwUnboundTypeError('Cannot access ' + humanName + ' due to unbound types', [getterReturnType, setterArgumentType]);
              };
          } else {
              desc.set = function(v) {
                  throwBindingError(humanName + ' is a read-only property');
              };
          }
  
          Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
  
          whenDependentTypesAreResolved(
              [],
              (setter ? [getterReturnType, setterArgumentType] : [getterReturnType]),
          function(types) {
              var getterReturnType = types[0];
              var desc = {
                  get: function() {
                      var ptr = validateThis(this, classType, humanName + ' getter');
                      return getterReturnType['fromWireType'](getter(getterContext, ptr));
                  },
                  enumerable: true
              };
  
              if (setter) {
                  setter = embind__requireFunction(setterSignature, setter);
                  var setterArgumentType = types[1];
                  desc.set = function(v) {
                      var ptr = validateThis(this, classType, humanName + ' setter');
                      var destructors = [];
                      setter(setterContext, ptr, setterArgumentType['toWireType'](destructors, v));
                      runDestructors(destructors);
                  };
              }
  
              Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
              return [];
          });
  
          return [];
      });
    }

  
  
  var emval_free_list=[];
  
  var emval_handle_array=[{},{value:undefined},{value:null},{value:true},{value:false}];function __emval_decref(handle) {
      if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
          emval_handle_array[handle] = undefined;
          emval_free_list.push(handle);
      }
    }
  
  
  
  function count_emval_handles() {
      var count = 0;
      for (var i = 5; i < emval_handle_array.length; ++i) {
          if (emval_handle_array[i] !== undefined) {
              ++count;
          }
      }
      return count;
    }
  
  function get_first_emval() {
      for (var i = 5; i < emval_handle_array.length; ++i) {
          if (emval_handle_array[i] !== undefined) {
              return emval_handle_array[i];
          }
      }
      return null;
    }function init_emval() {
      Module['count_emval_handles'] = count_emval_handles;
      Module['get_first_emval'] = get_first_emval;
    }function __emval_register(value) {
  
      switch(value){
        case undefined :{ return 1; }
        case null :{ return 2; }
        case true :{ return 3; }
        case false :{ return 4; }
        default:{
          var handle = emval_free_list.length ?
              emval_free_list.pop() :
              emval_handle_array.length;
  
          emval_handle_array[handle] = {refcount: 1, value: value};
          return handle;
          }
        }
    }function __embind_register_emval(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(handle) {
              var rv = emval_handle_array[handle].value;
              __emval_decref(handle);
              return rv;
          },
          'toWireType': function(destructors, value) {
              return __emval_register(value);
          },
          'argPackAdvance': 8,
          'readValueFromPointer': simpleReadValueFromPointer,
          destructorFunction: null, // This type does not need a destructor
  
          // TODO: do we need a deleteObject here?  write a test where
          // emval is passed into JS via an interface
      });
    }

  
  function enumReadValueFromPointer(name, shift, signed) {
      switch (shift) {
          case 0: return function(pointer) {
              var heap = signed ? HEAP8 : HEAPU8;
              return this['fromWireType'](heap[pointer]);
          };
          case 1: return function(pointer) {
              var heap = signed ? HEAP16 : HEAPU16;
              return this['fromWireType'](heap[pointer >> 1]);
          };
          case 2: return function(pointer) {
              var heap = signed ? HEAP32 : HEAPU32;
              return this['fromWireType'](heap[pointer >> 2]);
          };
          default:
              throw new TypeError("Unknown integer type: " + name);
      }
    }function __embind_register_enum(
      rawType,
      name,
      size,
      isSigned
    ) {
      var shift = getShiftFromSize(size);
      name = readLatin1String(name);
  
      function ctor() {
      }
      ctor.values = {};
  
      registerType(rawType, {
          name: name,
          constructor: ctor,
          'fromWireType': function(c) {
              return this.constructor.values[c];
          },
          'toWireType': function(destructors, c) {
              return c.value;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': enumReadValueFromPointer(name, shift, isSigned),
          destructorFunction: null,
      });
      exposePublicSymbol(name, ctor);
    }

  
  function requireRegisteredType(rawType, humanName) {
      var impl = registeredTypes[rawType];
      if (undefined === impl) {
          throwBindingError(humanName + " has unknown type " + getTypeName(rawType));
      }
      return impl;
    }function __embind_register_enum_value(
      rawEnumType,
      name,
      enumValue
    ) {
      var enumType = requireRegisteredType(rawEnumType, 'enum');
      name = readLatin1String(name);
  
      var Enum = enumType.constructor;
  
      var Value = Object.create(enumType.constructor.prototype, {
          value: {value: enumValue},
          constructor: {value: createNamedFunction(enumType.name + '_' + name, function() {})},
      });
      Enum.values[enumValue] = Value;
      Enum[name] = Value;
    }

  
  function _embind_repr(v) {
      if (v === null) {
          return 'null';
      }
      var t = typeof v;
      if (t === 'object' || t === 'array' || t === 'function') {
          return v.toString();
      } else {
          return '' + v;
      }
    }
  
  function floatReadValueFromPointer(name, shift) {
      switch (shift) {
          case 2: return function(pointer) {
              return this['fromWireType'](HEAPF32[pointer >> 2]);
          };
          case 3: return function(pointer) {
              return this['fromWireType'](HEAPF64[pointer >> 3]);
          };
          default:
              throw new TypeError("Unknown float type: " + name);
      }
    }function __embind_register_float(rawType, name, size) {
      var shift = getShiftFromSize(size);
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              return value;
          },
          'toWireType': function(destructors, value) {
              // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
              // avoid the following if() and assume value is of proper type.
              if (typeof value !== "number" && typeof value !== "boolean") {
                  throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
              }
              return value;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': floatReadValueFromPointer(name, shift),
          destructorFunction: null, // This type does not need a destructor
      });
    }

  
  function integerReadValueFromPointer(name, shift, signed) {
      // integers are quite common, so generate very specialized functions
      switch (shift) {
          case 0: return signed ?
              function readS8FromPointer(pointer) { return HEAP8[pointer]; } :
              function readU8FromPointer(pointer) { return HEAPU8[pointer]; };
          case 1: return signed ?
              function readS16FromPointer(pointer) { return HEAP16[pointer >> 1]; } :
              function readU16FromPointer(pointer) { return HEAPU16[pointer >> 1]; };
          case 2: return signed ?
              function readS32FromPointer(pointer) { return HEAP32[pointer >> 2]; } :
              function readU32FromPointer(pointer) { return HEAPU32[pointer >> 2]; };
          default:
              throw new TypeError("Unknown integer type: " + name);
      }
    }function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
      name = readLatin1String(name);
      if (maxRange === -1) { // LLVM doesn't have signed and unsigned 32-bit types, so u32 literals come out as 'i32 -1'. Always treat those as max u32.
          maxRange = 4294967295;
      }
  
      var shift = getShiftFromSize(size);
  
      var fromWireType = function(value) {
          return value;
      };
  
      if (minRange === 0) {
          var bitshift = 32 - 8*size;
          fromWireType = function(value) {
              return (value << bitshift) >>> bitshift;
          };
      }
  
      var isUnsignedType = (name.indexOf('unsigned') != -1);
  
      registerType(primitiveType, {
          name: name,
          'fromWireType': fromWireType,
          'toWireType': function(destructors, value) {
              // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
              // avoid the following two if()s and assume value is of proper type.
              if (typeof value !== "number" && typeof value !== "boolean") {
                  throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
              }
              if (value < minRange || value > maxRange) {
                  throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ', ' + maxRange + ']!');
              }
              return isUnsignedType ? (value >>> 0) : (value | 0);
          },
          'argPackAdvance': 8,
          'readValueFromPointer': integerReadValueFromPointer(name, shift, minRange !== 0),
          destructorFunction: null, // This type does not need a destructor
      });
    }

  function __embind_register_memory_view(rawType, dataTypeIndex, name) {
      var typeMapping = [
          Int8Array,
          Uint8Array,
          Int16Array,
          Uint16Array,
          Int32Array,
          Uint32Array,
          Float32Array,
          Float64Array,
      ];
  
      var TA = typeMapping[dataTypeIndex];
  
      function decodeMemoryView(handle) {
          handle = handle >> 2;
          var heap = HEAPU32;
          var size = heap[handle]; // in elements
          var data = heap[handle + 1]; // byte offset into emscripten heap
          return new TA(heap['buffer'], data, size);
      }
  
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': decodeMemoryView,
          'argPackAdvance': 8,
          'readValueFromPointer': decodeMemoryView,
      }, {
          ignoreDuplicateRegistrations: true,
      });
    }

  function __embind_register_smart_ptr(
      rawType,
      rawPointeeType,
      name,
      sharingPolicy,
      getPointeeSignature,
      rawGetPointee,
      constructorSignature,
      rawConstructor,
      shareSignature,
      rawShare,
      destructorSignature,
      rawDestructor
    ) {
      name = readLatin1String(name);
      rawGetPointee = embind__requireFunction(getPointeeSignature, rawGetPointee);
      rawConstructor = embind__requireFunction(constructorSignature, rawConstructor);
      rawShare = embind__requireFunction(shareSignature, rawShare);
      rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
  
      whenDependentTypesAreResolved([rawType], [rawPointeeType], function(pointeeType) {
          pointeeType = pointeeType[0];
  
          var registeredPointer = new RegisteredPointer(
              name,
              pointeeType.registeredClass,
              false,
              false,
              // smart pointer properties
              true,
              pointeeType,
              sharingPolicy,
              rawGetPointee,
              rawConstructor,
              rawShare,
              rawDestructor);
          return [registeredPointer];
      });
    }

  function __embind_register_std_string(rawType, name) {
      name = readLatin1String(name);
      var stdStringIsUTF8
      //process only std::string bindings with UTF8 support, in contrast to e.g. std::basic_string<unsigned char>
      = (name === "std::string");
  
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              var length = HEAPU32[value >> 2];
  
              var str;
              if(stdStringIsUTF8) {
                  //ensure null termination at one-past-end byte if not present yet
                  var endChar = HEAPU8[value + 4 + length];
                  var endCharSwap = 0;
                  if(endChar != 0)
                  {
                    endCharSwap = endChar;
                    HEAPU8[value + 4 + length] = 0;
                  }
  
                  var decodeStartPtr = value + 4;
                  //looping here to support possible embedded '0' bytes
                  for (var i = 0; i <= length; ++i) {
                    var currentBytePtr = value + 4 + i;
                    if(HEAPU8[currentBytePtr] == 0)
                    {
                      var stringSegment = UTF8ToString(decodeStartPtr);
                      if(str === undefined)
                        str = stringSegment;
                      else
                      {
                        str += String.fromCharCode(0);
                        str += stringSegment;
                      }
                      decodeStartPtr = currentBytePtr + 1;
                    }
                  }
  
                  if(endCharSwap != 0)
                    HEAPU8[value + 4 + length] = endCharSwap;
              } else {
                  var a = new Array(length);
                  for (var i = 0; i < length; ++i) {
                      a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
                  }
                  str = a.join('');
              }
  
              _free(value);
  
              return str;
          },
          'toWireType': function(destructors, value) {
              if (value instanceof ArrayBuffer) {
                  value = new Uint8Array(value);
              }
  
              var getLength;
              var valueIsOfTypeString = (typeof value === 'string');
  
              if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
                  throwBindingError('Cannot pass non-string to std::string');
              }
              if (stdStringIsUTF8 && valueIsOfTypeString) {
                  getLength = function() {return lengthBytesUTF8(value);};
              } else {
                  getLength = function() {return value.length;};
              }
  
              // assumes 4-byte alignment
              var length = getLength();
              var ptr = _malloc(4 + length + 1);
              HEAPU32[ptr >> 2] = length;
  
              if (stdStringIsUTF8 && valueIsOfTypeString) {
                  stringToUTF8(value, ptr + 4, length + 1);
              } else {
                  if(valueIsOfTypeString) {
                      for (var i = 0; i < length; ++i) {
                          var charCode = value.charCodeAt(i);
                          if (charCode > 255) {
                              _free(ptr);
                              throwBindingError('String has UTF-16 code units that do not fit in 8 bits');
                          }
                          HEAPU8[ptr + 4 + i] = charCode;
                      }
                  } else {
                      for (var i = 0; i < length; ++i) {
                          HEAPU8[ptr + 4 + i] = value[i];
                      }
                  }
              }
  
              if (destructors !== null) {
                  destructors.push(_free, ptr);
              }
              return ptr;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': simpleReadValueFromPointer,
          destructorFunction: function(ptr) { _free(ptr); },
      });
    }

  function __embind_register_std_wstring(rawType, charSize, name) {
      name = readLatin1String(name);
      var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
      if (charSize === 2) {
          decodeString = UTF16ToString;
          encodeString = stringToUTF16;
          lengthBytesUTF = lengthBytesUTF16;
          getHeap = function() { return HEAPU16; };
          shift = 1;
      } else if (charSize === 4) {
          decodeString = UTF32ToString;
          encodeString = stringToUTF32;
          lengthBytesUTF = lengthBytesUTF32
          getHeap = function() { return HEAPU32; };
          shift = 2;
      }
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              // Code mostly taken from _embind_register_std_string fromWireType
              var length = HEAPU32[value >> 2];
              var HEAP = getHeap();
              var str;
              //ensure null termination at one-past-end byte if not present yet
              var endChar = HEAP[(value + 4 + length * charSize) >> shift];
              var endCharSwap = 0;
              if(endChar != 0)
              {
                  endCharSwap = endChar;
                  HEAP[(value + 4 + length * charSize) >> shift] = 0;
              }
  
              var decodeStartPtr = value + 4;
              //looping here to support possible embedded '0' bytes
              for (var i = 0; i <= length; ++i) {
                  var currentBytePtr = value + 4 + i * charSize;
                  if(HEAP[currentBytePtr >> shift] == 0)
                  {
                      var stringSegment = decodeString(decodeStartPtr);
                      if(str === undefined)
                          str = stringSegment;
                      else
                      {
                          str += String.fromCharCode(0);
                          str += stringSegment;
                      }
                      decodeStartPtr = currentBytePtr + charSize;
                  }
              }
  
              if(endCharSwap != 0)
                  HEAP[(value + 4 + length * charSize) >> shift] = endCharSwap;
  
              _free(value);
  
              return str;
          },
          'toWireType': function(destructors, value) {
              if (!(typeof value === 'string')) {
                  throwBindingError('Cannot pass non-string to C++ string type ' + name);
              }
  
              // assumes 4-byte alignment
              var length = lengthBytesUTF(value);
              var ptr = _malloc(4 + length + charSize);
              HEAPU32[ptr >> 2] = length >> shift;
  
              encodeString(value, ptr + 4, length + charSize);
  
              if (destructors !== null) {
                  destructors.push(_free, ptr);
              }
              return ptr;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': simpleReadValueFromPointer,
          destructorFunction: function(ptr) { _free(ptr); },
      });
    }

  function __embind_register_void(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
          isVoid: true, // void return values can be optimized out sometimes
          name: name,
          'argPackAdvance': 0,
          'fromWireType': function() {
              return undefined;
          },
          'toWireType': function(destructors, o) {
              // TODO: assert if anything else is given?
              return undefined;
          },
      });
    }

  
  function __emval_lookupTypes(argCount, argTypes, argWireTypes) {
      var a = new Array(argCount);
      for (var i = 0; i < argCount; ++i) {
          a[i] = requireRegisteredType(
              HEAP32[(argTypes >> 2) + i],
              "parameter " + i);
      }
      return a;
    }
  
  function requireHandle(handle) {
      if (!handle) {
          throwBindingError('Cannot use deleted val. handle = ' + handle);
      }
      return emval_handle_array[handle].value;
    }function __emval_call(handle, argCount, argTypes, argv) {
      handle = requireHandle(handle);
      var types = __emval_lookupTypes(argCount, argTypes);
  
      var args = new Array(argCount);
      for (var i = 0; i < argCount; ++i) {
          var type = types[i];
          args[i] = type['readValueFromPointer'](argv);
          argv += type['argPackAdvance'];
      }
  
      var rv = handle.apply(undefined, args);
      return __emval_register(rv);
    }


  function __emval_incref(handle) {
      if (handle > 4) {
          emval_handle_array[handle].refcount += 1;
      }
    }

  function __emval_take_value(type, argv) {
      type = requireRegisteredType(type, '_emval_take_value');
      var v = type['readValueFromPointer'](argv);
      return __emval_register(v);
    }

  function _abort() {
      abort();
    }

  function _emscripten_get_heap_size() {
      return HEAPU8.length;
    }

  function _emscripten_get_sbrk_ptr() {
      return 53936;
    }

  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
    }

  
  function emscripten_realloc_buffer(size) {
      try {
        // round size grow request up to wasm page size (fixed 64KB per spec)
        wasmMemory.grow((size - buffer.byteLength + 65535) >> 16); // .grow() takes a delta compared to the previous size
        updateGlobalBufferAndViews(wasmMemory.buffer);
        return 1 /*success*/;
      } catch(e) {
      }
    }function _emscripten_resize_heap(requestedSize) {
      var oldSize = _emscripten_get_heap_size();
      // With pthreads, races can happen (another thread might increase the size in between), so return a failure, and let the caller retry.
  
  
      var PAGE_MULTIPLE = 65536;
  
      // Memory resize rules:
      // 1. When resizing, always produce a resized heap that is at least 16MB (to avoid tiny heap sizes receiving lots of repeated resizes at startup)
      // 2. Always increase heap size to at least the requested size, rounded up to next page multiple.
      // 3a. If MEMORY_GROWTH_LINEAR_STEP == -1, excessively resize the heap geometrically: increase the heap size according to 
      //                                         MEMORY_GROWTH_GEOMETRIC_STEP factor (default +20%),
      //                                         At most overreserve by MEMORY_GROWTH_GEOMETRIC_CAP bytes (default 96MB).
      // 3b. If MEMORY_GROWTH_LINEAR_STEP != -1, excessively resize the heap linearly: increase the heap size by at least MEMORY_GROWTH_LINEAR_STEP bytes.
      // 4. Max size for the heap is capped at 2048MB-PAGE_MULTIPLE, or by WASM_MEM_MAX, or by ASAN limit, depending on which is smallest
      // 5. If we were unable to allocate as much memory, it may be due to over-eager decision to excessively reserve due to (3) above.
      //    Hence if an allocation fails, cut down on the amount of excess growth, in an attempt to succeed to perform a smaller allocation.
  
      var maxHeapSize = 2147483648 - PAGE_MULTIPLE;
      if (requestedSize > maxHeapSize) {
        return false;
      }
  
      var minHeapSize = 16777216;
  
      // Loop through potential heap size increases. If we attempt a too eager reservation that fails, cut down on the
      // attempted size and reserve a smaller bump instead. (max 3 times, chosen somewhat arbitrarily)
      for(var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown); // ensure geometric growth
        // but limit overreserving (default to capping at +96MB overgrowth at most)
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296 );
  
  
        var newSize = Math.min(maxHeapSize, alignUp(Math.max(minHeapSize, requestedSize, overGrownHeapSize), PAGE_MULTIPLE));
  
        var replacement = emscripten_realloc_buffer(newSize);
        if (replacement) {
  
          return true;
        }
      }
      return false;
    }

  
  
  var ENV={};
  
  function __getExecutableName() {
      return thisProgram || './this.program';
    }function _emscripten_get_environ() {
      if (!_emscripten_get_environ.strings) {
        // Default values.
        var env = {
          'USER': 'web_user',
          'LOGNAME': 'web_user',
          'PATH': '/',
          'PWD': '/',
          'HOME': '/home/web_user',
          // Browser language detection #8751
          'LANG': ((typeof navigator === 'object' && navigator.languages && navigator.languages[0]) || 'C').replace('-', '_') + '.UTF-8',
          '_': __getExecutableName()
        };
        // Apply the user-provided values, if any.
        for (var x in ENV) {
          env[x] = ENV[x];
        }
        var strings = [];
        for (var x in env) {
          strings.push(x + '=' + env[x]);
        }
        _emscripten_get_environ.strings = strings;
      }
      return _emscripten_get_environ.strings;
    }function _environ_get(__environ, environ_buf) {
      var strings = _emscripten_get_environ();
      var bufSize = 0;
      strings.forEach(function(string, i) {
        var ptr = environ_buf + bufSize;
        HEAP32[(((__environ)+(i * 4))>>2)]=ptr;
        writeAsciiToMemory(string, ptr);
        bufSize += string.length + 1;
      });
      return 0;
    }

  function _environ_sizes_get(penviron_count, penviron_buf_size) {
      var strings = _emscripten_get_environ();
      HEAP32[((penviron_count)>>2)]=strings.length;
      var bufSize = 0;
      strings.forEach(function(string) {
        bufSize += string.length + 1;
      });
      HEAP32[((penviron_buf_size)>>2)]=bufSize;
      return 0;
    }

  function _exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      exit(status);
    }

  function _fd_close(fd) {try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return e.errno;
  }
  }

  function _fd_read(fd, iov, iovcnt, pnum) {try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = SYSCALLS.doReadv(stream, iov, iovcnt);
      HEAP32[((pnum)>>2)]=num
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return e.errno;
  }
  }

  function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var HIGH_OFFSET = 0x100000000; // 2^32
      // use an unsigned operator on low and shift high by 32-bits
      var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
  
      var DOUBLE_LIMIT = 0x20000000000000; // 2^53
      // we also check for equality since DOUBLE_LIMIT + 1 == DOUBLE_LIMIT
      if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
        return -61;
      }
  
      FS.llseek(stream, offset, whence);
      (tempI64 = [stream.position>>>0,(tempDouble=stream.position,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((newOffset)>>2)]=tempI64[0],HEAP32[(((newOffset)+(4))>>2)]=tempI64[1]);
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return e.errno;
  }
  }

  function _fd_write(fd, iov, iovcnt, pnum) {try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = SYSCALLS.doWritev(stream, iov, iovcnt);
      HEAP32[((pnum)>>2)]=num
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return e.errno;
  }
  }

  
  function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      var aligned_dest_end = 0;
      var block_aligned_dest_end = 0;
      var dest_end = 0;
      // Test against a benchmarked cutoff limit for when HEAPU8.set() becomes faster to use.
      if ((num|0) >= 8192) {
        _emscripten_memcpy_big(dest|0, src|0, num|0)|0;
        return dest|0;
      }
  
      ret = dest|0;
      dest_end = (dest + num)|0;
      if ((dest&3) == (src&3)) {
        // The initial unaligned < 4-byte front.
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        aligned_dest_end = (dest_end & -4)|0;
        block_aligned_dest_end = (aligned_dest_end - 64)|0;
        while ((dest|0) <= (block_aligned_dest_end|0) ) {
          HEAP32[((dest)>>2)]=((HEAP32[((src)>>2)])|0);
          HEAP32[(((dest)+(4))>>2)]=((HEAP32[(((src)+(4))>>2)])|0);
          HEAP32[(((dest)+(8))>>2)]=((HEAP32[(((src)+(8))>>2)])|0);
          HEAP32[(((dest)+(12))>>2)]=((HEAP32[(((src)+(12))>>2)])|0);
          HEAP32[(((dest)+(16))>>2)]=((HEAP32[(((src)+(16))>>2)])|0);
          HEAP32[(((dest)+(20))>>2)]=((HEAP32[(((src)+(20))>>2)])|0);
          HEAP32[(((dest)+(24))>>2)]=((HEAP32[(((src)+(24))>>2)])|0);
          HEAP32[(((dest)+(28))>>2)]=((HEAP32[(((src)+(28))>>2)])|0);
          HEAP32[(((dest)+(32))>>2)]=((HEAP32[(((src)+(32))>>2)])|0);
          HEAP32[(((dest)+(36))>>2)]=((HEAP32[(((src)+(36))>>2)])|0);
          HEAP32[(((dest)+(40))>>2)]=((HEAP32[(((src)+(40))>>2)])|0);
          HEAP32[(((dest)+(44))>>2)]=((HEAP32[(((src)+(44))>>2)])|0);
          HEAP32[(((dest)+(48))>>2)]=((HEAP32[(((src)+(48))>>2)])|0);
          HEAP32[(((dest)+(52))>>2)]=((HEAP32[(((src)+(52))>>2)])|0);
          HEAP32[(((dest)+(56))>>2)]=((HEAP32[(((src)+(56))>>2)])|0);
          HEAP32[(((dest)+(60))>>2)]=((HEAP32[(((src)+(60))>>2)])|0);
          dest = (dest+64)|0;
          src = (src+64)|0;
        }
        while ((dest|0) < (aligned_dest_end|0) ) {
          HEAP32[((dest)>>2)]=((HEAP32[((src)>>2)])|0);
          dest = (dest+4)|0;
          src = (src+4)|0;
        }
      } else {
        // In the unaligned copy case, unroll a bit as well.
        aligned_dest_end = (dest_end - 4)|0;
        while ((dest|0) < (aligned_dest_end|0) ) {
          HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
          HEAP8[(((dest)+(1))>>0)]=((HEAP8[(((src)+(1))>>0)])|0);
          HEAP8[(((dest)+(2))>>0)]=((HEAP8[(((src)+(2))>>0)])|0);
          HEAP8[(((dest)+(3))>>0)]=((HEAP8[(((src)+(3))>>0)])|0);
          dest = (dest+4)|0;
          src = (src+4)|0;
        }
      }
      // The remaining unaligned < 4 byte tail.
      while ((dest|0) < (dest_end|0)) {
        HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
        dest = (dest+1)|0;
        src = (src+1)|0;
      }
      return ret|0;
    }

  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var end = 0, aligned_end = 0, block_aligned_end = 0, value4 = 0;
      end = (ptr + num)|0;
  
      value = value & 0xff;
      if ((num|0) >= 67 /* 64 bytes for an unrolled loop + 3 bytes for unaligned head*/) {
        while ((ptr&3) != 0) {
          HEAP8[((ptr)>>0)]=value;
          ptr = (ptr+1)|0;
        }
  
        aligned_end = (end & -4)|0;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
  
        block_aligned_end = (aligned_end - 64)|0;
  
        while((ptr|0) <= (block_aligned_end|0)) {
          HEAP32[((ptr)>>2)]=value4;
          HEAP32[(((ptr)+(4))>>2)]=value4;
          HEAP32[(((ptr)+(8))>>2)]=value4;
          HEAP32[(((ptr)+(12))>>2)]=value4;
          HEAP32[(((ptr)+(16))>>2)]=value4;
          HEAP32[(((ptr)+(20))>>2)]=value4;
          HEAP32[(((ptr)+(24))>>2)]=value4;
          HEAP32[(((ptr)+(28))>>2)]=value4;
          HEAP32[(((ptr)+(32))>>2)]=value4;
          HEAP32[(((ptr)+(36))>>2)]=value4;
          HEAP32[(((ptr)+(40))>>2)]=value4;
          HEAP32[(((ptr)+(44))>>2)]=value4;
          HEAP32[(((ptr)+(48))>>2)]=value4;
          HEAP32[(((ptr)+(52))>>2)]=value4;
          HEAP32[(((ptr)+(56))>>2)]=value4;
          HEAP32[(((ptr)+(60))>>2)]=value4;
          ptr = (ptr + 64)|0;
        }
  
        while ((ptr|0) < (aligned_end|0) ) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      // The remaining bytes.
      while ((ptr|0) < (end|0)) {
        HEAP8[((ptr)>>0)]=value;
        ptr = (ptr+1)|0;
      }
      return (end-num)|0;
    }

  
  function _round(d) {
      d = +d;
      return d >= +0 ? +Math_floor(d + +0.5) : +Math_ceil(d - +0.5);
    }

  function _setTempRet0($i) {
      setTempRet0(($i) | 0);
    }

  
  
  function __isLeapYear(year) {
        return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
    }
  
  function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }
  
  
  var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
  
  var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while(days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
  
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
  
      return newDate;
    }function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
  
      var tm_zone = HEAP32[(((tm)+(40))>>2)];
  
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)],
        tm_gmtoff: HEAP32[(((tm)+(36))>>2)],
        tm_zone: tm_zone ? UTF8ToString(tm_zone) : ''
      };
  
      var pattern = UTF8ToString(format);
  
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate time representation
        // Modified Conversion Specifiers
        '%Ec': '%c',                      // Replaced by the locale's alternative appropriate date and time representation.
        '%EC': '%C',                      // Replaced by the name of the base year (period) in the locale's alternative representation.
        '%Ex': '%m/%d/%y',                // Replaced by the locale's alternative date representation.
        '%EX': '%H:%M:%S',                // Replaced by the locale's alternative time representation.
        '%Ey': '%y',                      // Replaced by the offset from %EC (year only) in the locale's alternative representation.
        '%EY': '%Y',                      // Replaced by the full alternative year representation.
        '%Od': '%d',                      // Replaced by the day of the month, using the locale's alternative numeric symbols, filled as needed with leading zeros if there is any alternative symbol for zero; otherwise, with leading <space> characters.
        '%Oe': '%e',                      // Replaced by the day of the month, using the locale's alternative numeric symbols, filled as needed with leading <space> characters.
        '%OH': '%H',                      // Replaced by the hour (24-hour clock) using the locale's alternative numeric symbols.
        '%OI': '%I',                      // Replaced by the hour (12-hour clock) using the locale's alternative numeric symbols.
        '%Om': '%m',                      // Replaced by the month using the locale's alternative numeric symbols.
        '%OM': '%M',                      // Replaced by the minutes using the locale's alternative numeric symbols.
        '%OS': '%S',                      // Replaced by the seconds using the locale's alternative numeric symbols.
        '%Ou': '%u',                      // Replaced by the weekday as a number in the locale's alternative representation (Monday=1).
        '%OU': '%U',                      // Replaced by the week number of the year (Sunday as the first day of the week, rules corresponding to %U ) using the locale's alternative numeric symbols.
        '%OV': '%V',                      // Replaced by the week number of the year (Monday as the first day of the week, rules corresponding to %V ) using the locale's alternative numeric symbols.
        '%Ow': '%w',                      // Replaced by the number of the weekday (Sunday=0) using the locale's alternative numeric symbols.
        '%OW': '%W',                      // Replaced by the week number of the year (Monday as the first day of the week) using the locale's alternative numeric symbols.
        '%Oy': '%y',                      // Replaced by the year (offset from %C ) using the locale's alternative numeric symbols.
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
  
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      }
  
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      }
  
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        }
  
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      }
  
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      }
  
      function getWeekBasedYear(date) {
          var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            } else {
              return thisDate.getFullYear();
            }
          } else {
            return thisDate.getFullYear()-1;
          }
      }
  
      var EXPANSION_RULES_2 = {
        '%a': function(date) {
          return WEEKDAYS[date.tm_wday].substring(0,3);
        },
        '%A': function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function(date) {
          return MONTHS[date.tm_mon].substring(0,3);
        },
        '%B': function(date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function(date) {
          var year = date.tm_year+1900;
          return leadingNulls((year/100)|0,2);
        },
        '%d': function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function(date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function(date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year.
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes
          // January 4th, which is also the week that includes the first Thursday of the year, and
          // is also the first week that contains at least four days in the year.
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of
          // the last week of the preceding year; thus, for Saturday 2nd January 1999,
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th,
          // or 31st is a Monday, it and any following days are part of week 1 of the following year.
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
  
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function(date) {
          return getWeekBasedYear(date);
        },
        '%H': function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function(date) {
          var twelveHour = date.tm_hour;
          if (twelveHour == 0) twelveHour = 12;
          else if (twelveHour > 12) twelveHour -= 12;
          return leadingNulls(twelveHour, 2);
        },
        '%j': function(date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': function(date) {
          return leadingNulls(date.tm_mon+1, 2);
        },
        '%M': function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function() {
          return '\n';
        },
        '%p': function(date) {
          if (date.tm_hour >= 0 && date.tm_hour < 12) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function() {
          return '\t';
        },
        '%u': function(date) {
          return date.tm_wday || 7;
        },
        '%U': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53].
          // The first Sunday of January is the first day of week 1;
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year+1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
  
          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
            var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
  
          return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
        },
        '%V': function(date) {
          // Replaced by the week number of the year (Monday as the first day of the week)
          // as a decimal number [01,53]. If the week containing 1 January has four
          // or more days in the new year, then it is considered week 1.
          // Otherwise, it is the last week of the previous year, and the next week is week 1.
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          }
  
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }
  
          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference/7), 2);
        },
        '%w': function(date) {
          return date.tm_wday;
        },
        '%W': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53].
          // The first Monday of January is the first day of week 1;
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
  
          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
            var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
        },
        '%y': function(date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        '%Y': function(date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year+1900;
        },
        '%z': function(date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ).
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich).
          var off = date.tm_gmtoff;
          var ahead = off >= 0;
          off = Math.abs(off) / 60;
          // convert from minutes into hhmm format (which means 60 minutes = 100 units)
          off = (off / 60)*100 + (off % 60);
          return (ahead ? '+' : '-') + String("0000" + off).slice(-4);
        },
        '%Z': function(date) {
          return date.tm_zone;
        },
        '%%': function() {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
  
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      }
  
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    }function _strftime_l(s, maxsize, format, tm) {
      return _strftime(s, maxsize, format, tm); // no locale support yet
    }
FS.staticInit();;
embind_init_charCodes();
BindingError = Module['BindingError'] = extendError(Error, 'BindingError');;
InternalError = Module['InternalError'] = extendError(Error, 'InternalError');;
init_ClassHandle();
init_RegisteredPointer();
init_embind();;
UnboundTypeError = Module['UnboundTypeError'] = extendError(Error, 'UnboundTypeError');;
init_emval();;
var ASSERTIONS = false;

// Copyright 2017 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

/** @type {function(string, boolean=, number=)} */
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      if (ASSERTIONS) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      }
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}


// Copied from https://github.com/strophe/strophejs/blob/e06d027/src/polyfills.js#L149

// This code was written by Tyler Akins and has been placed in the
// public domain.  It would be nice if you left this header intact.
// Base64 code from Tyler Akins -- http://rumkin.com

/**
 * Decodes a base64 string.
 * @param {String} input The string to decode.
 */
var decodeBase64 = typeof atob === 'function' ? atob : function (input) {
  var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  var output = '';
  var chr1, chr2, chr3;
  var enc1, enc2, enc3, enc4;
  var i = 0;
  // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
  do {
    enc1 = keyStr.indexOf(input.charAt(i++));
    enc2 = keyStr.indexOf(input.charAt(i++));
    enc3 = keyStr.indexOf(input.charAt(i++));
    enc4 = keyStr.indexOf(input.charAt(i++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output = output + String.fromCharCode(chr1);

    if (enc3 !== 64) {
      output = output + String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output = output + String.fromCharCode(chr3);
    }
  } while (i < input.length);
  return output;
};

// Converts a string of base64 into a byte array.
// Throws error on invalid input.
function intArrayFromBase64(s) {
  if (typeof ENVIRONMENT_IS_NODE === 'boolean' && ENVIRONMENT_IS_NODE) {
    var buf;
    try {
      buf = Buffer.from(s, 'base64');
    } catch (_) {
      buf = new Buffer(s, 'base64');
    }
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }

  try {
    var decoded = decodeBase64(s);
    var bytes = new Uint8Array(decoded.length);
    for (var i = 0 ; i < decoded.length ; ++i) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  } catch (_) {
    throw new Error('Converting base64 string to bytes failed.');
  }
}

// If filename is a base64 data URI, parses and returns data (Buffer on node,
// Uint8Array otherwise). If filename is not a base64 data URI, returns undefined.
function tryParseAsDataURI(filename) {
  if (!isDataURI(filename)) {
    return;
  }

  return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}


// ASM_LIBRARY EXTERN PRIMITIVES: Int8Array,Int32Array,Math_floor,Math_ceil

var asmGlobalArg = {};
var asmLibraryArg = { "__assert_fail": ___assert_fail, "__cxa_allocate_exception": ___cxa_allocate_exception, "__cxa_atexit": ___cxa_atexit, "__cxa_throw": ___cxa_throw, "__lock": ___lock, "__map_file": ___map_file, "__syscall221": ___syscall221, "__syscall5": ___syscall5, "__syscall54": ___syscall54, "__syscall91": ___syscall91, "__unlock": ___unlock, "_embind_register_bool": __embind_register_bool, "_embind_register_class": __embind_register_class, "_embind_register_class_class_function": __embind_register_class_class_function, "_embind_register_class_constructor": __embind_register_class_constructor, "_embind_register_class_function": __embind_register_class_function, "_embind_register_class_property": __embind_register_class_property, "_embind_register_emval": __embind_register_emval, "_embind_register_enum": __embind_register_enum, "_embind_register_enum_value": __embind_register_enum_value, "_embind_register_float": __embind_register_float, "_embind_register_integer": __embind_register_integer, "_embind_register_memory_view": __embind_register_memory_view, "_embind_register_smart_ptr": __embind_register_smart_ptr, "_embind_register_std_string": __embind_register_std_string, "_embind_register_std_wstring": __embind_register_std_wstring, "_embind_register_void": __embind_register_void, "_emval_call": __emval_call, "_emval_decref": __emval_decref, "_emval_incref": __emval_incref, "_emval_take_value": __emval_take_value, "abort": _abort, "emscripten_get_sbrk_ptr": _emscripten_get_sbrk_ptr, "emscripten_memcpy_big": _emscripten_memcpy_big, "emscripten_resize_heap": _emscripten_resize_heap, "environ_get": _environ_get, "environ_sizes_get": _environ_sizes_get, "exit": _exit, "fd_close": _fd_close, "fd_read": _fd_read, "fd_seek": _fd_seek, "fd_write": _fd_write, "memory": wasmMemory, "round": _round, "setTempRet0": _setTempRet0, "strftime_l": _strftime_l, "table": wasmTable };
var asm = createWasm();
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = asm["__wasm_call_ctors"];
var _malloc = Module["_malloc"] = asm["malloc"];
var _free = Module["_free"] = asm["free"];
var ___errno_location = Module["___errno_location"] = asm["__errno_location"];
var _setThrew = Module["_setThrew"] = asm["setThrew"];
var __ZSt18uncaught_exceptionv = Module["__ZSt18uncaught_exceptionv"] = asm["_ZSt18uncaught_exceptionv"];
var ___getTypeName = Module["___getTypeName"] = asm["__getTypeName"];
var ___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = asm["__embind_register_native_and_builtin_types"];
var stackSave = Module["stackSave"] = asm["stackSave"];
var stackAlloc = Module["stackAlloc"] = asm["stackAlloc"];
var stackRestore = Module["stackRestore"] = asm["stackRestore"];
var __growWasmMemory = Module["__growWasmMemory"] = asm["__growWasmMemory"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_i = Module["dynCall_i"] = asm["dynCall_i"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_did = Module["dynCall_did"] = asm["dynCall_did"];
var dynCall_diddd = Module["dynCall_diddd"] = asm["dynCall_diddd"];
var dynCall_didd = Module["dynCall_didd"] = asm["dynCall_didd"];
var dynCall_di = Module["dynCall_di"] = asm["dynCall_di"];
var dynCall_vid = Module["dynCall_vid"] = asm["dynCall_vid"];
var dynCall_diii = Module["dynCall_diii"] = asm["dynCall_diii"];
var dynCall_viid = Module["dynCall_viid"] = asm["dynCall_viid"];
var dynCall_dii = Module["dynCall_dii"] = asm["dynCall_dii"];
var dynCall_didid = Module["dynCall_didid"] = asm["dynCall_didid"];
var dynCall_dididi = Module["dynCall_dididi"] = asm["dynCall_dididi"];
var dynCall_vidid = Module["dynCall_vidid"] = asm["dynCall_vidid"];
var dynCall_vididd = Module["dynCall_vididd"] = asm["dynCall_vididd"];
var dynCall_vididdd = Module["dynCall_vididdd"] = asm["dynCall_vididdd"];
var dynCall_viddd = Module["dynCall_viddd"] = asm["dynCall_viddd"];
var dynCall_viiid = Module["dynCall_viiid"] = asm["dynCall_viiid"];
var dynCall_iiiid = Module["dynCall_iiiid"] = asm["dynCall_iiiid"];
var dynCall_dddd = Module["dynCall_dddd"] = asm["dynCall_dddd"];
var dynCall_vidd = Module["dynCall_vidd"] = asm["dynCall_vidd"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viffii = Module["dynCall_viffii"] = asm["dynCall_viffii"];
var dynCall_dddddd = Module["dynCall_dddddd"] = asm["dynCall_dddddd"];
var dynCall_diddddd = Module["dynCall_diddddd"] = asm["dynCall_diddddd"];
var dynCall_diddidd = Module["dynCall_diddidd"] = asm["dynCall_diddidd"];
var dynCall_didddii = Module["dynCall_didddii"] = asm["dynCall_didddii"];
var dynCall_didddddii = Module["dynCall_didddddii"] = asm["dynCall_didddddii"];
var dynCall_didi = Module["dynCall_didi"] = asm["dynCall_didi"];
var dynCall_dd = Module["dynCall_dd"] = asm["dynCall_dd"];
var dynCall_dididdd = Module["dynCall_dididdd"] = asm["dynCall_dididdd"];
var dynCall_ddd = Module["dynCall_ddd"] = asm["dynCall_ddd"];
var dynCall_diddi = Module["dynCall_diddi"] = asm["dynCall_diddi"];
var dynCall_vidi = Module["dynCall_vidi"] = asm["dynCall_vidi"];
var dynCall_iifi = Module["dynCall_iifi"] = asm["dynCall_iifi"];
var dynCall_fi = Module["dynCall_fi"] = asm["dynCall_fi"];
var dynCall_fiiii = Module["dynCall_fiiii"] = asm["dynCall_fiiii"];
var dynCall_viiiidd = Module["dynCall_viiiidd"] = asm["dynCall_viiiidd"];
var dynCall_diid = Module["dynCall_diid"] = asm["dynCall_diid"];
var dynCall_diiddd = Module["dynCall_diiddd"] = asm["dynCall_diiddd"];
var dynCall_diidd = Module["dynCall_diidd"] = asm["dynCall_diidd"];
var dynCall_diiii = Module["dynCall_diiii"] = asm["dynCall_diiii"];
var dynCall_diidid = Module["dynCall_diidid"] = asm["dynCall_diidid"];
var dynCall_diididi = Module["dynCall_diididi"] = asm["dynCall_diididi"];
var dynCall_viidid = Module["dynCall_viidid"] = asm["dynCall_viidid"];
var dynCall_viididd = Module["dynCall_viididd"] = asm["dynCall_viididd"];
var dynCall_viididdd = Module["dynCall_viididdd"] = asm["dynCall_viididdd"];
var dynCall_viiddd = Module["dynCall_viiddd"] = asm["dynCall_viiddd"];
var dynCall_viidd = Module["dynCall_viidd"] = asm["dynCall_viidd"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_viiffii = Module["dynCall_viiffii"] = asm["dynCall_viiffii"];
var dynCall_diiddidd = Module["dynCall_diiddidd"] = asm["dynCall_diiddidd"];
var dynCall_diiddddd = Module["dynCall_diiddddd"] = asm["dynCall_diiddddd"];
var dynCall_diidddii = Module["dynCall_diidddii"] = asm["dynCall_diidddii"];
var dynCall_diidddddii = Module["dynCall_diidddddii"] = asm["dynCall_diidddddii"];
var dynCall_diidi = Module["dynCall_diidi"] = asm["dynCall_diidi"];
var dynCall_diididdd = Module["dynCall_diididdd"] = asm["dynCall_diididdd"];
var dynCall_diiddi = Module["dynCall_diiddi"] = asm["dynCall_diiddi"];
var dynCall_viidi = Module["dynCall_viidi"] = asm["dynCall_viidi"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_iiifi = Module["dynCall_iiifi"] = asm["dynCall_iiifi"];
var dynCall_fii = Module["dynCall_fii"] = asm["dynCall_fii"];
var dynCall_fiiiii = Module["dynCall_fiiiii"] = asm["dynCall_fiiiii"];
var dynCall_viiiiidd = Module["dynCall_viiiiidd"] = asm["dynCall_viiiiidd"];
var dynCall_viif = Module["dynCall_viif"] = asm["dynCall_viif"];
var dynCall_viiif = Module["dynCall_viiif"] = asm["dynCall_viiif"];
var dynCall_iiiif = Module["dynCall_iiiif"] = asm["dynCall_iiiif"];
var dynCall_diddid = Module["dynCall_diddid"] = asm["dynCall_diddid"];
var dynCall_didddid = Module["dynCall_didddid"] = asm["dynCall_didddid"];
var dynCall_didddi = Module["dynCall_didddi"] = asm["dynCall_didddi"];
var dynCall_diiddid = Module["dynCall_diiddid"] = asm["dynCall_diiddid"];
var dynCall_diidddid = Module["dynCall_diidddid"] = asm["dynCall_diidddid"];
var dynCall_diidddi = Module["dynCall_diidddi"] = asm["dynCall_diidddi"];
var dynCall_iid = Module["dynCall_iid"] = asm["dynCall_iid"];
var dynCall_id = Module["dynCall_id"] = asm["dynCall_id"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_viijii = Module["dynCall_viijii"] = asm["dynCall_viijii"];
var dynCall_jiji = Module["dynCall_jiji"] = asm["dynCall_jiji"];
var dynCall_iidiiii = Module["dynCall_iidiiii"] = asm["dynCall_iidiiii"];
var dynCall_iiiiii = Module["dynCall_iiiiii"] = asm["dynCall_iiiiii"];
var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = asm["dynCall_iiiiiiiii"];
var dynCall_iiiiiii = Module["dynCall_iiiiiii"] = asm["dynCall_iiiiiii"];
var dynCall_iiiiij = Module["dynCall_iiiiij"] = asm["dynCall_iiiiij"];
var dynCall_iiiiid = Module["dynCall_iiiiid"] = asm["dynCall_iiiiid"];
var dynCall_iiiiijj = Module["dynCall_iiiiijj"] = asm["dynCall_iiiiijj"];
var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = asm["dynCall_iiiiiiii"];
var dynCall_iiiiiijj = Module["dynCall_iiiiiijj"] = asm["dynCall_iiiiiijj"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];



// === Auto-generated postamble setup entry stuff ===

Module['asm'] = asm;































































































































































































































































































































var calledRun;


/**
 * @constructor
 * @this {ExitStatus}
 */
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
}

var calledMain = false;


dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
};





/** @type {function(Array=)} */
function run(args) {
  args = args || arguments_;

  if (runDependencies > 0) {
    return;
  }


  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    if (calledRun) return;
    calledRun = true;

    if (ABORT) return;

    initRuntime();

    preMain();

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();


    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else
  {
    doRun();
  }
}
Module['run'] = run;


function exit(status, implicit) {

  // if this is just main exit-ing implicitly, and the status is 0, then we
  // don't need to do anything here and can just leave. if the status is
  // non-zero, though, then we need to report it.
  // (we may have warned about this earlier, if a situation justifies doing so)
  if (implicit && noExitRuntime && status === 0) {
    return;
  }

  if (noExitRuntime) {
  } else {

    ABORT = true;
    EXITSTATUS = status;

    exitRuntime();

    if (Module['onExit']) Module['onExit'](status);
  }

  quit_(status, new ExitStatus(status));
}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}


  noExitRuntime = true;

run();





// {{MODULE_ADDITIONS}}



/* global Module */

"use strict";

console.log(
	"running%c Maximilian v2.0.2 (Wasm)",
	"font-weight: bold; background: #222; color: #bada55"
);



//NOTE: This is the main thing that post.js adds to Maximilian setup, a Module export definition which is required for the WASM design pattern
export default Module;

