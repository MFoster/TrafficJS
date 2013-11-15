define(["queue"], function(HttpQueue){

	return HttpQueue.extend({
	  
	  count : 0,
	  
	  start : function(){
	  
	    if(this.started){
	      return false;
	    }
	  
	    this.started = true;
	    this.finishLine = this.requests.length;
	    this.count = 0;
	    while(this.requests.length > 0){
	      var request = this.requests.shift();
	      request.once("success", this.completeHandle);
	      request.send();
	    }
	    
	    return this;
	  
	  },
	  
	  handleComplete : function(response, xhr, request){
	    
	    this.count++;
	    
	    this.responses.push(response);
	    
	    if(this.finishLine <= this.count){
	      var evt = { target : this, responses: this.responses, lastResponse : response, lastXhr : xhr, lastRequest : request, };
	      this.trigger("complete", evt);
	      this.started = false;
	    }
	  
	  }
	  
	});



}
