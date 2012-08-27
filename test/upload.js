var assert = require('assert'),
	attachmate = require('..'),
	fstream = require('fstream'),
	path = require('path'),
	compareFiles = require('./helpers/compareFiles'),
	inputPath = path.resolve(__dirname, 'testdata', 'input'),
	testdb = 'http://sidelab.iriscouch.com/attachmate-tests/';

function uploadAndCheck(name) {
	return function(done) {
		var targetPath = path.join(inputPath, name),
			r = fstream.Reader({ path: targetPath, type: 'Directory' }),
			w = new attachmate.Writer({
				path: testdb + name,
				includeHidden: false,
				preserveExisting: true
			});

		// once the upload is complete, check validity
		r.pipe(w)
			.on('end', compareFiles(inputPath, testdb, name, done))
			.on('error', done);
	};
}
    
describe('upload tests', function() {

	describe('long format', function(done) {
		it('should be able upload a directory containing a single file', uploadAndCheck('single'));
	});

	describe('short format', function() {

	});

});