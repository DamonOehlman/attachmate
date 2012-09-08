var	assert = require('assert'),
	async = require('async'),
	fs = require('fs'),
	path = require('path'),
	request = require('request'),
	reInvalidFile = /^\.DS\_Store/i;

module.exports = function(targetPath, couchurl, name, callback) {

	// append the name to the target path and couchurl
	targetPath = path.join(targetPath, name);
	couchurl += name;

	function compareItem(filename, itemCallback) {
		var loaders = [
			fs.readFile.bind(null, path.join(targetPath, filename)),
			request.get.bind(null, couchurl + '/' + filename)
		];

		async.parallel(loaders, function(err, results) {
			if (err) return itemCallback(err);

			// hash both the results
			assert.equal(results[0].toString(), results[1][0].body);

			// trigger the item callback
			itemCallback();
		});
	}

	return function() {
		fs.readdir(targetPath, function(err, files) {
			// remove dodgy files
			files = (files || []).filter(function(name) {
				return !reInvalidFile.test(name);
			});

			async.forEach(files, compareItem, callback);
		});
	};
};