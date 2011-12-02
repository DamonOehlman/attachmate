var attachmate = require('../'),
    fstream = require('fstream'),
    path = require("path"),
    
    r = fstream.Reader({ path: path.resolve(__dirname, 'input'), type: 'Directory' }),
    w = new attachmate.Writer({
        path: 'http://10.211.55.4:5984/steelmesh/test',
        includeHidden: false,
        preserveExisting: true
    });
    
// pipe the attachments to the directory
r.pipe(w);