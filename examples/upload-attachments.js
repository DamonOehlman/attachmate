var attachmate = require('../');
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