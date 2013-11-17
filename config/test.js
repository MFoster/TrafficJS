var requirejs = require('requirejs');

requirejs.config({
	"baseUrl" : __dirname + "/../",
	"paths" : {
		"backbone" : "vendor/backbone-amd/backbone",
		"underscore" : "vendor/underscore-amd/underscore",
	}
});

module.exports = requirejs;