/**
 * Handles the extraction of the data with a prefix.
 *
 */
define(["./formdelegate"], function(FormDelegate){
	return FormDelegate.extend({
		formPrefix : false,
	  expand : true,
	  setFormPrefix : function(prefix){
	    this.formPrefix = prefix;  
	  },
	  createFormKey : function(key){
	    return (this.formPrefix ? this.formPrefix + "[" + key + "]" : key);
	  },
	  getData : function(){
	    var data = FormDelegate.prototype.getData.apply(this, arguments);
	    return (this.formPrefix && data[this.formPrefix] ? data[this.formPrefix] : data);
	  }
	});
});