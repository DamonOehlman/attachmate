var request = require('request'),
    util = require('util'),
    Reader = require('fstream').Reader,
    HttpRequestEntry = require('./requestentry'),
    reTrailingSlash = /\/$/;

function AttachmentReader(props) {
    // TODO: check the path property is a url
    this.path = props.path;
    
    
    this._entries = null;
    this._index = -1;
    this._ended = false;
    
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
    var reader = this, entry, entryPath;
    
    if (! this._entries) {
        return this._getEntries();
    }
    
    this._index++;
    if (this._index >= this._entries.length) {
        if (! this._ended) {
            this._ended = true;
            this.emit('end');
            this.emit('close');
        }
        
        return;
    }
    
    console.log(this.path.replace(reTrailingSlash, ''), this._entries[this._index]);
    entry = new HttpRequestEntry(this.path.replace(reTrailingSlash, ''), this._entries[this._index]);
    this.emit('entry', entry);
    
    entry.on('end', function() {
        reader._read();
    });
    
    entry.on('error', function(err) {
        console.log(err);
    });
};

module.exports = AttachmentReader;