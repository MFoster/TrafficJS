define(["httprequest"], function(HttpRequest){
	return HttpRequest.extend({
	  methodMap : {
	    'read' : 'GET',
	    'create' : 'POST',
	    'update' : 'PUT',
	    'delete' : 'DELETE'
	  },
	
	  setMethod : function(method){
	    this.setHttpMethod(this.methodMap[method]);   
	  }

	});
});