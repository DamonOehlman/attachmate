var debug = require('debug')('attachmate'),
    request = require('request'),
    util = require('util'),
    url = require('url'),
    HttpRequestEntry = require('./requestentry'),
    Reader = require('fstream').Reader,
    reTrailingSlash = /\/$/;

function AttachmentReader(props) {
    // TODO: check the path property is a url
    this.path = props.path;
    
    this._entries = null;
    this._index = -1;
    this._ended = false;
    this._paused = false;
    this._currentEntry = null;
    
    this._read();
}

util.inherits(AttachmentReader, Reader);

AttachmentReader.prototype._getEntries = function() {
    var reader = this;
    
    request(this.path, function(err, resp, body) {
        try {
            var parsed = JSON.parse(body),
                attachments = parsed._attachments,
                entries = [];
                
            // iterate through the attachments
            if (attachments) {
                for (var key in attachments) {
                    entries[entries.length] = key;
                }
            }
            
            reader._entries = entries;
        }
        catch (e) {
            reader._entries = [];
        }
        
        reader._read();
    });
};

AttachmentReader.prototype._read = function() {
    var reader = this, entry, entryPath,
        ended = false;
        
    if (! this._entries) {
        return this._getEntries();
    }
    
    function __onEnd() {
        if (ended) return;
        
        ended = true;
        reader.emit('entryEnd', entry);
        reader._currentEntry = null;
        reader._read();
    }
    
    // if paused or processing a current entry, then return
    debug('attempting read, paused: ' + this._paused);
    if (this._paused || this._currentEntry) return;
    
    // increment the index and process the next file
    this._index++;
    if (this._index >= this._entries.length) {
        if (! this._ended) {
            debug('reading ended: emitting close and end events');

            this._ended = true;
            this.emit('end');
            this.emit('close');
        }
        
        return;
    }
    
    // create the entry
    entry = this._currentEntry = new HttpRequestEntry(this.path, this._entries[this._index])
        .once('ready', function __emitChild() {
            debug('entry ready: ' + entry.url);
            
            if (reader._paused) {
                entry.pause(me);
                
                return reader.once('resume', __emitChild);
            }
            
            reader.emit('entry', entry);
        })
        
        .on('pause', function(who) {
            if (! reader._paused) {
                reader.pause(who);
            }
        })
        
        .on('resume', function(who) {
            if (reader._paused) {
                reader.resume(who);
            }
        })
        
        .on('end', __onEnd)
        .on('error', function() {
            debug('encountered error reading entry for url');
            reader.emit('error', err);
        });
        
    return undefined;
};

AttachmentReader.prototype.pause = function (who) {
    if (this._paused) return;
    
    
    who = who || this;
    if (who !== this._currentEntry) {
        debug('paused requested of reader');
    }

    this._paused = true;
    
    if (this._currentEntry) {
        this._currentEntry.pause(who);
    }
    
    this.emit('pause', who);
}

AttachmentReader.prototype.resume = function (who) {   
    if (! this._paused) return;
    
    who = who || this;
    if (who !== this._currentEntry) {
        debug('resume requested of reader');
    }
    
    this._paused = false;
    this.emit('resume', who);
    
    if (this._currentEntry) {
        this._currentEntry.resume(who);
    }
    else {
        this._read();
    }
}

module.exports = AttachmentReader;