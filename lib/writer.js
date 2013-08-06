/* jshint node: true */
'use strict';

var path = require('path');
var debug = require('debug')('attachmate');
var request = require('request');
var mime = require('mime');
var util = require('util');
var collect = require('fstream/lib/collect');

var reHiddenFile = /(^|\/)\./;
var reBackslash = /\\/g;

/**
  ## AttachmentWriter(props)
**/
function AttachmentWriter(props) {
  if (! (this instanceof AttachmentWriter)) {
    return new AttachmentWriter(props);
  }

  // ensure props have been defined
  props = props || {};
  
  // TODO: check the path property is a url
  this.path = props.path;
  this.includeHidden = props.includeHidden;
  this.preserveExisting = typeof props.preserveExisting == 'undefined' ||
    props.preserveExisting;

  this.docData = props.docData || {};
  
  this._activeEntry = null;
  this._buffer = [];
  this._newAttachments = {};
}

util.inherits(AttachmentWriter, require('fstream').Writer);
module.exports = AttachmentWriter;

/**
  ### add()
**/
AttachmentWriter.prototype.add = function(entry) {
  collect(entry);
  // console.log('adding: ' + entry.props.path);
  
  this._buffer.push(entry);
  this._process();
};

/**
  ### end()
**/
AttachmentWriter.prototype.end = function() {
  var writer = this;
  var putOpts;
  
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
        debug(writer.path + ' retrieved, current revision = ' +
          currentDoc._rev);
      }
      
      // ensure the current doc has an attachments member
      // if we have been told not to preserve attachments, though, then reset
      currentDoc._attachments =
        (writer.preserveExisting ?currentDoc._attachments : {}) || {};
      
      // if we have doc data then update the document
      for (var docKey in writer.docData) {
        if (docKey && docKey[0] !== '_') {
          currentDoc[docKey] = writer.docData[docKey];
        }
      }
      
      // add the new attachments
      for (var aKey in writer._newAttachments) {
        currentDoc._attachments[aKey] = writer._newAttachments[aKey];
      }
      
      // if the current document does not have an id, then give it one
      debug('putting document update @ ' + writer.path);
      putOpts = {
        url: writer.path,
        method: 'PUT',
        json: currentDoc
      };

      request(putOpts, function(err, res, body) {
        // check if we have received a body error from the response
        if (!err && typeof body == 'object' && body.error) {
          err = body.error;
        }
        
        if (! err) {
          debug('uploaded doc ' +
            (typeof body == 'object' ? body.id + '/' + body.rev : ''));
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

/**
  ### _addAttachment(name, chunks, size)
**/
AttachmentWriter.prototype._addAttachment = function(name, chunks, size) {
  // convert the buffer chunks to a single buffer
  var buffer = new Buffer(size);
  var lastIndex = 0;
      
  debug('got buffer of size ' + size + ' for: ' + name);

  // replace back slashes with forward slashes 
  // as loading in from windows tends to cause problems
  name = name.replace(reBackslash, '/');
  
  chunks.forEach(function(chunk) {
    chunk.copy(buffer, lastIndex);
    lastIndex += chunk.length;
  });

  this._newAttachments[name] = {
    'content_type': mime.lookup(name),
    data: buffer.toString('base64')
  };
};

/**
  ### _process()
**/
AttachmentWriter.prototype._process = function() {
  var entry;
  var relPath;
  var writer = this;
  var entryDataSize = 0;
  var entryChunks = [];
  var canProcess;

  // if we are already processing an entry, abort
  if (this._activeEntry) {
    return;
  }
  
  // grab the next entry
  entry = this._activeEntry = this._buffer.shift();
      
  // if we have no new entry to process, bail
  if (! entry) {
    return;
  }
  
  
  relPath = path.relative(entry.root.props.path, entry.props.path);
  canProcess = relPath && entry.readable &&
    (this.includeHidden || (! reHiddenFile.test(relPath)));

  if (canProcess) {
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