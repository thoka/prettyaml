(function () {
  "use strict";

  var typeOf = require('remedial').typeOf
    ;

  var indent = function (level) {
    var spaces = '';
    for (var i = 0; i < level; i++) {
      spaces += '  ';
    }
    return spaces;
  }

  function stringify(data) {
    var handlers
      , indentLevel = -1
      ;

    handlers = {
        "undefined": function () {
          // objects will not have `undefined` converted to `null`
          // as this may have unintended consequences
          // For arrays, however, this behavior seems appropriate
          return '';
        }
      , "null": function () {
          return '';
        }
      , "number": function (x) {
          return x;
        }
      , "boolean": function (x) {
          return x ? 'true' : 'false';
        }
      , "string": function (x) {
          // if the string contains newlines, use the | formatting
          if (x.indexOf('\n') != -1) {
            x = x.trim()
            return '|\n' + indent(indentLevel + 1) + x.replace(/\n/g, '\n' + indent(indentLevel + 1));
          }
          // if the string has [], {}, \t,  or is a enquoted number, use quotes
          else if (
            (x.indexOf('[') == 0) ||
            (x.indexOf(']') == x.length-1) ||
            (x.indexOf('{') == 0) ||
            (x.indexOf('}') == x.length-1) ||
            (x.indexOf('\t') != -1) ||
            (x == 'true') ||
            (x == 'false') ||
            (!isNaN(parseFloat(x)) && isFinite(x))
          ) {
            return JSON.stringify(x);
          }
          else {
            return x;
          }
        }
      , "array": function (x) {
          var output = ''
            ;

          if (0 === x.length) {
            output += '[]';
            return output;
          }

          indentLevel++;
          x.forEach(function (y) {
            // TODO how should `undefined` be handled?
            var handler = handlers[typeOf(y)]
              ;

            if (!handler) {
              throw new Error('cannot encode this: ' + typeOf(y));
            }

            output += '\n' + indent(indentLevel) + '- ' + handler(y);
             
          });
          indentLevel--;
          
          return output;
        }
      , "object": function (x) {
          var output = ''
            ;

          if (0 === Object.keys(x).length) {
            output += '{}';
            return output;
          }

          indentLevel++;
          Object.keys(x).forEach(function (k) {
            var val = x[k]
              , handler = handlers[typeOf(val)]
              ;

            if ('undefined' === typeof val) {
              // the user should do
              // delete obj.key
              // and not
              // obj.key = undefined
              // but we'll error on the side of caution
              return;
            }

            if (!handler) {
              throw new Error('cannot encode this: ' + typeOf(val));
            }

            // enquote the key if it is not a so recognizable string as it seems
            if (!(/^\w+$/.exec(k))) {
              k.replace(/"/g, '\\"');
              k = '"' + k + '"';
            }

            output += '\n' + indent(indentLevel) + k + ': ' + handler(val);
          });
          indentLevel--;

          return output;
        }
      , "function": function () {
          // TODO this should throw or otherwise be ignored
          return '[object Function]';
        }
    };

    var result = handlers[typeOf(data)](data);
    if (result[0] == '\n') {
      result = result.slice(1);
    }
    return result;
  }

  module.exports.stringify = stringify;
}());
