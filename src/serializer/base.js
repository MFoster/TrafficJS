/**
 * Basic Serializer class, doesn't really do much
 * Just provides as the base class, defines the two methods
 * but this is useful if your server is super basic and returning 
 * primitives.
 *
 */
define(["../base"], function(BaseClass){
	return BaseClass.extend({
	  
	  serialize : function(data){
	    return data.toString();
	  },
	  unserialize : function(str){
	    return str;
	  }
	  
	});
});