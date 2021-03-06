'use strict';
var Travis, entity, key, name, _i, _j, _len, _len1, _ref, _ref1, _ref2,
  __slice = [].slice,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Travis = function(options) {
  return new Travis.Session(options);
};

Travis.version = '0.1.1';

Travis.endpoints = {
  org: 'https://api.travis-ci.org',
  pro: 'https://api.travis-ci.com'
};

Travis.endpoints["default"] = Travis.endpoints.org;

Travis.callbacks = {};

Travis.globalCallbacks = [];

Travis.callbacksFor = function(event) {
  return Travis.globalCallbacks.concat(Travis.callbacks[event] || []);
};

Travis.notify = function(event, payload) {
  var callback, _i, _len, _ref, _results;
  _ref = Travis.callbacksFor(event);
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    callback = _ref[_i];
    _results.push(callback({
      data: payload,
      type: event
    }));
  }
  return _results;
};

Travis.debug = function() {
  return Travis.on(function(e) {
    return console.log(e.type, e.data);
  });
};

Travis.on = function() {
  var callback, event, events, _i, _j, _len, _results;
  events = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
  if (events.length === 0) {
    return Travis.globalCallbacks.push(callback);
  } else {
    _results = [];
    for (_j = 0, _len = events.length; _j < _len; _j++) {
      event = events[_j];
      if (Travis.callbacks[event] == null) {
        Travis.callbacks[event] = [];
      }
      _results.push(Travis.callbacks[event].push(callback));
    }
    return _results;
  }
};

Travis._setup = function() {
  var entity, name, _ref;
  _ref = Travis.Entity;
  for (name in _ref) {
    entity = _ref[name];
    if (entity._setup != null) {
      entity._setup();
    }
  }
  return Travis._setup = function() {};
};

if (typeof module !== "undefined" && module !== null) {
  module.exports = Travis;
}

if (typeof window !== "undefined" && window !== null) {
  window.exports = Travis;
}

this.Travis = Travis;

Travis.Delegator = {
  define: function() {
    var caller, constructor, methods, _i;
    methods = 3 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 2) : (_i = 0, []), caller = arguments[_i++], constructor = arguments[_i++];
    return this.eachMethod.apply(this, __slice.call(methods).concat([(function(_this) {
      return function(method) {
        return _this.delegate(caller, constructor, method);
      };
    })(this)]));
  },
  defineNested: function() {
    var caller, constructor, methods, _i;
    methods = 3 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 2) : (_i = 0, []), caller = arguments[_i++], constructor = arguments[_i++];
    return this.eachMethod.apply(this, __slice.call(methods).concat([(function(_this) {
      return function(method) {
        return _this.delegateNested(caller, constructor, method);
      };
    })(this)]));
  },
  defineSimple: function() {
    var caller, constructor, methods, _i;
    methods = 3 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 2) : (_i = 0, []), caller = arguments[_i++], constructor = arguments[_i++];
    return this.eachMethod.apply(this, __slice.call(methods).concat([(function(_this) {
      return function(method) {
        return _this.delegateSimple(caller, constructor, method);
      };
    })(this)]));
  },
  eachMethod: function() {
    var callback, method, methods, subMethod, _i, _j, _len, _results;
    methods = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
    _results = [];
    for (_j = 0, _len = methods.length; _j < _len; _j++) {
      method = methods[_j];
      if (typeof method === 'string') {
        _results.push(callback(method));
      } else if (method.delegationMethods) {
        _results.push((function() {
          var _k, _len1, _ref, _results1;
          _ref = method.delegationMethods();
          _results1 = [];
          for (_k = 0, _len1 = _ref.length; _k < _len1; _k++) {
            subMethod = _ref[_k];
            _results1.push(callback(subMethod));
          }
          return _results1;
        })());
      } else if (method.prototype != null) {
        _results.push((function() {
          var _results1;
          _results1 = [];
          for (subMethod in method.prototype) {
            _results1.push(callback(subMethod));
          }
          return _results1;
        })());
      } else {
        _results.push((function() {
          var _results1;
          _results1 = [];
          for (subMethod in method) {
            _results1.push(callback(subMethod));
          }
          return _results1;
        })());
      }
    }
    return _results;
  },
  delegate: function(caller, constructor, method) {
    if (method.indexOf('_') === 0) {
      return;
    }
    return constructor[method] != null ? constructor[method] : constructor[method] = function() {
      var args, callback, outerPromise, _i;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
      if (typeof callback === 'function') {
        return constructor[method].apply(this, args).then(callback);
      } else {
        args.push(callback);
        outerPromise = constructor.then != null ? constructor : constructor.call(caller);
        return new Travis.Promise(function(delegationPromise) {
          outerPromise.then(function(outerResult) {
            var innerPromise;
            innerPromise = outerResult[method].apply(outerResult, args);
            innerPromise.then(function(innerResult) {
              return delegationPromise.succeed(innerResult);
            });
            return innerPromise["catch"](function(innerError) {
              return delegationPromise.fail(innerError);
            });
          });
          return outerPromise["catch"](function(outerError) {
            return delegationPromise.fail(outerError);
          });
        });
      }
    };
  },
  delegateNested: function(caller, constructor, method) {
    return constructor[method] != null ? constructor[method] : constructor[method] = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return constructor.call(caller, function(result) {
        var _ref;
        return (_ref = result[method]).call.apply(_ref, [result].concat(__slice.call(args)));
      });
    };
  },
  delegateSimple: function(caller, constructor, method) {
    return constructor[method] != null ? constructor[method] : constructor[method] = constructor.call(caller)[method];
  }
};

