define(["backbone"], function(Backbone){
	return Backbone.Model.extend({

	  request : false,
	  
	  getId : function(){
	    return this.id || this.cid;
	  },
	  
	  setRequest : function(request){
	    this.request = request;
	  },
	  /**
	   * Returns the request object assigned to this model
	   *
	   * @return HttpRequest
	   */
	  getRequest : function(){
	    return this.request;
	  },
	  /**
	   * Sync method, delegates to Traffic.sync
	   *
	   * @param string method
	   * @param object BaseModel
	   * @param options mixed
	   * @return HttpRequest
	   */
	  sync : function(method, model, options){
	    return sync.apply(this, arguments)
	  }
	});
});