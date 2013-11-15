define(["../eventdispatcher"], function(EventDispatcher){
	
	return EventDispatcher.extend({
	  
	  requests : [],
	  
	  responses : [],
	  
	  initialize : function(requests){
	  
	    if(requests){
	      this.requests = requests;
	    }
	    this.completeHandle = this.handleComplete.bind(this);
	  
	  },
	  setRequests : function(requests){
	    this.requests = requests;
	    return this;
	  },
	  add : function(request){
	    this.requests.push(request);
	    return this;
	  },
	  start : function(){
	    if(this.started){
	      return false;
	    }
	    
	    var request = this.requests.shift();  
	    request.once("success", this.completeHandle);
	    request.send();
	    return this;
	    
	  },
	  
	  handleComplete : function(response, xhr, request){
	    
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
	  },
	  then : function(cb){
	    this.once("complete", cb);
	  }
	});

});