(function(root, dom){

if(!_.capitalize){
_.mixin({
  'capitalize': function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }
});
  
}


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

var sync = function(method, model, options){
        
    this.request.setMethod(method);
    if(model.toJSON){
        this.request.setData(model.toJSON());
    }
    else{
        this.request.setData(model);
    }
    
    if(options && options.success){
        this.request.once("success", options.success);
    }
    
    if(options && options.error){
        this.request.once("failure", options.error);
    }
    
    return this.request.send();
}

var BaseModel = Backbone.Model.extend({

    request : false,
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : (this['set' + _.capitalize(attr)] ? this['set' + _.capitalize(attr)](val) : current[attr] = val);
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = true;
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },
    getId : function(){
        return this.id || this.cid;
    },
    
    setRequest : function(request){
        this.request = request;
    },
    
    getRequest : function(){
        return this.request;
    },
    
    sync : function(method, model, options){
        return sync.apply(this, arguments)
    }

});

var BaseCollection = Backbone.Collection.extend({
    
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

var View = Backbone.View.extend({
    
    deferDelay : 50,
    
    initialize : function(config){
        this.template = config.template;
    },
    render : function() {
        this.$el.html(this.template({ collection: this.collection || [], model: (this.model ? this.model.attributes : {} )}));
        return this;
    },
    defered : function(){
      return _.debounce(this.render.bind(this), this.deferDelay);
    } 
    
});


var FormDelegate = EventDispatcher.extend({
    
    expand : false,
    
    formPrefix : false,
    
    initialize : function(element) {
    
        this.element = dom(element);
        
        this.element.on("submit", "form", this.handleSubmit.bind(this));
     
    },
    
    setExpand : function(bool){
        
        this.expand = bool;
        
    },
    
    getData : function(form) {
        var data = {};
        
        for(var i = 0, len = form.elements.length; i < len; i++) {
            var item = form.elements[i], name = item.name, type = item.type, value = false, radioValue = false;
            
            if (type == "checkbox"){
                if(item.checked) {
                    value = item.value || item.checked;
                }
                else{
                    value = 0;
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
    
    setFormPrefix : function(prefix){
        this.formPrefix = prefix;    
    },
    
    applyModel : function(model){
        var forms = this.element.find("form");
        
        var self = this;
        
        _.each(forms, function(form){
            for(var key in model.attributes){
                var formKey = (self.formPrefix ? self.formPrefix + "[" + key + "]" : key);
                
                if(form[formKey]){
                    var element = form[formKey];
                    var type = element.getAttribute("type");
                    
                    if("checkbox" == type.toLowerCase()){
                        form[formKey].checked = model.get(key); //you better be a boolean!
                    }
                    else{
                        form[formKey].value = model.get(key);
                    }
                }
            }
        });
            
    },
    
    expandKeys : function(struct){
      var expanded = {};
      
      for(var key in struct){
          var keys = key.match(/[^\[\]]+/gi);
          this.traverseKeys(keys, expanded, struct[key]);
      }
      
      return expanded;
        
    },
    
    traverseKeys : function(keys, struct, finalValue){
        
        var key = keys.shift();
        
        var obj = struct[key] || {};
        
        struct[key] = obj;
        
        if(keys.length > 0){
            return this.traverseKeys(keys, obj, finalValue);
        }
        else{
            struct[key] = finalValue;
            return struct;
        }        
    },
    
    handleSubmit : function(e){
                
        var form = e.target || e.srcElement;
        
        var data = this.getData(form);
        
        if(this.expand){
            data = this.expandKeys(data);
        }
        
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
    
        var socket = new Socket(url);
        
        this.trigger("create", { target : socket, type: "web" })
        
        return socket;
        
    }    


});

var HttpRequest = EventDispatcher.extend({
    
    stateArr : ['uninitialized', 'loading', 'loaded', 'interactive', 'complete'],
    
    timeoutDelay : 3000,
    
    queue : [],
    
    httpMethod : "GET",
    
    headers : { },
    
    serializer : new JsonSerializer(),
    
    serializerMap : {
        "json" : JsonSerializer,
        "php"  : PHPPostJsonSerializer,
        "plain": Serializer
    },
    
    initialize : function(url, method, data){
        this.setUrl(url);
        if(method)
            this.setHttpMethod(method);
        if(data)
            this.setData(data);    
    },
    clone : function(){
        var cls = this.constructor;        
        var clone = new cls(this.getUrl(), this.getHttpMethod(), this.getData());
        clone.setSerializer(this.serializer);
        clone.setHeaders(this.headers);
        return clone;  
    },
    
    getCloneClass : function(){
      return HttpRequest;
    },
    
    setUrl : function(url){
        this.url = url;
    },
    setHttpMethod : function(method){
        this.httpMethod = method;
        if("post" == method.toLowerCase() || "put" == method.toLowerCase()){
            this.headers["Content-Type"] = "application/x-www-form-urlencoded";
        }
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
            var val = this.headers[key];
            xhr.setRequestHeader(key, val);
        }
        return xhr;
    },
    handleStateChange : function(xhr){
        var state = this.stateArr[xhr.readyState];
        try{
            if(state == "complete"){
                clearTimeout(xhr.timeout);                                        
            }                       
            this.trigger(state, xhr);
            if(state == "complete" && this.isSuccess(xhr.status)){
                this.triggerState("success", xhr);
            }
            else if(state == "complete" && !this.isSuccess(xhr.status)){
                this.triggerState("failure", xhr);
            }
                                     
        }
        catch(e){
                this.trigger("exception", xhr, e);
        }
    },
    triggerState : function(state, xhr){

        xhr.responseData = this.unserialize(xhr.responseText);

        this.trigger(state, xhr.responseData, xhr, this);
        
    },

    isSuccess : function(status){
        return (status >= 200 && status < 300);
    },
    
    destroy : function(){
        this.off();
    },
    
    send : function(data){
        if(data){
            this.setData(data);
        }
        var str = this.serialize();
        
        var xhr = this.createXHR();
        
        var url = this.getUrl();
        
        if("GET" == this.getHttpMethod().toUpperCase() && str.length > 0){
          url = this.getUrl() + "?" + str;
        }
        
        xhr.open(this.getHttpMethod(), url, true);
        
        xhr.send(str); 
        
        return this;       
    },
    
    handleTimeout : function(xhr){
        
        xhr.abort();
        this.trigger("failure", xhr);
        this.trigger("timeout", xhr);
        
    },
    
    setSerializer : function(ser){
        
        if(typeof ser == "string"){
            this.serializer = new this.serializerMap[ser]();
        }
        else{
            this.serializer = ser;
        }
    
        return this;  
    },
    
    serialize : function(){
        
        return this.serializer.serialize(this.getData());
        
    },
    
    unserialize : function(str){
        return this.serializer.unserialize(str);
    },
    then : function(cb){
        this.once("success", cb);  
        return this;
    },
    otherwise : function(cb){
        this.once("failure", cb);
        return this;
    },
    createXHR : function(){
        var xhr = this.createRawXHR();
        
        xhr.onreadystatechange = _.bind(this.handleStateChange, this, xhr);
        xhr.timeout = setTimeout(_.bind(this.handleTimeout, this, xhr), this.timeoutDelay);
        this.applyHeaders(xhr);
        
        return xhr;
    },
    
    createRawXHR : function(){
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

var HttpQueue = EventDispatcher.extend({
  
  requests : [],
  
  responses : [],
  
  initialize : function(requests){
    
    if(requests){
      this.requests = requests;
    }
    this.completeHandle = this.handleComplete.bind(this);
    
  },
  
  setRequests : function(requests){
    this.requests = requests;
    return this;
  },
  
  add : function(request){
    this.requests.push(request);
    return this;
  },
  
  start : function(){
    if(this.started){
      return false;
    }
    
    var request = this.requests.shift();    
    request.once("success", this.completeHandle);
    request.send();
    return this;
    
  },
  
  handleComplete : function(response, xhr, request){
    
    if(this.requests.length > 0){
      var request = this.requests.shift();
      this.responses.push(response);
      request.once("success", this.completeHandle);
      request.send();
    }
    else{
      var evt = { target : this, responses: this.responses, lastResponse : response, lastXhr : xhr, lastRequest : request, };
      this.trigger("complete", evt);
      this.started = false;
      this.responses = [];
    }
    
  },
  
  then : function(cb){
    this.on("complete", cb);
  }
  
  
  
  
});

var HttpRace = HttpQueue.extend({
  
  count : 0,
  
  start : function(){
  
    if(this.started){
      return false;
    }
  
    this.started = true;
    this.finishLine = this.requests.length;
    this.count = 0;
    while(this.requests.length > 0){
      var request = this.requests.shift();
      request.once("success", this.completeHandle);
      request.send();
    }
    
    return this;
    
  },
  
  handleComplete : function(response, xhr, request){
    
    this.count++;
    
    this.responses.push(response);
    
    if(this.finishLine <= this.count){
      var evt = { target : this, responses: this.responses, lastResponse : response, lastXhr : xhr, lastRequest : request, };
      this.trigger("complete", evt);
      this.started = false;
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
    
    getCloneClass : function(){
      return BackboneRequest;
    },
    
    setMethod : function(method){
        console.log("method inside setMethod %s", method);
        this.setHttpMethod(this.methodMap[method]);   
    }

});

var SymfonyRequest = BackboneRequest.extend({
    
    serializer : new PHPPostJsonSerializer(),
    
    token : null,
    
    prefix : null,
    
    tokenName : "_token",
    
    getCloneClass : function(){
      return SymfonyRequest;
    },
    
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
    
    
})


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

root.PHPPostJsonSerializer = PHPPostJsonSerializer;
root.Serializer      = Serializer;
root.JsonSerializer  = JsonSerializer;
root.BaseClass       = BaseClass;
root.Model           = BaseModel;
root.Collection      = BaseCollection;
root.View            = View;
root.EventDispatcher = EventDispatcher;
root.HttpRequest     = HttpRequest;
root.HttpQueue       = HttpQueue;
root.HttpRace        = HttpRace;
root.ConnectionPool  = ConnectionPool;
root.BackboneRequest = BackboneRequest;
root.FormDelegate    = FormDelegate;
root.WebSocket       = Socket;
root.SymfonyRequest  = SymfonyRequest;
})(window.Traffic = {}, window.jQuery);