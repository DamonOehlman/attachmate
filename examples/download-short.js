var attachmate = require('../'),
    path = require('path');
    
attachmate.download(
    'http://localhost:5984/steelmesh/app::tripplanner', 
    path.resolve(__dirname, 'output'), 
    function(err) {
        console.log('done, error = ', err);
    }
);