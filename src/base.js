define(["backbone"], function(Backbone){

	/**
	 * Generic class that simply calls it's own initialize method
	 */
	var BaseClass = function(){
	  this.initialize.apply(this, arguments);
	};

	//hijack's Backbone's extend method
	BaseClass.extend = Backbone.Model.extend;

	//Assigns a named function to the initialize method.  
	BaseClass.prototype.initialize = function BaseClassConstructor(){};

	return BaseClass;
})