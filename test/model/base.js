var r = require("../../config/test.js");
var expect = require("chai").expect;

describe("how a model can interact with a test connection", function(){

	it("should be able to sync and reflect the response's data", function(done){
		r(["src/model/base", "src/connection/backbone"], function(BaseModel, HttpRequest){
		
			var model = new BaseModel({ "name" : "Nancy" });
			var request = new HttpRequest("/info.api", "GET");

			request.setResponse({ "name" : "Sally" });

			model.setRequest(request);

			model.on("sync", function(){
			
				var name = model.get("name");

				expect(name).to.eql("Sally");
				
				done();

			});

			model.save();
		});
	});

	it("should set and send a request to server", function(done){
		r(["src/model/base", "src/connection/backbone"], function(BaseModel, HttpRequest){
			var model = new BaseModel();
			model.set("name", "John");
			done();
		});
	});


});