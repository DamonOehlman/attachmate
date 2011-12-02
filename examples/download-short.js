var attachmate = require('../'),
    path = require('path');
    
attachmate.download(
    'http://10.211.55.4:5984/steelmesh/test', 
    path.resolve(__dirname, 'output'), 
    function(err) {
        console.log('done, error = ', err);
    }
);