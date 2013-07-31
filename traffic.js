(function(root, dom){

if(!_.capitalize){
_.mixin({
  'capitalize': function(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }
});
  
}
/**
 * Primary Traffic.sync method. This is what each class delegates to.
 * Uses a request instance to handle communications.
 *
 * @param arg
 * @return void
 */
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

/**
 * Creates a separate reference
 *
 */
var EventDispatcher = BaseClass.extend({

});

_.extend(EventDispatcher.prototype, Backbone.Events);


var BaseModel = Backbone.Model.extend({

  request : false,
  
  getId : function(){
    return this.id || this.cid;
  },
  
  setRequest : function(request){
    this.request = request;
  },
  /**
   * Returns the request object assigned to this model
   *
   * @return HttpRequest
   */
  getRequest : function(){
    return this.request;
  },
  /**
   * Sync method, delegates to Traffic.sync
   *
   * @param string method
   * @param object BaseModel
   * @param options mixed
   * @return HttpRequest
   */
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

var PersistanceCollection = BaseCollection.extend({
  deleteChain : [],
  updateChain : [],
  createChain : [],
  
  _onModelEvent: function(event, model, collection, options) {
  
    this.persist(event, model);
    
    return BaseCollection.prototype._onModelEvent.apply(this, arguments);
  
  },
  
  persist : function(event, model){
    if("add" == event && !model.id && this.createChain.indexOf(model) == -1){//adding an entity without an id
      this.createChain.push(model);
    }
    else if("remove" == event && model.id && this.deleteChain.indexOf(model) == -1){//remove an entity with an id
      this.deleteChain.push(model);
    }
    else if("change" == event && model.id && this.updateChain.indexOf(model) == -1){//changed an entity with an id
      this.updateChain.push(model);
    }
    else if("change" == event && model.cid && this.createChain.indexOf(model) == -1){
      this.createChain.push(model);
    }
  },
    
  flush : function(){
  
    if(this.createChain.length > 0){
      this.flushChain(this.createChain);
    }
    
    if(this.updateChain.length > 0){
      this.flushChain(this.updateChain);
    }
    
    if(this.deleteChain.length > 0){
      this.flushChain(this.deleteChain);
    }
      
  },
  
  flushChain : function(chain){
    _.each(chain, function(model, index){
      var cb = function(response){
      chain.splice(index, index+1);
      }
      
      model.save().then(cb).otherwise(cb);
    });
  } 
  
});

var View = Backbone.View.extend({
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


var FormDelegate = EventDispatcher.extend({
  expand : false,
  initialize : function(element) {
    this.element = dom(element);
    this.element.on("submit", "form", this.handleSubmit.bind(this));
  },
  setExpand : function(bool){
    this.expand = bool;
  },
  /**
   * Receives an html form element and iterates over it's children and
   * extracts the values to compose a hash object to represent
   * the data.  Handles collision detection with elements like checkboxes etc
   *
   * @param arg
   * @return void
   */
  getData : function(form) {
    var data = {};
    
    for(var i = 0, len = form.elements.length; i < len; i++) {
      var item = form.elements[i], 
        name = item.name, 
        type = item.type, 
        value = false, 
        radioValue = false;
      
      //check box values will stack
      //this logic is determining whether to use value of the element
      //or simply setting it to true or false
      if (type == "checkbox"){
        if(item.checked) {
          value = item.checked ? item.value || item.checked : 0; 
        }
      }
      //radio button value gets set for the first element that is checked
      //others are ignored
      else if (type == "radio" && item.checked && !data[name]){  
        data[name] = item.value;
      	continue;
      }
      else {
        value = item.value;
      }
      //if the name is not defined, or the value is empty and the element has a data-unset attribute
      //if this is hit it avoids being placed in the collection at all.
      if(_.isEmpty(name) || (_.isEmpty(value) && item.hasAttribute("data-unset"))) {
        continue;
      }
      //collision detection and handling section.
      //it's unset and is able to be assigned the value.
      if(data[name] == undefined){
        data[name] = value;
      }
      //it's already an array, add to the stack
      else if(typeof data[name] == "object" && data[name].length){
        data[name].push(value);
      }
      //it's set and needs to be converted into an array
      else if(data[name]){
        var oldValue = data[name];
        data[name] = [];
        data[name].push(oldValue);
        data[name].push(value);
      }
    }
    
    if(this.expand){
      data = this.expandKeys(data);
    }
    
    return data;
  },
  /**
   * Applies a model's values to a form
   *
   * @param arg
   * @return void
   */
  applyModel : function(model){
    var forms = this.element.find("form");
    
    var self = this;
    
    _.each(forms, function(form){
      for(var key in model.attributes){
        var formKey = self.createFormKey(key);
        
        if(form[formKey]){
          var element = form[formKey];
          var type = element.getAttribute("type");
          
          if("checkbox" == type.toLowerCase()){
            form[formKey].checked = model.get(key); 
          }
          else{
            form[formKey].value = model.get(key);
          }
        }
      }
    });
      
  },
  /**
   * Used mainly for subclassing. lets each class create it's own form key.
   * nice for applyModel
   *
   * @param arg
   * @return void
   */
  createFormKey : function(key){
    return key;
  },
  /**
   * This method is used to break out the structure in the 
   * PHP notation form elements. A sample object would look like
   * { 
   *     "someform[childele]" : "MyValue",
   *     "someform[childtwo]" : "SecondValue"
   * }
   *
   * @param arg
   * @return object
   */
  expandKeys : function(struct){
    var expanded = {};
    
    for(var key in struct){
      var keys = key.match(/[^\[\]]+/gi);
      this.traverseKeys(keys, expanded, struct[key]);
    }
    
    return expanded;
  },
  /**
   * Iterates over an array and constructs a nested object
   *
   * @param arg
   * @return void
   */
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
  /**
   * Captures the native submit event, iterates over the form's element
   * creates a hash structure representation of the form's information
   * and fires an event of it's own with the extracted data
   *
   * @param e event
   * @return false
   */
  handleSubmit : function(e){
        
    var form = e.target || e.srcElement;
    
    var data = this.getData(form);
    
    this.trigger("submit", {data : data, target : this, event : e, form : form });

    return false;
  }
  
});
/**
 * Handles the extraction of the data with a prefix.
 *
 */
var SymfonyFormDelegate = FormDelegate.extend({
  
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
/**
 * Basic Serializer class, doesn't really do much
 * Just provides as the base class, defines the two methods
 * but this is useful if your server is super basic and returning 
 * primitives.
 *
 */
var Serializer = BaseClass.extend({
  
  serialize : function(data){
    return data.toString();
  },
  
  unserialize : function(str){
    return str;
  }
  
});
/**
 * Serializes and unserializes JSON notation objects.
 *
 */
var JsonSerializer = Serializer.extend({
  
  serialize : function(data){
    return JSON.stringify(data);
  },
  unserialize : function(str){
    return JSON.parse(str);
  }
  
});

/**
 * Serializes to typical query string but if nested, will resort to php nested notation
 * Deserializes JSON, coming back from the server.
 * This is a handy class as you can send the server serialization it typically deals with
 * and then respond to the client with JSON.
 *
 */
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
/**
 * Factory class for creating HttpRequest/Socket objects.
 *
 */
var ConnectionPool = EventDispatcher.extend({
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
/**
 * Proxy class for native XmlHttpRequest. Manages
 *
 * @param arg
 * @return void
 */
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
  /**
   * HttpRequest constructor
   *
   * @param string url     The URL for the request to send to.
   * @param string method  
   * @return void
   */
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
  /**
   * Assigns a single header
   *
   * @param string key
   * @param 
   * @return void
   */
  setHeader : function(key, value){
    this.headers[key] = value;
  },
  /**
   * Adds or overwrites headers to the request's header
   * hash object.
   *
   * @param arg
   * @return void
   */
  setHeaders : function(obj){
    this.headers = _.extend(this.headers, obj);  
  },
  /**
   * Receives an xhr object and iterates over the request's header
   * hash object and applies each key value as a header to the XHR.
   *
   * @param arg
   * @return void
   */
  applyHeaders : function(xhr){
    for(var key in this.headers){
      var val = this.headers[key];
      xhr.setRequestHeader(key, val);
    }
    return xhr;
  },
  /**
   * Event listener attached to the native xhr's onreadystatechange
   * method.  Mainly inspects the XHR and dispatches requests of its own.
   *
   * @param XMLHttpRequest xhr
   * @return void
   */
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
  /**
   * Attempts to unserialize the XHR's responseText
   * only used for final states of failure or success
   *
   * @param string          state
   * @param XmlHttpRequest  xhr
   */
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
  /**
   * Serializes the request's data object. 
   * Creates the native XHR.
   * Opens and sends XHR.
   *
   * @param arg
   * @return void
   */
  send : function(data){
    if(data){
      this.setData(data);
    }
    var str = this.serialize();
        xhr = this.createXHR();
        url = this.getUrl();
    
    if("GET" == this.getHttpMethod().toUpperCase() && str.length > 0){
      url = this.getUrl() + "?" + str;
    }
    
    xhr.open(this.getHttpMethod(), url, true);
    
    this.applyHeaders(xhr);
    
    xhr.send(str); 
    
    return this;     
  },
  /**
   * Callback function attached to a setTimeout method that is invoked
   * on the xhr's creation.  The timer gets canelled after completion
   * otherwise this is fired and the XHR is aborted.
   *
   * @param arg
   * @return void
   */
  handleTimeout : function(xhr){
    xhr.abort();
    this.trigger("failure", xhr);
    this.trigger("timeout", xhr);    
  },
  /**
   * Send a string matching one of the keys in the serializerMap
   * or a serializer object.
   *
   * @param mixed ser
   * @return void
   */
  setSerializer : function(ser){
    if(typeof ser == "string"){
      this.serializer = new this.serializerMap[ser]();
    }
    else{
      this.serializer = ser;
    }
    return this;  
  },
  /**
   * Invokes the serializers serialize method on the Request's data
   *
   * @return string
   */
  serialize : function(){
    return this.serializer.serialize(this.getData());
  },
  /**
   * Invokes the serializers unserialize method on the string provided
   *
   * @param string str
   * @return mixed
   */
  unserialize : function(str){
    return this.serializer.unserialize(str);
  },
  /**
   * Convienence function to attach callback to success event
   *
   * @param Function cb
   * @return void
   */
  then : function(cb){
    this.once("success", cb);  
    return this;
  },
  /**
   * Convienence function to attach callback to failure event
   *
   * @param arg
   * @return void
   */
  otherwise : function(cb){
    this.once("failure", cb);
    return this;
  },
  /**
   * Gets an XHR and attaches the request's listeners
   * to the native XHR callback.  Also invokes
   * the timeout functionality and applies headers.
   *
   * @return XmlHttpRequest
   */
  createXHR : function(){
    var xhr = this.createRawXHR();
    
    xhr.onreadystatechange = _.bind(this.handleStateChange, this, xhr);
    xhr.timeout = setTimeout(_.bind(this.handleTimeout, this, xhr), this.timeoutDelay);
    
    return xhr;
  },
  /**
   * Creates the native XmlHttpRequest object.
   *
   * @return XMLHttpRequest
   */
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

root.PHPPostJsonSerializer = PHPPostJsonSerializer;
root.Serializer            = Serializer;
root.JsonSerializer        = JsonSerializer;
root.BaseClass             = BaseClass;
root.Model                 = BaseModel;
root.Collection            = BaseCollection;
root.View                  = View;
root.EventDispatcher       = EventDispatcher;
root.HttpRequest           = HttpRequest;
root.HttpQueue             = HttpQueue;
root.HttpRace              = HttpRace;
root.ConnectionPool        = ConnectionPool;
root.BackboneRequest       = BackboneRequest;
root.FormDelegate          = FormDelegate;
root.WebSocket             = Socket;
root.SymfonyRequest        = SymfonyRequest;
root.SymfonyFormDelegate   = SymfonyFormDelegate;
root.PersistanceCollection = PersistanceCollection;
})(window.Traffic = {}, window.jQuery);