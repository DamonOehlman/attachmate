var attachmate = require('../'),
    path = require("path");
    
attachmate.upload(
    'http://10.211.55.4:5984/testdb/test', 
    path.resolve(__dirname, 'input'),
    { docData: { test: true } },
    function(err) {
        console.log('done, error = ', err);
    }
);