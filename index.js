var fstream = require('fstream'),
    Reader = exports.Reader = require('./lib/reader'),
    Writer = exports.Writer = require('./lib/writer');
    
exports.download = function(srcDoc, targetPath, opts, callback) {
    var src, dst;
    
    // if the options is the callback, then remap
    if (typeof opts == 'function') {
        callback = opts;
        opts = {};
    }
    
    // ensure we have a callback
    callback = callback || function() {};

    // create the source and dest readers / writers
    src = new Reader({ path: srcDoc });
    dst = fstream.Writer({ path: targetPath, type: 'Directory'});
    
    // wire callbacks
    dst.on('end', callback);
    dst.on('error', callback);
    
    // pipe from the couch doc to the target dir
    src.pipe(dst);
};
    
exports.upload = function(targetDoc, sourcePath, opts, callback) {
    var src, dst;
    
    // if the options is the callback, then remap
    if (typeof opts == 'function') {
        callback = opts;
        opts = {};
    }
    
    // ensure we have a callback
    callback = callback || function() {};
    
    // add the target doc to the opts
    opts.path = targetDoc;
    
    // create the source and destination readers and writers
    src = fstream.Reader({ path: sourcePath, type: 'Directory' });
    dst = new Writer(opts);
        
    // wire callbacks
    dst.on('end', callback);
    dst.on('error', callback);

    // pipe the attachments to the directory
    src.pipe(dst);
};