Travis.Entities = {
  account: {
    index: ['login', ['type', 'id']],
    one: ['account'],
    many: ['accounts']
  },
  broadcast: {
    index: ['id'],
    one: ['broadcast'],
    many: ['broadcasts']
  },
  build: {
    index: ['id', ['repository_id', 'number']],
    one: ['build'],
    many: ['builds']
  },
  repository: {
    index: ['id', 'slug'],
    one: ['repo', 'repository'],
    many: ['repos', 'repositories']
  }
};

Travis.EntityMap = {
  one: {},
  many: {}
};

_ref = Travis.Entities;
for (name in _ref) {
  entity = _ref[name];
  entity.name = name;
  _ref1 = entity.one;
  for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
    key = _ref1[_i];
    Travis.EntityMap.one[key] = entity;
  }
  _ref2 = entity.many;
  for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
    key = _ref2[_j];
    Travis.EntityMap.many[key] = entity;
  }
}

Travis.Entity = (function() {
  Entity._setup = function() {
    var attribute, defineAttribute, _k, _len2, _ref3, _results;
    defineAttribute = (function(_this) {
      return function(attr) {
        var _base;
        return (_base = _this.prototype)[attr] != null ? _base[attr] : _base[attr] = function(callback) {
          return this.attribute(attr, callback);
        };
      };
    })(this);
    if (this.prototype.attributeNames != null) {
      _ref3 = this.prototype.attributeNames;
      for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
        attribute = _ref3[_k];
        defineAttribute(attribute);
      }
    }
    if (this.prototype.computedAttributes != null) {
      _results = [];
      for (attribute in this.prototype.computedAttributes) {
        _results.push(defineAttribute(attribute));
      }
      return _results;
    }
  };

  function Entity(session, store) {
    this.session = session;
    this._store = store;
    this._setup();
  }

  Entity.prototype.complete = function(checkAttributes) {
    if (checkAttributes == null) {
      checkAttributes = true;
    }
    if (this._fetch == null) {
      return true;
    }
    if (checkAttributes && (this.attributeNames != null) && this.hasAttributes()) {
      return true;
    }
    return this._store().complete;
  };

  Entity.prototype.hasAttributes = function() {
    var attribute, data, dependsOn, list, _k, _len2, _ref3, _ref4;
    list = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (list.length === 0) {
      list = this.attributeNames;
    }
    data = this._store().data;
    for (_k = 0, _len2 = list.length; _k < _len2; _k++) {
      attribute = list[_k];
      if (dependsOn = (_ref3 = this.computedAttributes) != null ? (_ref4 = _ref3[attribute]) != null ? _ref4.dependsOn : void 0 : void 0) {
        if (!this.hasAttributes.apply(this, dependsOn)) {
          return false;
        }
      } else {
        if (data[this.session._clientName(attribute)] === void 0) {
          return false;
        }
      }
    }
    return true;
  };

  Entity.prototype.attributes = function() {
    var callback, list, promise, value, _k, _ref3;
    list = 2 <= arguments.length ? __slice.call(arguments, 0, _k = arguments.length - 1) : (_k = 0, []), callback = arguments[_k++];
    if (typeof callback === 'string') {
      list.push(callback);
      callback = null;
    }
    if (list.length === 0) {
      list = this.attributeNames;
      if (this.computedAttributes != null) {
        _ref3 = this.computedAttributes;
        for (key in _ref3) {
          value = _ref3[key];
          list.push(key);
        }
      }
    }
    if (this.complete(false) || this.hasAttributes.apply(this, list)) {
      promise = new Travis.Promise((function(_this) {
        return function(p) {
          return p.succeed(_this._attributes(list));
        };
      })(this));
    } else {
      promise = this._fetch().wrap((function(_this) {
        return function() {
          _this._store().complete = true;
          return _this._attributes(list);
        };
      })(this));
    }
    return promise.then(callback);
  };

  Entity.prototype.attribute = function(name, callback) {
    return this.attributes(name).wrap(function(a) {
      return a[name];
    }).then(callback);
  };

  Entity.prototype.reload = function() {
    var store;
    store = this._store();
    store.cache = {};
    store.data = {};
    store.complete = false;
    return this;
  };

  Entity.prototype._setup = function() {};

  Entity.prototype._attributes = function(list) {
    var computation, compute, data, result, value, _k, _len2, _ref3;
    data = this._store().data;
    result = {};
    compute = {};
    for (_k = 0, _len2 = list.length; _k < _len2; _k++) {
      name = list[_k];
      if (computation = (_ref3 = this.computedAttributes) != null ? _ref3[name] : void 0) {
        compute[name] = computation;
      } else {
        result[name] = data[this.session._clientName(name)];
      }
    }
    for (key in compute) {
      value = compute[key];
      result[key] = value.compute(data);
    }
    return result;
  };

  Entity.prototype._cache = function() {
    var bucket, cache, callback, key, _base, _k;
    bucket = 3 <= arguments.length ? __slice.call(arguments, 0, _k = arguments.length - 2) : (_k = 0, []), key = arguments[_k++], callback = arguments[_k++];
    cache = this._store().cache;
    if (cache[bucket] == null) {
      cache[bucket] = {};
    }
    return (_base = cache[bucket])[key] != null ? _base[key] : _base[key] = callback.call(this);
  };

  Entity.prototype.then = function(callback) {
    if (callback != null) {
      callback(this);
    }
    return this;
  };

  Entity.prototype.run = function() {
    return this;
  };

  Entity.prototype["catch"] = function() {
    return this;
  };

  Entity.prototype.onSuccess = function() {
    return this;
  };

  Entity.prototype.onFailure = function() {
    return this;
  };

  Entity.prototype.wrap = function() {
    var delegations, wrapper, _k, _ref3;
    delegations = 2 <= arguments.length ? __slice.call(arguments, 0, _k = arguments.length - 1) : (_k = 0, []), wrapper = arguments[_k++];
    return (_ref3 = Travis.Promise.succeed(wrapper(this))).expect.apply(_ref3, delegations);
  };

  return Entity;

})();

