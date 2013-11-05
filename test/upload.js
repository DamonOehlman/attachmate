var assert = require('assert'),
	attachmate = require('..'),
	fstream = require('fstream'),
	path = require('path'),
	compareFiles = require('./helpers/compareFiles'),
	inputPath = path.resolve(__dirname, 'testdata', 'input'),
	testdb = 'http://localhost:5984/testdb/';

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
		it('should be able to upload a directory with multiple files', uploadAndCheck('multiple'));
		it('should be able to upload a directory with binary files', uploadAndCheck('binary'));

		// it('should be able to traverse a directory and upload all files', uploadAndCheck('traverse'));
	});

	describe('short format', function() {

	});

});