/**
 * Serializes and unserializes JSON notation objects.
 *
 */
define(["src/serializer/base"], function(Serializer){

	return Serializer.extend({
	  serialize : function(data){
	    return JSON.stringify(data);
	  },
	  unserialize : function(str){
	    return JSON.parse(str);
	  }
	});

})