Travis.HTTP = (function() {
  HTTP.delegationMethods = function() {
    return ['get', 'head', 'post', 'put', 'patch', 'delete', 'request'];
  };

  HTTP.prototype.get = function(path, params, options) {
    return this.request('GET', path, params, options);
  };

  HTTP.prototype.head = function(path, params, options) {
    return this.request('HEAD', path, params, options);
  };

  HTTP.prototype.post = function(path, params, options) {
    return this.request('POST', path, params, options);
  };

  HTTP.prototype.put = function(path, params, options) {
    return this.request('PUT', path, params, options);
  };

  HTTP.prototype.patch = function(path, params, options) {
    return this.request('PATCH', path, params, options);
  };

  HTTP.prototype["delete"] = function(path, params, options) {
    return this.request('DELETE', path, params, options);
  };

  HTTP.prototype.request = function(method, path, params, options) {
    var http, promise;
    options = this.prepareRequest(method, path, params, options);
    http = this;
    promise = new Travis.Promise(function(promise) {
      var generateError, generateResponse, sendRequest;
      generateError = function(status, headers, body) {
        var error;
        error = new Error("HTTP " + (status.toString()) + ": " + body);
        error.response = generateResponse(status, headers, body);
        return error;
      };
      generateResponse = function(status, headers, body) {
        var response;
        response = {
          status: status,
          headers: headers,
          body: body
        };
        if ((body != null) && method !== 'HEAD' && /^application\/json/.test(headers['content-type'])) {
          response.body = JSON.parse(body);
        }
        Travis.notify('http:response', response);
        return response;
      };
      sendRequest = function(opt, updatedOpt) {
        var value;
        for (key in updatedOpt) {
          value = updatedOpt[key];
          opt[key] = value;
        }
        Travis.notify('http:request', opt);
        return http.rawRequest(opt, function(status, headers, body) {
          switch (status) {
            case 200:
            case 201:
            case 204:
              return promise.succeed(generateResponse(status, headers, body));
            case 301:
            case 302:
            case 303:
              return sendRequest(opt, {
                url: headers['location'],
                method: method === 'HEAD' ? method : 'GET'
              });
            case 307:
            case 308:
              return sendRequest(opt, {
                url: headers['location']
              });
            default:
              return promise.fail(generateError(status, headers, body));
          }
        });
      };
      return sendRequest(options);
    });
    if (method !== 'HEAD' && method !== 'GET') {
      promise.run();
    }
    if (options.callback != null) {
      promise.then(options.callback);
    }
    return promise;
  };

  HTTP.prototype.prepareRequest = function(method, path, params, options) {
    var value, _ref3;
    if (path == null) {
      throw new Error("path is missing");
    }
    if (typeof options === 'function') {
      options = {
        callback: options
      };
    }
    if (options == null) {
      options = {};
    }
    options.method = method;
    if (options.headers == null) {
      options.headers = {};
    }
    options.url = /^https?:/.test(path) ? path : "" + this.base + path;
    _ref3 = this.defaultHeaders;
    for (key in _ref3) {
      value = _ref3[key];
      if (options.headers[key] == null) {
        options.headers[key] = value;
      }
    }
    if (typeof params === 'function') {
      options.callback = params;
      params = null;
    }
    if (params != null) {
      this.setParams(options, params);
    }
    return options;
  };

  HTTP.prototype.setParams = function(options, params) {
    if (options.method === 'HEAD' || options.method === 'GET') {
      return this.setQueryParams(options, params);
    } else {
      return this.setBody(options, params);
    }
  };

  HTTP.prototype.setBody = function(options, params) {
    if (typeof params !== 'string') {
      options.headers['Content-Type'] = 'application/json';
      params = JSON.stringify(params);
    }
    return options.body = params;
  };

  HTTP.prototype.setQueryParams = function(options, params) {
    var separator, value, _results;
    separator = options.url.indexOf('?') >= 0 ? '&' : '?';
    if (typeof params === 'string') {
      return options.url += "" + separator + params;
    } else {
      _results = [];
      for (key in params) {
        value = params[key];
        options.url += "" + separator + (encodeURIComponent(key)) + "=" + (encodeURIComponent(value));
        _results.push(separator = '&');
      }
      return _results;
    }
  };

  function HTTP(options) {
    var xhrHeaders, _base;
    this.base = options.base;
    this.defaultHeaders = options.headers || {};
    if ((_base = this.defaultHeaders)['User-Agent'] == null) {
      _base['User-Agent'] = "travis.js/" + Travis.version + " " + (Travis.System.info());
    }
    if (typeof XMLHttpRequest !== "undefined" && XMLHttpRequest !== null) {
      xhrHeaders = options.xhrHeaders || ["content-type", "cache-control", "expires", "etag", "last-modified"];
      this.rawRequest = function(options, callback) {
        var req, value, _ref3;
        req = new XMLHttpRequest();
        req.open(options.method, options.url, true);
        _ref3 = options.headers;
        for (name in _ref3) {
          value = _ref3[name];
          if (name.toLowerCase() !== 'user-agent') {
            req.setRequestHeader(name, value);
          }
        }
        req.onreadystatechange = function() {
          var header, headers, _k, _len2;
          if (req.readyState === 4) {
            headers = {};
            for (_k = 0, _len2 = xhrHeaders.length; _k < _len2; _k++) {
              header = xhrHeaders[_k];
              headers[header.toLowerCase()] = req.getResponseHeader(header);
            }
            return callback(req.status, headers, req.responseText);
          }
        };
        return req.send(options.body);
      };
    } else {
      this.url = require('url');
      this.adapters = {
        "http:": require('http'),
        "https:": require('https')
      };
      this.rawRequest = function(options, callback) {
        var adapter, httpOptions, parsed, request, responseBody;
        parsed = this.url.parse(options.url);
        responseBody = "";
        adapter = this.adapters[parsed.protocol] || this.adapters['http:'];
        httpOptions = {
          host: parsed.hostname,
          path: parsed.path,
          method: options.method,
          headers: options.headers
        };
        if (parsed.port != null) {
          httpOptions.port = parsed.port;
        }
        request = adapter.request(httpOptions, function(response) {
          response.on('data', function(chunk) {
            return responseBody += chunk;
          });
          return response.on('end', function() {
            return callback(response.statusCode, response.headers, responseBody);
          });
        });
        request.on('error', function(error) {
          throw error;
        });
        if (options.body != null) {
          request.write(options.body);
        }
        return request.end();
      };
    }
  }

  return HTTP;

})();

