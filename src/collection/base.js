define(["backbone", "src/model/base"], function(Backbone, BaseModel){
	return Backbone.Collection.extend({
	  request : false,
	  model : BaseModel,
	  initialize : function(models, options){
	    if(options.request){
	      this.setRequest(options.request)
	    }
	  },  
	  setRequest : function(request){
	    this.request = request;
	  },
	  getRequest : function(){
	    return this.request;
	  },
	  sync : function(method, model, options){
	    return sync.apply(this, arguments)
	  },
	  _prepareModel : function(attrs, options){
	  
	    var model = Backbone.Collection.prototype._prepareModel.apply(this, arguments);  
	    model.setRequest(this.request.clone());
	    
	    return model;
	  }

	});
})