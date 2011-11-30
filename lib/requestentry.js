var Stream = require("stream").Stream,
    util = require('util'),
    http = require('http'),
    url = require('url'),
    request = require('request');

function HttpRequestEntry(targetDoc, path) {
    var entry = this;
    
    this.path = path;
    this.props = {};
    this._paused = false;
    this._pipeTarget = null;
    this._buffer = [];
    
    this._request = http.get(url.parse(targetDoc + '/' + path), function(couchRes) {
        // handle data
        couchRes.on('data', function(chunk) {
            if (entry._paused) {
                entry._buffer.push(chunk);
            }
            else {
                entry.emit('data', chunk);
            }
        });
        
        // handle the response end
        couchRes.on('end', function() {
            entry._flush();
            entry.emit('end');
        });
    });
    
    this._request.on('error', function(e) {
        entry.emit('close');
    });
    
    this._request.setSocketKeepAlive(false);
    
    /*
    this._request.setTimeout(10000, function() {
        if (! responseStarted) {
            // flag as timed out
            timedOut = true;

            docRequest.abort();
            mesh.log.warn('request for \'' + targetDoc + '\' timed out');
            res.send('Timed out: ' + new Date().getTime(), 500);
        }
    });
    */
} // HttpRequestEntry

util.inherits(HttpRequestEntry, Stream);

HttpRequestEntry.prototype._flush = function() {
    for (var ii = 0, count = this._buffer.length; ii < count; ii++) {
        this.emit('data', this._buffer[ii]);
    }

    // reset the buffer
    this._buffer = [];
};

HttpRequestEntry.prototype.pause = function(who) {
    this._paused = true;
    this.emit('pause', who || this);
};

HttpRequestEntry.prototype.resume = function(who) {
    if (this._paused) {
        this._flush();
    }
    
    this._paused = false;
    this.emit('resume', who || this);
};

module.exports = HttpRequestEntry;