Travis.Promise = (function() {
  Promise.succeed = function(data) {
    return (new Travis.Promise).succeed(data);
  };

  function Promise(closure) {
    this._onSuccess = [];
    this._onFailure = [];
    this.data = null;
    this.closure = closure;
    this.setState('sleeping');
  }

  Promise.prototype.setState = function(stateName, data) {
    if (data != null) {
      this.data = data;
    }
    this.sleeping = stateName === 'sleeping';
    this.running = stateName === 'running';
    this.failed = stateName === 'failed';
    this.succeeded = stateName === 'succeeded';
    return this;
  };

  Promise.prototype.run = function() {
    if (this.sleeping) {
      this.setState('running');
      this.closure(this);
    }
    return this;
  };

  Promise.prototype.succeed = function(data) {
    var callback, _k, _len2, _ref3;
    this.setState('succeeded', data);
    Travis.notify('promise:succeed', data);
    _ref3 = this._onSuccess;
    for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
      callback = _ref3[_k];
      callback(this.data);
    }
    this._onSuccess = [];
    this._onFailure = [];
    return this;
  };

  Promise.prototype.fail = function(data) {
    var callback, _k, _len2, _ref3;
    this.setState('failed', data);
    Travis.notify('promise:fail', data);
    _ref3 = this._onFailure;
    for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
      callback = _ref3[_k];
      callback(this.data);
    }
    this._onSuccess = [];
    this._onFailure = [];
    return this;
  };

  Promise.prototype.onSuccess = function(callback) {
    return this.then(callback, null, false);
  };

  Promise.prototype.onFailure = function(callback) {
    return this.then(null, callback, false);
  };

  Promise.prototype.wrap = function() {
    var callback, delegations, promise, wrapped, wrapper, _k;
    delegations = 2 <= arguments.length ? __slice.call(arguments, 0, _k = arguments.length - 1) : (_k = 0, []), wrapper = arguments[_k++];
    wrapped = this;
    promise = new Travis.Promise(function() {
      return wrapped.run();
    });
    callback = function(input) {
      if (wrapper.length > 1) {
        return wrapper(input, promise);
      } else {
        return promise.succeed(wrapper(input));
      }
    };
    this.then(callback, (function(input) {
      return promise.fail(input);
    }), false);
    return promise.expect.apply(promise, delegations);
  };

  Promise.prototype.iterate = function() {
    var delegations, _ref3;
    delegations = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    this.each = function(callback, errback) {
      var iterator;
      if (callback == null) {
        throw new Error("missing callback");
      }
      iterator = function(result) {
        var entry, _k, _len2, _results;
        _results = [];
        for (_k = 0, _len2 = result.length; _k < _len2; _k++) {
          entry = result[_k];
          _results.push(callback(entry));
        }
        return _results;
      };
      return this.then(iterator, errback);
    };
    (_ref3 = Travis.Delegator).defineNested.apply(_ref3, __slice.call(delegations).concat([this], [this.each]));
    this.iterate = function() {
      return this;
    };
    return this;
  };

  Promise.prototype.expect = function() {
    var delegations, _ref3;
    delegations = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    (_ref3 = Travis.Delegator).define.apply(_ref3, __slice.call(delegations).concat([this], [this]));
    return this;
  };

  Promise.prototype.then = function(callback, errback, trigger) {
    if (trigger == null) {
      trigger = null;
    }
    if (trigger === null) {
      trigger = (callback != null) || (errback != null);
    }
    if ((callback != null) && errback === void 0) {
      errback = ((function(_this) {
        return function(err) {
          throw _this._error(err);
        };
      })(this));
    }
    if (this.succeeded) {
      if (callback != null) {
        callback(this.data);
      }
    } else if (this.failed) {
      if (errback != null) {
        errback(this.data);
      }
    } else {
      if (callback != null) {
        this._onSuccess.push(callback);
      }
      if (errback != null) {
        this._onFailure.push(errback);
      }
      if (trigger) {
        this.run();
      }
    }
    return this;
  };

  Promise.prototype["catch"] = function(errback) {
    this.then(null, errback);
    return this;
  };

  Promise.prototype._error = function(error) {
    if (typeof error === 'string') {
      return new Error(error);
    } else {
      return error;
    }
  };

  return Promise;

})();

