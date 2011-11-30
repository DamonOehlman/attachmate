# attachmate - Streamable CouchDB attachments :)

Well, that's the idea anyway, and well it's working with reading attachments :)

```js
var attachmate = require('attachmate'),
    fstream = require('fstream'),
    path = require("path"),
    
    r = new attachmate.Reader({ path: 'http://localhost:5984/testdb/doc_with_attachments' }),
    w = fstream.Writer({ path: path.resolve(__dirname, 'output'), type: 'Directory'});
    
// pipe the attachments to the directory
r.pipe(w);
```