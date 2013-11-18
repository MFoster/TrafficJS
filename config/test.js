var requirejs = require('requirejs');

requirejs.config({
	"baseUrl" : __dirname + "/../",
	"paths" : {
		"backbone" : "vendor/backbone-amd/backbone",
		"underscore" : "vendor/underscore-amd/underscore",
		"sync" : "src/sync",
		"httprequest" : "src/connection/http-test"
	}
});

module.exports = requirejs;