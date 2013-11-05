var attachmate = require('../');
var path = require('path');

attachmate.upload(
  'http://localhost:5984/testdb/test',
  path.resolve(__dirname, 'input'),
  function(err) {
    console.log('done, error = ', err);
  }
);