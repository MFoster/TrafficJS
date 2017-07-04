import Dispatcher from "traffic-dispatch";

export default class HttpQueue extends Dispatcher {
	  
    constructor(requests){
        this.requests = requests || [];
        this.responses = [];
        this.completeHandle = this.handleComplete.bind(this);
    }

    setRequests(requests) {
        this.requests = requests;
        return this;
    }

    add(request){
        this.requests.push(request);
        return this;
    }

    start(){
        if(this.started){
            return false;
        }

        var request = this.requests.shift();  
        request.once("success", this.completeHandle);
        request.send();
        return this;
    }

    handleComplete(response, xhr, request) {
        if(this.requests.length > 0){
            var request = this.requests.shift();
            this.responses.push(response);
            request.once("success", this.completeHandle);
            request.send();
        }
        else{
            var evt = { target : this, responses: this.responses, lastResponse : response, lastXhr : xhr, lastRequest : request, };
            this.trigger("complete", evt);
            this.started = false;
            this.responses = [];
        }  
    }
}
