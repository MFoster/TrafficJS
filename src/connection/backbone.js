define(["queue"], function(HttpQueue){
	return HttpRequest.extend({
	  methodMap : {
	    'read' : 'GET',
	    'create' : 'POST',
	    'update' : 'PUT',
	    'delete' : 'DELETE'
	  },
	  
	  getCloneClass : function(){
	    return BackboneRequest;
	  },
	  
	  setMethod : function(method){
	    console.log("method inside setMethod %s", method);
	    this.setHttpMethod(this.methodMap[method]);   
	  }

	});
});