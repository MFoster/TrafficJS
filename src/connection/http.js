/**
 * Proxy class for native XmlHttpRequest. Manages
 *
 * @param arg
 * @return void
 */
define(["../eventdispatcher"], function(EventDispatcher){

  return EventDispatcher.extend({
    
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

});