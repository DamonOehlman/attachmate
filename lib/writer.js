var path = require('path'),
    debug = require('debug')('attachmate'),
    request = require('request'),
    mime = require('mime'),
    util = require('util'),
    reHiddenFile = /(^|\/)\./,
    collect = require('fstream/lib/collect'),
    HttpRequestEntry = require('./requestentry'),
    reTrailingSlash = /\/$/,
    reBackslash = /\\/g;

function AttachmentWriter(props) {
    // ensure props have been defined
    props = props || {};
    
    // TODO: check the path property is a url
    this.path = props.path;
    this.includeHidden = props.includeHidden;
    this.preserveExisting = typeof props.preserveExisting == 'undefined' || props.preserveExisting;
    this.docData = props.docData || {};
    
    this._activeEntry = null;
    this._buffer = [];
    this._newAttachments = {};
}

util.inherits(AttachmentWriter, require('fstream').Writer);

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
    debug('requesting current doc: ' + this.path);
    request(this.path, function(err, res, body) {
        if (! err) {
            var currentDoc = {};
            
            try {
                currentDoc = JSON.parse(body);
                
                // if the current doc has an error, then reset the current doc
                if (currentDoc.error) {
                    debug('got error requesting current doc: ' + currentDoc.error);
                    currentDoc = {};
                }
            }
            catch (e) {
                writer.emit('error', 'Cannot parse existing doc');
            }

            if (currentDoc._rev) {
                debug(writer.path + ' retrieved, current revision = ' + currentDoc._rev);
            }
            
            // ensure the current doc has an attachments member
            // if we have been told not to preserve attachments, though, then reset
            currentDoc._attachments = (writer.preserveExisting ? currentDoc._attachments : {}) || {};
            
            // if we have doc data then update the document
            for (key in writer.docData) {
                if (key && key[0] !== '_') {
                    currentDoc[key] = writer.docData[key];
                }
            }
            
            // add the new attachments
            for (key in writer._newAttachments) {
                currentDoc._attachments[key] = writer._newAttachments[key];
            }
            
            // if the current document does not have an id, then give it one
            debug('putting document update @ ' + writer.path);
            request({ url: writer.path, method: 'PUT', json: currentDoc }, function(err, res, body) {
                // check if we have received a body error from the response
                if (!err && typeof body == 'object' && body.error) {
                    err = body.error;
                }
                
                if (! err) {
                    debug('uploaded doc ' + (typeof body == 'object' ? body.id + '/' + body.rev : ''));
                    writer.emit('end');
                }
                else {
                    debug('upload failed to url (' + writer.path + ' failed)', err);
                    writer.emit('error', err);
                }
            });
        }
    });
    
    debug('ENDED');
};

AttachmentWriter.prototype._addAttachment = function(name, chunks, size) {
    // convert the buffer chunks to a single buffer
    var buffer = new Buffer(size),
        lastIndex = 0;
        
    debug('got buffer of size ' + size + ' for: ' + name);

    // replace back slashes with forward slashes 
    // as loading in from windows tends to cause problems
    name = name.replace(reBackslash, '/');
    
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
    if (relPath && entry.readable && (this.includeHidden || (! reHiddenFile.test(relPath)))) {
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