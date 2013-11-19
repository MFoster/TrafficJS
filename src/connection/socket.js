define(["src/eventdispatcher", "src/serializer/json"], function(EventDispatcher, JsonSerializer){

	return EventDispatcher.extend({
	  
	  serializer : new JsonSerializer(),
	  
	  ready : false,
	  
	  destroyed : false,
	  
	  queue : [],
	  
	  processDelay : 100,
	  
	  processTimer : false,
	  
	  initialize : function(url, data){
	    this.setUrl(url);
	    this.setData(data);
	    if(!window["WebSocket"]){
	      throw new Error("Unable to create websocket, browser does not support it.");
	    }
	  },
	  send : function(data){
	    if(!this.ready && !this.destroyed){
	      this.queue.push(data);
	      this.getSocket();
	      return true;
	    }
	    else if(this.destroyed){
	      return false;
	    }
	    
	    if(data){
	      this.setData(data);
	    }
	    
	    var str = this.serialize(data);
	    
	    return (this.getSocket()).send(str);
	    
	  },
	  handleSocketOpen : function(evt){
	    this.ready = true;
	    if(this.socket.readyState === 1){
	      this.trigger("connection", evt);
	      this.processQueue();
	    }
	    else{
	      this.trigger("failure", evt);
	      this.destroy();
	    }
	  },
	  handleSocketClose : function(evt){
	    this.trigger("close", evt);
	    this.destroy();
	  },
	  handleSocketMessage : function(evt){
	    var data = this.unserialize(evt.data);
	    this.trigger("message", data, evt);
	    this.trigger("success", data, evt);
	  },
	  handleSocketError : function(evt){
	    this.trigger("failure", evt);
	    this.trigger("error", evt);  
	    this.destroy(); 
	  },
	  destroy : function(){
	    this.socket.onopen = null;
	    this.socket.onclose = null;
	    this.socket.onmessage = null;
	    this.socket.onerror = null;
	    this.off();  
	    this.socket.close();
	    this.destroyed = true;
	  },
	  open : function(){
	    return this.getSocket();  
	  },
	  close : function(){
	    this.destroy();  
	  },
	  pause : function(){
	    this.ready = false;
	  },
	  resume : function(){
	    this.ready = true;
	    this.processQueue();  
	  },
	  processQueue : function(){
	    if(this.destroyed){
	      return false;
	    }
	    if(this.ready && this.queue.length > 0){
	      var data = this.queue.pop();
	      this.send(data);
	    } 
	    else if(!this.ready && this.queue.length > 0){
	      //the socket isn't ready yet but it has a queue, wait longer
	      clearTimeout(this.processTimer);
	      this.processTimer = setTimeout(this.processQueue, this.processDelay);
	    }
	    return true;
	        
	  },
	  
	  getSocket : function(){
	    if(this.socket){
	      return this.socket;
	    }
	    else{
	      this.socket = this.createWebSocket();
	      this.socket.onopen = this.handleSocketOpen.bind(this);
	      this.socket.onclose = this.handleSocketClose.bind(this);
	      this.socket.onmessage = this.handleSocketMessage.bind(this);
	      this.socket.onerror = this.handleSocketError.bind(this);
	    }
	  },
	  createWebSocket : function(){
	    return new window.WebSocket(this.getUrl());
	  },
	  setUrl : function(url){
	    this.url = url;
	  },
	  getUrl : function(){
	    return this.url;
	  },
	  setData : function(data){
	    this.data = data;
	  },
	  getData : function(){
	    return this.data;
	  },
	  serialize : function(data){
	    return this.serializer.serialize(data);
	  },
	  unserialize : function(str){
	    return this.serializer.unserialize(str);
	  }
	  

	});


});