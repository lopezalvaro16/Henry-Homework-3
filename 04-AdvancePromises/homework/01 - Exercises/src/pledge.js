"use strict";
/*----------------------------------------------------------------
Promises Workshop: construye la libreria de ES6 promises, pledge.js
----------------------------------------------------------------*/
// // TU CÓDIGO AQUÍ:
function $Promise(executor) {
  if (typeof executor !== "function")
    throw new TypeError("The executor must be a function");
  this._state = "pending";
  this._handlerGroups = [];

  executor(this._internalResolve.bind(this), this._internalReject.bind(this));
}
$Promise.prototype._internalResolve = function (value) {
  if (this._state === "pending") {
    this._state = "fulfilled";
    this._value = value;
    this._callHandlers();
  }
};
$Promise.prototype._internalReject = function (reason) {
  if (this._state === "pending") {
    this._state = "rejected";
    this._value = reason;
    this._callHandlers();
  }
};

$Promise.prototype.catch = function (errorCb) {
  return this.then(null, errorCb);
};

$Promise.prototype.then = function (successCb, errorCb) {
  if (typeof successCb !== "function" && typeof errorCb !== "function") {
    successCb = false;
    errorCb = false;
  }

  const downtreamPromise = new $Promise(() => {});

  this._handlerGroups.push({
    successCb,
    errorCb,
    downtreamPromise,
  });

  if (this._state !== "pending") {
    this._callHandlers();
  }
  return downtreamPromise;
};

$Promise.prototype._callHandlers = function () {
  while (this._handlerGroups.length) {
    const handler = this._handlerGroups.shift();

    if (this._state === "fulfilled") {
      if (handler.successCb) {
        try {
          const response = handler.successCb(this._value);
          if (response instanceof $Promise) {
            return response.then(
              (value) => handler.downtreamPromise._internalResolve(value),
              (error) => handler.downtreamPromise._internalReject(error)
            );
          } else {
            handler.downtreamPromise._internalResolve(response);
          }
        } catch (error) {
          handler.downtreamPromise._internalReject(error);
        }
      } else {
        return handler.downtreamPromise._internalResolve(this._value);
      }
    }
    if (this._state === "rejected") {
      if (handler.errorCb) {
        try {
          const response = handler.errorCb(this._value);
          if (response instanceof $Promise) {
            return response.then(
              (value) => handler.downtreamPromise._internalResolve(value),
              (error) => handler.downtreamPromise._internalReject(error)
            );
          } else {
            handler.downtreamPromise._internalResolve(response);
          }
        } catch (error) {
          handler.downtreamPromise._internalReject(error);
        }
      } else {
        return handler.downtreamPromise._internalReject(this._value);
      }
    }
  }
};

module.exports = $Promise;
/*-------------------------------------------------------
El spec fue diseñado para funcionar con Test'Em, por lo tanto no necesitamos
realmente usar module.exports. Pero aquí está para referencia:

module.exports = $Promise;

Entonces en proyectos Node podemos esribir cosas como estas:

var Promise = require('pledge');
…
var promise = new Promise(function (resolve, reject) { … });
--------------------------------------------------------*/
