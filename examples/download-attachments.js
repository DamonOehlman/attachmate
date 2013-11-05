var attachmate = require('..');
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

