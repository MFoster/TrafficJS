var r = require("../../config/test.js");
var expect = require("chai").expect;


describe("False XHR", function(){

	it("should run through 5 states and complete", function(done){
		r(["src/connection/xhr"], function(XHR){
			var x = new XHR();

			x.on("change", function(xhr){
				if(xhr.readyState == 4){
					done();
				}
			});
			x.send();
		});
	});
})