Travis.Session = (function() {
  function Session(options) {
    var headers;
    if (options == null) {
      options = {};
    }
    Travis._setup();
    if (typeof options === 'string') {
      options = {
        url: Travis.endpoints[options] || options
      };
    }
    this._options = options;
    headers = {
      "Accept": "application/vnd.travis-ci.2+json"
    };
    if (options.token != null) {
      headers['Authorization'] = "token " + options.token;
    }
    this.http = new Travis.HTTP({
      headers: headers,
      base: options.url || Travis.endpoints["default"]
    });
    this.data = {};
    Travis.Delegator.define(Travis.HTTP, this, this.github);
    Travis.Delegator.define(Travis.HTTP, this, this.github());
    Travis.Delegator.defineSimple('each', this, this.accounts);
    Travis.Delegator.defineSimple('each', this, this.broadcasts);
    Travis.Delegator.defineSimple('each', this, this.repositories);
  }

  Session.prototype.account = function(options, callback) {
    if (typeof options === 'string') {
      options = {
        login: options
      };
    }
    return this.entity('account', options, callback);
  };

  Session.prototype.accounts = function(options, callback) {
    var promise;
    promise = this.load('/accounts', options, callback, function(result) {
      return result.accounts;
    });
    return promise.iterate(Travis.Entity.account);
  };

  Session.prototype.build = function(options, callback) {
    if (typeof options === 'number') {
      options = {
        id: options
      };
    }
    return this.entity('build', options, callback);
  };

  Session.prototype.broadcasts = function(options, callback) {
    var promise;
    promise = this.load('/broadcasts', options, callback, function(result) {
      return result.broadcasts;
    });
    return promise.iterate(Travis.Entity.broadcast);
  };

  Session.prototype.repository = function(options, callback) {
    if (typeof options === 'string') {
      options = {
        slug: options
      };
    }
    if (typeof options === 'number') {
      options = {
        id: options
      };
    }
    return this.entity('repository', options);
  };

  Session.prototype.repositories = function(options, callback) {
    var promise;
    promise = this.load('/repos', options, callback, function(result) {
      return result.repos;
    });
    return promise.iterate(Travis.Entity.repository);
  };

  Session.prototype.load = function(path, options, callback, format) {
    var otherCallback;
    if (format == null) {
      format = function(e) {
        return e;
      };
    }
    if (typeof options === 'function') {
      otherCallback = options;
      options = {};
    }
    return this.http.get(path, options).wrap((function(_this) {
      return function(response) {
        return format(_this.loadData(response.body));
      };
    })(this)).then(otherCallback).then(callback);
  };

  Session.prototype.loadData = function(data) {
    var attributes, entityKey, entityType, result, value, _k, _len2;
    result = {};
    for (entityKey in data) {
      value = data[entityKey];
      if (entityType = Travis.EntityMap.one[entityKey]) {
        if (entity = this.entity(entityType, value)) {
          result[entityKey] = entity;
        }
      } else if (entityType = Travis.EntityMap.many[entityKey]) {
        result[entityKey] = [];
        for (_k = 0, _len2 = value.length; _k < _len2; _k++) {
          attributes = value[_k];
          if (entity = this.entity(entityType, attributes)) {
            result[entityKey].push(entity);
          }
        }
      }
    }
    return result;
  };

  Session.prototype._entity = function(entityType, indexKey, index) {
    var prototype, storeAccess;
    prototype = Travis.Entity[entityType.name] || Travis.Entity;
    storeAccess = (function(_this) {
      return function() {
        return _this._entityData(entityType, indexKey, index);
      };
    })(this);
    return new prototype(this, storeAccess);
  };

  Session.prototype._entityData = function(entityType, indexKey, index) {
    var store, _base, _name;
    store = (_base = this.data)[_name = entityType.name] != null ? _base[_name] : _base[_name] = {};
    store = store[indexKey] != null ? store[indexKey] : store[indexKey] = {};
    return store[index] != null ? store[index] : store[index] = {
      data: {},
      complete: false,
      cache: {}
    };
  };

  Session.prototype._parseField = function(fieldName, fieldValue) {
    if (/_at$/.test(fieldName) && (fieldValue != null)) {
      return new Date(Date.parse(fieldValue));
    } else {
      return fieldValue;
    }
  };

  Session.prototype._readField = function(object, field) {
    var result, subfield, value, _k, _len2;
    if (typeof field === 'string') {
      return object[this._clientName(field)] || object[this._apiName(field)];
    }
    result = [];
    for (_k = 0, _len2 = field.length; _k < _len2; _k++) {
      subfield = field[_k];
      value = this._readField(object, subfield);
      if (value === void 0) {
        return void 0;
      }
      result.push(value);
    }
    return result;
  };

  Session.prototype._clientName = function(string) {
    return string.replace(/_([a-z])/g, function(g) {
      return g[1].toUpperCase();
    });
  };

  Session.prototype._apiName = function(string) {
    return string.replace(/[A-Z]/g, function(g) {
      return "_" + g[0].toLowerCase();
    });
  };

  Session.prototype.entity = function(entityType, data, callback, complete) {
    var entityName, index, indexKey, store, value, _k, _len2, _ref3;
    if (complete == null) {
      complete = false;
    }
    if (typeof entityType === 'string') {
      entityName = entityType;
      entityType = Travis.Entities[entityType];
      if (entityType == null) {
        throw new Error("unknown entity type " + entityName);
      }
    }
    entity = null;
    _ref3 = entityType.index;
    for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
      indexKey = _ref3[_k];
      if (index = this._readField(data, indexKey)) {
        if (entity == null) {
          entity = this._entity(entityType, indexKey, index);
        }
        store = this._entityData(entityType, indexKey, index);
        if (complete) {
          store.complete = true;
        }
        for (key in data) {
          value = data[key];
          store.data[this._clientName(key)] = this._parseField(key, value);
        }
      }
    }
    return entity.then(callback);
  };

  Session.prototype.session = function(options) {
    var value, _ref3;
    _ref3 = this._options;
    for (key in _ref3) {
      value = _ref3[key];
      if (options[key] == null) {
        options[key] = value;
      }
    }
    return new Travis.Session(options);
  };

  Session.prototype.config = function(callback) {
    var _base;
    if ((_base = this.config).promise == null) {
      _base.promise = this.http.get('/config').wrap(function(response) {
        return response.body.config;
      });
    }
    return this.config.promise.then(callback);
  };

  Session.prototype.github = function(callback) {
    var _base;
    if ((_base = this.github).promise == null) {
      _base.promise = this.config().wrap(function(config) {
        return new Travis.HTTP({
          base: config.github.api_url
        });
      });
    }
    return this.github.promise.then(callback);
  };

  Session.prototype.authenticate = function(options, callback) {
    var promise;
    if (typeof options === 'string') {
      options = {
        token: options
      };
    }
    if (options.token != null) {
      promise = new Travis.Promise;
      promise.succeed(this.session({
        token: options.token
      }));
    } else if (options.githubToken != null) {
      promise = this.http.post('/auth/github', {
        github_token: options.githubToken
      }).wrap((function(_this) {
        return function(response) {
          return _this.session({
            token: response.body.access_token
          });
        };
      })(this));
    } else if ((options.githubUser != null) && (options.githubPassword != null)) {
      promise.fail(new Error("github password auth not yet supported"));
    } else {
      promise = new Travis.Promise(function(promise) {
        return promise.fail(new Error("token or githubToken required"));
      });
    }
    return promise.then(callback);
  };

  Session.prototype.clearCache = function() {
    this.data = {};
    return this;
  };

  return Session;

})();

