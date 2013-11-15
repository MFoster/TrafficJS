define(["backbone"], function(Backbone){

	return Backbone.View.extend({
	  debounceTime : 50,
	  initialize : function(config){
	    this.template = config.template;
	  },
	  render : function() {
	    this.$el.html(this.template({ collection: this.collection || [], model: (this.model ? this.model.attributes : {} )}));
	    return this;
	  },
	  debouncedRender : function(){
	    return _.debounce(this.render.bind(this), this.debounceTime);
	  } 
	  
	});

})