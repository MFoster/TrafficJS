define(["./backbone", "src/serializer/bracket"], function(Request, Serializer){

	return Request.extend({
  
	  serializer : new Serializer(),
	  
	  token : null,
	  
	  prefix : null,
	  
	  tokenName : "_token",

	  setPrefix : function(pref){
	    this.prefix = pref;
	  },
	  setToken : function(tok){
	    this.token = tok;
	  },
	  getToken : function(){
	    return this.token;
	  },
	  clone : function(){
	    var clone = BackboneRequest.prototype.clone.apply(this, arguments);
	    if(this.prefix){
	      clone.setPrefix(this.prefix);
	    }
	    if(this.token){
	      clone.setToken(this.token);
	    }
	    return clone;  
	  },
	  serialize : function(){
	    var data = this.getData();
	    var pref = this.prefix;
	    
	    if(this.token && !data[this.tokenName]){
	      data[this.tokenName] = this.getToken();
	    }
	    
	    var obj = {};
	    
	    obj[pref] = data;
	    
	    return this.serializer.serialize(obj);
	    
	  }  
	});

});