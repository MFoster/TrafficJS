var r = require("../../config/test.js");
var expect = require("chai").expect;

describe("BaseSerializer", function(){

	it("should return the same string it's given", function(done){
		r(["src/serializer/base"], function(BaseSerializer){
			var serializer = new BaseSerializer();
			var str = "Sally";

			expect(serializer.serialize(str)).to.eql(str);
			done();

		});
	});


	it("should serialize an object into a string", function(done){
		r(["src/serializer/base"], function(BaseSerializer){
			var serializer = new BaseSerializer();
			var obj = { "name" : "Nancy" };

			expect(serializer.serialize(obj)).to.eql("[object Object]");
			done();

		});
	});

	it("should serialize an array into a comma separated list", function(done){
		r(["src/serializer/base"], function(BaseSerializer){
			var serializer = new BaseSerializer();
			var arr = ["Nancy", "Sally"];

			expect(serializer.serialize(arr)).to.eql("Nancy,Sally");
			done();
		});


	})


})