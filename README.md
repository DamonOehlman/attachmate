# attachmate

Streamable CouchDB attachments

An experiment in using @isaacs useful
[fstream](https://github.com/isaacs/fstream) project to stream files in
and out of [CouchDB](http://couchdb.apache.org/) as attachments to
documents.


[![NPM](https://nodei.co/npm/attachmate.png)](https://nodei.co/npm/attachmate/)

[![stable](https://img.shields.io/badge/stability-stable-green.svg)](https://github.com/badges/stability-badges) [![Build Status](https://img.shields.io/travis/DamonOehlman/attachmate.svg?branch=master)](https://travis-ci.org/DamonOehlman/attachmate) 

## Downloading From Couch to FileSystem

### Example: Download Attachments to the Filesystem

```js
var attachmate = require('attachmate');
var fstream = require('fstream');
var path = require('path');
var outputPath = path.resolve(__dirname, 'output');
var mkdirp = require('mkdirp');

mkdirp(outputPath, function(err) {
  if (err) return;

  var r = fstream.Reader({
    type: attachmate.Reader,
    path: 'http://localhost:5984/testdb/test'
  });

  var w = fstream.Writer({
    path: outputPath,
    type: 'Directory'
  });

  // pipe the attachments to the directory
  r.pipe(w);
});


```

### Example: Download Attachments (using download helper)

```js
var attachmate = require('attachmate');
var path = require('path');
var outputPath = path.resolve(__dirname, 'output');
var mkdirp = require('mkdirp');

mkdirp(outputPath, function(err) {
  if (err) return;

  attachmate.download(
    'http://localhost:5984/testdb/test',
    outputPath,
    function(err) {
      console.log('done, error = ', err);
    }
  );
});


```

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

```js
var attachmate = require('attachmate');
var fstream = require('fstream');
var path = require('path');

var r = fstream.Reader({
  path: path.resolve(__dirname, 'input'),
  type: 'Directory'
});

var w = new attachmate.Writer({
  path: 'http://localhost:5984/testdb/test',
  includeHidden: false,
  preserveExisting: true
});

// pipe the attachments to the directory
r.pipe(w);
```

### Example: Upload Attachments (using upload helper)

```js
var attachmate = require('attachmate');
var path = require('path');

attachmate.upload(
  'http://localhost:5984/testdb/test',
  path.resolve(__dirname, 'input'),
  function(err) {
    console.log('done, error = ', err);
  }
);
```

## Reference

## AttachmentReader

### _getEntries()

### _read()

### pause()

### resume()

## HttpRequestEntry(targetDoc, path)

### _getStream()

### _read()

### pause()

### resume()

## AttachmentWriter(props)

### add()

### end()

### _addAttachment(name, chunks, size)

### _process()

## License(s)

### MIT

Copyright (c) 2014 Damon Oehlman <damon.oehlman@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
