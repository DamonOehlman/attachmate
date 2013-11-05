/* jshint node: true */
'use strict';

/**
  # attachmate

  Streamable CouchDB attachments

  An experiment in using @isaacs useful
  [fstream](https://github.com/isaacs/fstream) project to stream files in
  and out of [CouchDB](http://couchdb.apache.org/) as attachments to
  documents.

  ## Downloading From Couch to FileSystem

  ### Example: Download Attachments to the Filesystem

  <<< examples/download-attachments.js

  ### Example: Download Attachments (using download helper)

  <<< examples/download-short.js

  ## Uploading from Filesystem to Couch

  ### Options

  The fstream classes take a set of options at initialization.  In keeping
  with the fstream standard, we use the `path` option to denote the target
  document.  The following additional options are also supported:

  - `preserveExisting` - whether or not existing attachments on the
    document should be preserved. (default = true)

  - `includeHidden` - whether or not hidden files should be included when
     uploading attachments to couch. (default = false)

  ### Example: Upload Attachments from the Filesystem

  <<< examples/upload-attachments.js

  ### Example: Upload Attachments (using upload helper)

  <<< examples/upload-short.js

  ## Reference

**/

var fstream = require('fstream');
var Reader = exports.Reader = require('./lib/reader');
var Writer = exports.Writer = require('./lib/writer');

exports.download = function(srcDoc, targetPath, opts, callback) {
  var src;
  var dst;

  // if the options is the callback, then remap
  if (typeof opts == 'function') {
    callback = opts;
    opts = {};
  }

  // ensure we have a callback
  callback = callback || function() {};

  // create the source and dest readers / writers
  src = new Reader({ path: srcDoc });
  dst = fstream.Writer({ path: targetPath, type: 'Directory'});

  // wire callbacks
  dst.on('end', callback);
  dst.on('error', callback);

  // pipe from the couch doc to the target dir
  src.pipe(dst);
};

exports.upload = function(targetDoc, sourcePath, opts, callback) {
  var src;
  var dst;

  // if the options is the callback, then remap
  if (typeof opts == 'function') {
    callback = opts;
    opts = {};
  }

  // ensure we have a callback
  callback = callback || function() {};

  // add the target doc to the opts
  opts.path = targetDoc;

  // create the source and destination readers and writers
  src = fstream.Reader({ path: sourcePath, type: 'Directory' });
  dst = new Writer(opts);

  // wire callbacks
  dst.on('end', callback);
  dst.on('error', callback);

  // pipe the attachments to the directory
  src.pipe(dst);
};