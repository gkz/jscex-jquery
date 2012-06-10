(function(){
  var Jscex, XMLHttpRequest, $, AsyncBuilder;
  Jscex = require('jscex');
  require('jscex-jit').init(Jscex);
  require('jscex-async').init(Jscex);
  require('jscex-async-powerpack').init(Jscex);
  XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
  $ = require('jquery');
  $.support.cors = true;
  $.ajaxSettings.xhr = function(){
    return new XMLHttpRequest;
  };
  /* Convert a Promise (Q, jQuery, Dojo) object into a Task */
  Jscex.Async.Binding.fromPromise = function(p){
    return Jscex.Async.Task.create(function(t){
      p.then(function(it){
        return t.complete('success', it);
      }, function(it){
        return t.complete('failure', it);
      });
      return t;
    });
  };
  /* Our own monad that runs on $.Deferred instead of Task */
  AsyncBuilder = (function(){
    AsyncBuilder.displayName = 'AsyncBuilder';
    var prototype = AsyncBuilder.prototype, constructor = AsyncBuilder;
    prototype.Start = function(_this, step){
      var __;
      __ = $.Deferred();
      step.next(_this, function(type, value, target){
        switch (type) {
        case 'normal':
        case 'return':
          __.resolve(value);
          break;
        case 'throw':
          __.reject(value);
          break;
        default:
          throw new Error("Unsupported type: " + type);
        }
      });
      return __;
    };
    prototype.Bind = function(promise, generator){
      return {
        next: function(_this, cb){
          return promise.then(function(result){
            var step;
            try {
              step = generator.call(_this, result);
            } catch (e) {
              return cb('throw', e);
            }
            step.next(_this, cb);
          }, function(error){
            cb('throw', error);
          });
        }
      };
    };
    function AsyncBuilder(){}
    return AsyncBuilder;
  }());
  __importAll(AsyncBuilder.prototype, Jscex.BuilderBase.prototype);
  Jscex.binders['async-jquery'] = '$await';
  Jscex.builders['async-jquery'] = new AsyncBuilder;
  Jscex.modules['async-jquery'] = true;
  /* Compile a function containing the special $await keyword.
  
     Once invoked, we implicitly start the task, and return a
     deferred Promise object representing its result.
  */
  $.evalAsync = function(cb){
    return eval(Jscex.compile('async-jquery', cb));
  };
  /* Turn off Jscex logging by default */
  Jscex.logger.level = 999;
  /* Export the $ object extended with $.Jscex */
  $.Jscex = Jscex;
  module.exports = $;
  function __importAll(obj, src){
    for (var key in src) obj[key] = src[key];
    return obj;
  }
}).call(this);
