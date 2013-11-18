var r = require("../../config/test.js");
var expect = require("chai").expect;

describe("Http Testing", function(){

	it("should respond to the complete event", function(done){
		r(["src/connection/http-test"], function(HttpRequest){
			var request = new HttpRequest("/info.api");
			request.setResponse({});
			request.on("complete", function(){
				done();
			});

			request.send({ "name" : "Sally" });
		});
	});

	it("should responde to the success event", function(done){
		r(["src/connection/http-test"], function(HttpRequest){
			var request = new HttpRequest("/info.api");
			request.setResponse({"name":"Sally"});
			request.on("success", function(){
				done();
			});

			request.send({ "name" : "Sally" });

		});
	});

	it("should respond with json", function(done){
		r(["src/connection/http-test"], function(HttpRequest){
			var request = new HttpRequest("/info.api");
			request.setResponse({"name":"Sally"});
			request.on("success", function(obj){
				expect(obj).to.have.property("name")
									 .and.to.eql("Sally");
				done();
			});

			request.send({"name" : "Frank"});
		});
	})
});
