/* jshint node: true */
'use strict';

var debug = require('debug')('attachmate');
var Reader = require('fstream').Reader;
var util = require('util');
var reTrailingSlash = /\/$/;
var request = require('request');
var EOF = { EOF: true };
var CLOSE = { CLOSE: true };

/**
  ## HttpRequestEntry(targetDoc, path)
**/
function HttpRequestEntry(targetDoc, path) {
  if (! (this instanceof HttpRequestEntry)) {
    return new HttpRequestEntry(targetDoc, path);
  }

  this.path = path;
  this.url = targetDoc.replace(reTrailingSlash, '') + '/' + path;
  this.props = {};
  this._paused = true;
  this._buffer = [];
  
  // emit the ready event on the next tick
  process.nextTick(this.emit.bind(this, 'ready'));
} // HttpRequestEntry

util.inherits(HttpRequestEntry, Reader);
module.exports = HttpRequestEntry;

/**
  ### _getStream()
**/
HttpRequestEntry.prototype._getStream = function() {
  var entry = this;
  
  debug('making request for: ' + this.url);
  this._stream = request(this.url);
  
  this._stream
    .on('data', function(chunk) {
      debug('got data for: ' + entry.url);
      if (chunk.length === 0) {
        return;
      }
      if (entry._paused || entry._buffer.length) {
        entry._buffer.push(chunk);
      }
      else {
        entry.emit('data', chunk);
      }
    })
    .on('end', function() {
      debug('request complete: ' + entry.url + ', buffer: ', entry._buffer);
      if (entry._paused || entry._buffer.length) {
        entry._buffer.push(EOF);
        entry._buffer.push(CLOSE);
        entry._read();
      }
      else {
        entry.emit('end');
        entry.emit('close');
      }
    })
    .on('error', entry.emit.bind(entry));
      
  return this._stream;
};

/**
  ### _read()
**/
HttpRequestEntry.prototype._read = function() {
  if (this._paused) {
    debug('paused, aborting read');
    return;
  }

  // ensure we have a stream to work with
  this._stream = this._stream || this._getStream();
  
  // clear out the buffer, if there is one.
  if (this._buffer.length) {
    var buf = this._buffer;
    var c;

    for (var i = 0, l = buf.length; i < l; i ++) {
      c = buf[i];

      if (c === EOF) {
        this.emit('end');
      }
      else if (c === CLOSE) {
        this.emit('close');
      }
      else {
        this.emit('data', c);
      }

      if (this._paused) {
        this._buffer = buf.slice(i);
        return;
      }
    }
    
    this._buffer.length = 0;
  }
};

/**
  ### pause()
**/
HttpRequestEntry.prototype.pause = function(who) {
  if (this._paused) {
    return;
  }

  who = who || this;
  
  debug('pausing: ' + this.url);

  this._paused = true;
  if (this._stream) {
    this._stream.pause();
  }
  
  this.emit('pause',who);
  
  // TODO: this should not be required, but for some reason
  // the stream is never getting resumed... must ask @isaacs about this...
  setTimeout(this.resume.bind(this), 500);
};

/**
  ### resume()
**/
HttpRequestEntry.prototype.resume = function(who) {
  if (! this._paused) {
    return;
  }
  
  debug('resume: ' + this.url);
  
  this.emit('resume', who || this);
  this._paused = false;
  
  if (this._stream) {
    this._stream.resume();
  }

  this._read();
};