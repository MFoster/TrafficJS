var r = require("../config/test.js");
var expect = require("chai").expect;

describe("Basic Test", function(){

	it("should work", function(done){
		r(["src/base"], function(BaseClass){
			var inst = new BaseClass();
			done();
		})
	});

	it("should also work", function(done){
		r(["src/eventdispatcher"], function(EventDispatcher){
			var ed = new EventDispatcher();
			ed.on("change", function(){
				done();
			})
			ed.trigger("change");
		});
	});

	it("should maybe work", function(done){
		r(["src/serializer/bracket"], function(BracketSerial){
			var serial = new BracketSerial();
			var str = serial.serialize({ derp : true, complex : { proper: false }});
			expect(str).to.eql("derp=true&complex[proper]=false");
			done();
		})
	})
});
