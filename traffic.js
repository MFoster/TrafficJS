(function(root, dom){

var BaseClass = function(){
    this.initialize.apply(this, arguments);
};

BaseClass.extend = Backbone.Model.extend;

BaseClass.prototype.initialize = function BaseClassConstructor(){};

var EventDispatcher = BaseClass.extend({

    initialize : function(){
        
    },
    once : function(name, callback, context){
        var self = this;
        var wrap = function(){
            callback.apply(context, arguments);
            self.off(name, wrap);
        }
        this.on(name, wrap);
    }

});

_.extend(EventDispatcher.prototype, Backbone.Events);

var BaseModel = Backbone.Model.extend({

    request : false,
    
    setRequest : function(request){
        this.request = request;
    },
    
    getRequest : function(){
        return this.request;
    },
    
    sync : function(method, model, options){
        
        this.request.setMethod(method);
        this.request.setData(this.attributes);
        
        this.request.once("success", options.success);
        this.request.once("failure", options.error);
        
        this.request.send();
    }

});

var BaseCollection = Backbone.Collection.extend({
    
    request : false,
    
    setRequest : function(request){
        this.request = request;
    },
    getRequest : function(){
        return this.request;
    },
    
    sync : function(method, coll, options){
        
        this.request.setMethod(method);
        this.request.setData(coll.toJSON());
        
        this.request.once("success", options.success);
        this.request.once("failure", options.error);
        
        this.request.send();
    }

});



var FormDelegate = EventDispatcher.extend({
    
    initialize : function(element) {
    
        this.element = dom(element);
        
        this.element.delegate("form", "submit", this.handleSubmit.bind(this));
     
    },
    
    getData : function(form) {
        var data = {};
        
        for(var i = 0, len = form.elements.length; i < len; i++) {
            var item = form.elements[i], name = item.name, type = item.type, value = false, radioValue = false;
            
            if (type == "checkbox"){
                if(item.checked) {
                    value = item.value || item.checked;
                }
                else if(item.hasAttribute("data-unchecked-value")){
                    value = item.getAttribute("data-unchecked-value");
                }
                else{
                    continue;
                }
            }
            else {
                value = item.value;
            }
            
            if (type == "radio"){    
            	if (item.checked){
	            	radioValue = item.value;
	            	if(data[name] == undefined){
		                data[name] = radioValue;
		            }
                }
            	continue;
            }
            if(name == "" || name == undefined || name == "undefined" || name == false || 
              (type == "text" && value == "" && item.hasAttribute("data-unset"))) {
                continue;
            }
            if(data[name] == undefined){
                data[name] = value;
            }
            else if(typeof data[name] == "object" && data[name].length){
                data[name].push(value);
            }
            else if(data[name]){
                var oldValue = data[name];
                data[name] = [];
                data[name].push(oldValue);
                data[name].push(value);
            }
        }        
        return data;
    },

    handleSubmit : function(e){
                
        var form = e.target || e.srcElement;
        
        var data = this.getData(form);
        
        this.trigger("submit", {data : data, target : this, event : e, form : form });

        return false;
    }
    
});

var Serializer = BaseClass.extend({
    
    serialize : function(data){
        return data.toString();
    },
    
    unserialize : function(str){
        return str;
    }
    
});

var JsonSerializer = Serializer.extend({
    
    serialize : function(data){
        return JSON.stringify(data);
    },
    unserialize : function(str){
        return JSON.parse(str);
    }
    
});


var PHPPostJsonSerializer = JsonSerializer.extend({
 
    serialize : function(data){
        var str = this._serialize(data);
        str = str.replace(/&+/gi, '&').replace(/^&/, '');
        return str;   
    },
    _serialize : function(obj, ancestor){
        var str = "", item;
        for(var key in obj){
            item = obj[key];
            
            if(typeof item == "object"){
                if(ancestor){
                    str += "&" + this._serialize(item, ancestor + "[" + key + "]");
                }
                else{
                    str += "&" + this._serialize(item, key);
                }
            }
            else if(ancestor){
                str +=  "&" + ancestor + "[" + encodeURIComponent(key)  + "]=" + encodeURIComponent(item);
            }
            else{
                str += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(item);
            }
            
        }
        return str;
    }
    
});

var ConnectionPool = EventDispatcher.extend({
    options : {
        method : "post"
    },
    initialize : function(options){
        this.options = _.extend(this.options, options);    //http method, timeout
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
    
        var socket = new root.WebSocket(url);
        
        this.trigger("create", { target : socket, type: "web" })
        
        return socket;
        
    }    


});

var HttpRequest = EventDispatcher.extend({
    
    stateArr : ['uninitialized', 'loading', 'loaded', 'interactive', 'complete'],
    
    timeoutDelay : 3000,
    
    queue : [],
    
    headers : { 
           // 'X-XmlHttpRequest' : 'Bridge',
            //'Content-Type': "application/x-www-form-urlencoded"
    },
    
    serializer : new JsonSerializer(),
    
    initialize : function(url, method, data){
        this.setUrl(url);
        this.setHttpMethod(method);
        this.setData(data);    
    },
    setUrl : function(url){
        this.url = url;
    },
    setHttpMethod : function(method){
        this.httpMethod = method;
    },
    setData : function(data){
        this.data = data;
    },
    getHttpMethod : function(){
        return this.httpMethod;
    },
    getUrl : function(){
        return this.url;
    },
    getData : function(){
        return this.data;
    },
    setHeader : function(key, value){
        this.headers[key] = value;
    },
    setHeaders : function(obj){
        this.headers = _.extend(this.headers, obj);  
    },
    applyHeaders : function(xhr){
        for(var key in this.headers){
            xhr.setRequestHeader(key, this.headers[key]);
        }
        return xhr;
    },
    setXHR : function(xhr){
        //if(this.xhr){
        //    this.destroyXHR();
        //}
        this.xhr = xhr;
        this.applyHeaders(xhr);
        this.xhr.onreadystatechange = _.bind(this.handleStateChange, this, xhr);
        this.xhr.open(this.getHttpMethod(), this.getUrl(), true);
    },
    prepareXHR : function(xhr){
    
        this.applyHeaders(xhr);
        xhr.onreadystatechange = _.bind(this.handleStateChange, this, xhr);
        xhr.open(this.getHttpMethod(), this.getUrl(), true);
        return xhr;
    },
    handleStateChange : function(xhr){
        var state = this.stateArr[xhr.readyState];
        try{
            if(state == "complete"){
                    clearTimeout(xhr.timeout);
                    this.transactionFlag = false;                                        
            }                       
            this.trigger(state, xhr);
            if(state == "complete" && this.isSuccess(xhr.status))
                    this.triggerSuccess(xhr);
            else if(state == "complete" && !this.isSuccess(xhr.status))
                    this.trigger("failure", xhr);                     
        }
        catch(e){
                this.trigger("exception", xhr, e);
        }
    },
    triggerSuccess : function(xhr){
    
        xhr.responseData = this.unserialize(xhr.responseText);
        this.trigger("success", xhr.responseData, xhr);
        
    },
    
    isSuccess : function(status){
        return (status >= 200 && status < 300);
    },
    
    destroy : function(){
        this.off();
        this.destroyXHR();  
    },
    
    destroyXHR : function(){
        this.xhr.onreadystatechange = null;
        delete this.xhr;
    },
    
    send : function(data){
        if(data){
            this.setData(data);
        }
        if(this.transactionFlag){
            var state = this.getState();
            this.queue.push(state);
        }
        else{
            var str = this.serialize();
            this.transactionFlag = true;
            this.setXHR(this.createXHR());
            this.xhr.send(str);
            this.xhr.timeout = setTimeout(_.bind(this.handleTimeout, this, this.xhr), this.timeoutDelay);
        }
    },
    
    handleTimeout : function(xhr){
        
        xhr.abort();
        this.trigger("failure", xhr);
        this.trigger("timeout", xhr);
        
    },
    
    serialize : function(){
        
        return this.serializer.serialize(this.getData());
        
    },
    
    unserialize : function(str){
        return this.serializer.unserialize(str);
    },
    
    createXHR : function(){
        try{
            return new XMLHttpRequest();
        }
        catch(e){
            try{
                return new ActiveXObject('Msxml2.XMLHTTP')
                }
        catch(e2){
            return new ActiveXObject('Microsoft.XMLHTTP')
            }
        }
    }
});

var BackboneRequest = HttpRequest.extend({
    methodMap : {
        'read' : 'GET',
        'create' : 'POST',
        'update' : 'PUT',
        'delete' : 'DELETE'
    },
    
    setMethod : function(method){
        this.setHttpMethod(this.methodMap[method]);   
    }

});


var Socket = EventDispatcher.extend({
    
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

root.Serializer      = Serializer;
root.JsonSerializer  = JsonSerializer;
root.BaseClass       = BaseClass;
root.BaseModel       = BaseModel;
root.BaseCollection  = BaseCollection;
root.EventDispatcher = EventDispatcher;
root.HttpRequest     = HttpRequest;
root.ConnectionPool  = ConnectionPool;
root.BackboneRequest = BackboneRequest;
root.FormDelegate    = FormDelegate;
root.WebSocket       = Socket;
})(window.Traffic = {}, window.jQuery);
