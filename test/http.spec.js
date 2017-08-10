import HttpRequest from "../src/http";
import sinon from "sinon";
import { assert } from "chai";

describe("HttpRequest", ()=>{
    it("should be able to set a content type header to application/json", ()=>{
        const ct = "Content-Type", 
              body = "application/json",
              request = new HttpRequest("nowhere.cgi", "GET");

        request.setHeader(ct, body);

        assert.equal(request.getHeader(ct), body);
    });

    it("should be able to set the data on the request object", () => {
        const fixture = { "prop1" : true, "prop2" : false},
              request = new HttpRequest("nowhere.cgi", "GET");
              
        request.setData(fixture);

        assert.equal(request.getData(), fixture);
    });
    

});