var path = require('path'),
    debug = require('debug')('attachmate'),
    request = require('request'),
    mime = require('mime'),
    util = require('util'),
    Writer = require('fstream').Writer,
    collect = require('fstream/lib/collect'),
    HttpRequestEntry = require('./requestentry'),
    reTrailingSlash = /\/$/;

function AttachmentWriter(props) {
    // ensure props have been defined
    props = props || {};
    
    // TODO: check the path property is a url
    this.path = props.path;
    this.includeHidden = props.includeHidden;
    
    this._activeEntry = null;
    this._buffer = [];
    this._newAttachments = {};
}

util.inherits(AttachmentWriter, Writer);

AttachmentWriter.prototype.add = function(entry) {
    collect(entry);
    // console.log('adding: ' + entry.props.path);
    
    this._buffer.push(entry);
    this._process();
};

AttachmentWriter.prototype.end = function() {
    var writer = this,
        putOpts, attachments, key;
    
    debug('stream ended, uploading attachment');
    
    // get the current version of the document from couch
    request(this.path, function(err, res, body) {
        if (! err) {
            var currentDoc = {};
            
            try {
                currentDoc = JSON.parse(body);
                
                // if the current doc has an error, then reset the current doc
                if (currentDoc.error) {
                    currentDoc = {};
                }
            }
            catch (e) {
                // unable to parse, stick with the empty toc
            }
            
            // ensure the current doc has an attachments member
            currentDoc._attachments = currentDoc._attachments || {};
            
            // add the new attachments
            for (key in writer._newAttachments) {
                currentDoc._attachments[key] = writer._newAttachments[key];
            }
            
            // update the current doc attachments
            
            // if the current document does not have an id, then give it one
            request({ url: writer.path, method: 'PUT', json: currentDoc }, function(err, res, body) {
                debug('uploaded doc ' + (typeof body == 'object' ? body.id + '/' + body.rev : ''));
            });
        }
    });
    
    debug('ENDED');
};

AttachmentWriter.prototype._addAttachment = function(name, chunks, size) {
    // convert the buffer chunks to a single buffer
    var buffer = new Buffer(size),
        lastIndex = 0;
        
    debug('got buffer of ' + size + ' for: ' + name);
    
    chunks.forEach(function(chunk) {
        chunk.copy(buffer, lastIndex);
        lastIndex += chunk.length;
    });
    
    this._newAttachments[name] = {
        content_type: mime.lookup(name),
        data: buffer.toString('base64')
    };
};

AttachmentWriter.prototype._process = function() {
    if (this._activeEntry) {
        return;
    }
    
    // grab the next entry
    var entry = this._activeEntry = this._buffer.shift(),
        relPath, writer = this,
        entryDataSize = 0,
        entryChunks = [];
        
    // console.log(entry);
    
    if (! entry) {
        return;
    }
    
    
    relPath = path.relative(entry.root.props.path, entry.props.path);
    if (relPath && entry.readable && (this.includeHidden || relPath.slice(0, 1) !== '.')) {
        debug('processing: ' + relPath);

        entry.on('end', function() {
            if (entryChunks.length > 0) {
                writer._addAttachment(relPath, entryChunks, entryDataSize);
            }

            writer._activeEntry = null;
            writer._process();
        });

        if (entry.props.Directory) {
            entry.on('entry', function(childEntry) {
                // console.log('child', childEntry);
                writer.add(childEntry);
            });
            
            // clear the active entry flag
            writer._activeEntry = null;
        }
        else {
            // console.log('stream: ', entry._getStream());
            entry.on('data', function(chunk) {
                entryChunks[entryChunks.length] = chunk;
                entryDataSize += chunk.length;
            });
        }
        
        // entry.resume();
    }
    else {
        this._activeEntry = null;
        this._process();
    }
    
    entry.pipe();
};

module.exports = AttachmentWriter;