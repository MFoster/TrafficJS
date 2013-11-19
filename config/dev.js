require.config({
	"baseUrl" :  "../",
	"urlArgs": "bust=" + (new Date()).getTime(),
	"paths" : {
		"backbone" : "vendor/backbone-amd/backbone",
		"underscore" : "vendor/underscore-amd/underscore",
		"jquery" : "vendor/jquery/jquery",
		"sync" : "src/sync",
		"httprequest" : "src/connection/http",
		"socket" : "src/connection/socket"
	}
});