Travis.System = {
  info: function() {
    if ((typeof navigator !== "undefined" && navigator !== null ? navigator.userAgent : void 0) != null) {
      return navigator.userAgent;
    } else if (typeof process !== "undefined" && process !== null) {
      return "node/" + process.versions.node + " (" + process.platform + ") v8/" + process.versions.v8;
    } else {
      return 'unknown';
    }
  },
  base64: function(string) {
    if (typeof Buffer !== "undefined" && Buffer !== null) {
      return new Buffer(string).toString('base64');
    } else {
      return btoa(string);
    }
  }
};

Travis.Entity.account = (function(_super) {
  __extends(account, _super);

  function account() {
    return account.__super__.constructor.apply(this, arguments);
  }

  account.prototype.attributeNames = ['id', 'name', 'login', 'type', 'reposCount', 'subscribed'];

  account.prototype._fetch = function() {
    return this.session.accounts({
      all: true
    });
  };

  return account;

})(Travis.Entity);

Travis.Entity.broadcast = (function(_super) {
  __extends(broadcast, _super);

  function broadcast() {
    return broadcast.__super__.constructor.apply(this, arguments);
  }

  broadcast.prototype.attributeNames = ['id', 'message'];

  broadcast.prototype._fetch = function() {
    return this.session.broadcasts();
  };

  return broadcast;

})(Travis.Entity);

