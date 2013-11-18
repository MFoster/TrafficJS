define(function(){
	return function(method, model, options){
	  this.request.setMethod(method);
	  if(model.toJSON){
	    this.request.setData(model.toJSON());
	  }
	  else{
	    this.request.setData(model);
	  }
	  
	  if(options && options.success){
	    this.request.once("success", options.success);
	  }
	  
	  if(options && options.error){
	    this.request.once("failure", options.error);
	  }
	  
	  return this.request.send();
	};
});