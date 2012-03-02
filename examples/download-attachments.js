var attachmate = require('../'),
    fstream = require('fstream'),
    path = require("path"),
    
    r = fstream.Reader({ type: attachmate.Reader, path: 'http://localhost:5984/steelmesh/app::tripplanner' }),
    w = fstream.Writer({ path: path.resolve(__dirname, 'output'), type: 'Directory'});
    
// pipe the attachments to the directory
r.pipe(w);