Travis.Entity.build = (function(_super) {
  __extends(build, _super);

  function build() {
    return build.__super__.constructor.apply(this, arguments);
  }

  build.prototype.attributeNames = ['id', 'repositoryId', 'commitId', 'number', 'pullRequest', 'pullRequestNumber', 'pullRequestTitle', 'config', 'state', 'startedAt', 'finishedAt', 'duration', 'jobIds'];

  build.prototype.computedAttributes = {
    push: {
      dependsOn: ['pullRequest'],
      compute: function(attributes) {
        return !attributes.pullRequest;
      }
    }
  };

  build.prototype.restart = function(callback) {
    return this._action('restart', callback);
  };

  build.prototype.cancel = function(callback) {
    return this._action('cancel', callback);
  };

  build.prototype._action = function(action, callback) {
    var promise;
    promise = new Travis.Promise((function(_this) {
      return function(promise) {
        return _this.id(function(id) {
          return _this.session.http.post("/builds/" + id + "/" + action, function(result) {
            return promise.succeed(_this.reload());
          });
        });
      };
    })(this));
    return promise.run().then(callback);
  };

  build.prototype._fetch = function() {
    var attributes;
    attributes = this._store().data;
    if (attributes.id) {
      return this.session.load("/builds/" + attributes.id);
    } else {
      return this.session.load("/repos/" + attributes.repositoryId + "/builds", {
        number: attributes.number
      });
    }
  };

  return build;

})(Travis.Entity);

