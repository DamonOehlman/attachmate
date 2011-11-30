var attachmate = require('../'),
    fstream = require('fstream'),
    path = require("path"),
    
    r = new attachmate.Reader({ path: 'http://10.211.55.4:5984/steelmesh/app::tripplanner' }),
    w = fstream.Writer({ path: path.resolve(__dirname, 'output'), type: 'Directory'});
    
// pipe the attachments to the directory
r.pipe(w);