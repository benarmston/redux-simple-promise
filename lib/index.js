'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.resolve = resolve;
exports.reject = reject;
exports['default'] = promiseMiddleware;

var _fluxStandardAction = require('flux-standard-action');

function isPromise(val) {
  return val && typeof val.then === 'function';
}

var RESOLVED_NAME = '_RESOLVED';
var REJECTED_NAME = '_REJECTED';

function resolve(actionName) {
  return actionName + RESOLVED_NAME;
}

function reject(actionName) {
  return actionName + REJECTED_NAME;
}

function promiseMiddleware(resolvedName, rejectedName) {
  var _ref = [resolvedName || RESOLVED_NAME, rejectedName || REJECTED_NAME];
  RESOLVED_NAME = _ref[0];
  REJECTED_NAME = _ref[1];

  return function (_ref2) {
    var dispatch = _ref2.dispatch;
    return function (next) {
      return function (action) {

        if (!_fluxStandardAction.isFSA(action) || !action.payload || !isPromise(action.payload.promise)) {
          return next(action);
        }

        // (1) Dispatch actionName with payload with arguments apart from promise

        // Clone original action
        var newAction = {
          type: action.type,
          payload: _extends({}, action.payload)
        };

        if (Object.keys(newAction.payload).length === 1) {
          // No arguments beside promise, remove all payload
          delete newAction.payload;
        } else {
          // Other arguments, delete promise only
          delete newAction.payload.promise;
        }

        dispatch(newAction);

        // Create a base for the next action containing the metadata.
        var nextActionBase = {
          meta: _extends({}, action.meta, {
            payload: _extends({}, newAction.payload)
          })
        };

        if (Object.keys(nextActionBase.meta.payload).length === 0) {
          // No arguments were given beside the promise, no need to include them
          // in the meta.
          delete nextActionBase.meta.payload;
        }
        if (Object.keys(nextActionBase.meta).length === 0) {
          // No meta was included either, remove all meta.
          delete nextActionBase.meta;
        }

        // (2) Listen to promise and dispatch payload with new actionName
        return action.payload.promise.then(function (result) {
          dispatch(_extends({
            type: resolve(action.type, resolvedName),
            payload: result
          }, nextActionBase));
          return result;
        }, function (error) {
          dispatch(_extends({
            type: reject(action.type, rejectedName),
            payload: error
          }, nextActionBase));
          throw error;
        });
      };
    };
  };
}