Travis.Entity.repository = (function(_super) {
  __extends(repository, _super);

  function repository() {
    return repository.__super__.constructor.apply(this, arguments);
  }

  repository.prototype.attributeNames = ['id', 'slug', 'description', 'lastBuildId', 'lastBuildNumber', 'lastBuildState', 'lastBuildDuration', 'lastBuildStartedAt', 'lastBuildFinishedAt', 'githubLanguage'];

  repository.prototype.computedAttributes = {
    ownerName: {
      dependsOn: ['slug'],
      compute: function(attributes) {
        return attributes.slug.split('/', 1)[0];
      }
    },
    name: {
      dependsOn: ['slug'],
      compute: function(attributes) {
        return attributes.slug.split('/', 2)[1];
      }
    }
  };

  repository.prototype.lastBuild = function(callback) {
    var promise;
    promise = this._cache('build', 'last', (function(_this) {
      return function() {
        return _this.attributes().wrap(Travis.Entity.build, function(attributes, inner) {
          var build;
          build = _this.build({
            id: attributes.lastBuildId,
            number: attributes.lastBuildNumber,
            state: attributes.lastBuildState,
            duration: attributes.lastBuildDuration,
            startedAt: attributes.lastBuildStartedAt,
            finishedAt: attributes.lastBuildFinishedAt,
            repositoryId: attributes.id
          });
          return build.then(function(b) {
            return inner.succeed(b);
          });
        });
      };
    })(this));
    return promise.then(callback);
  };

  repository.prototype.build = function(options, callback) {
    var promise;
    if (typeof options === 'number') {
      options = {
        number: options.toString()
      };
    }
    if (typeof options === 'string') {
      options = {
        number: optsion
      };
    }
    if (options.id) {
      promise = Travis.Promise.succeed(this.session.build(options));
    } else {
      promise = this._cache('build', 'number', options.number, (function(_this) {
        return function() {
          return _this.attributes('repositoryId').wrap(function(a) {
            options.repositoryId = a.repositoryId;
            return _this.session.build(options);
          });
        };
      })(this));
    }
    return promise.expect(Travis.Entity.build).then(callback);
  };

  repository.prototype.builds = function(options, callback) {
    var promise;
    promise = this.session.load(this._url('/builds'), options, callback, function(result) {
      return result.builds;
    });
    return promise.iterate(Travis.Entity.build);
  };

  repository.prototype._url = function(suffix) {
    var attributes;
    if (suffix == null) {
      suffix = "";
    }
    attributes = this._store().data;
    return "/repos/" + (attributes.id || attributes.slug) + suffix;
  };

  repository.prototype._fetch = function() {
    return this.session.load(this._url());
  };

  return repository;

})(Travis.Entity);

//# sourceMappingURL=travis.js.map
