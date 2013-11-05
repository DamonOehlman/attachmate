var attachmate = require('../');
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

