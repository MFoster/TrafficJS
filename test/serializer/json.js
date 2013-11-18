var r = require("../../config/test.js");
var expect = require("chai").expect;


describe("Json Serializer", function(){

	it("should return valid json when given an object", function(done){

		r(["src/serializer/json"], function(JsonSerializer){
			var serializer = new JsonSerializer();
			var str = serializer.serialize({ name : "Sally" });

			expect(str).to.eql('{"name":"Sally"}');
			done();
		});
	});

	it("should receive json and form a string", function(done){
		r(["src/serializer/json"], function(JsonSerializer){

			var serializer = new JsonSerializer();
			var str = '{"name":"Sally"}';
			var obj = serializer.unserialize(str);

			expect(obj).to.have.property("name")
								 .and.to.eql("Sally");
			done();

		});

	});

	

});