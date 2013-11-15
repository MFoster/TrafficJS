/**
 * Factory class for creating HttpRequest/Socket objects.
 *
 */
define(["../eventdispatcher", "http", "socket"], function(EventDispatcher, HttpRequest, Socket){
	return EventDispatcher.extend({
	  options : {
	    method : "post"
	  },
	  initialize : function(options){
	    this.options = _.extend(this.options, options);  //http method, timeout
	  },
	  send : function(connection){
	  
	    this.trigger("send", { target : connection });
	    
	    connection.send();
	    
	    this.trigger("sent", { target : connection });
	  
	  },
	  
	  createConnection : function(url, data){
	    if(url.search(/^ws/) > -1){
	      return this.createSocket(url, data);
	    }
	    else{
	      return this.createRequest(url, data);
	    }
	  },
	  
	  createRequest : function(url, data){
	    var request = new HttpRequest(url, this.options.method, data);
	        
	    this.trigger("create", { target : request, type: "xhr" });
	    
	    return request;
	  },
	  
	  createSocket : function(url, data){
	  
	    var socket = new Socket(url);
	    
	    this.trigger("create", { target : socket, type: "web" })
	    
	    return socket;
	    
	  }  
	});
});