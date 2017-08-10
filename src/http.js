import Broadcaster from "traffic-dispatch";
import { JsonSerializer } from "traffic-serialize";
import _ from "lodash";
/**
 * Proxy class for native XmlHttpRequest. Manages
 *
 * @param arg
 * @return void
 */
export default class HttpRequest extends Broadcaster {
    /**
     * HttpRequest constructor
     *
     * @param string url     The URL for the request to send to.
     * @param string method  
     * @return void
     */
    constructor(url, method, data) {
        super()
        this.timeoutDelay = 3000;
        this.stateArr = ["uninitialized", "loading", "loaded", "interactive", "complete"];
        this.httpMethod = "GET";
        this.headers = {};
        this.queue = [];
        //this.serializer = new JsonSerializer();
        this.setUrl(url);
        if (method)
            this.setHttpMethod(method);
        if (data)
            this.setData(data);
    }
    // clone() {
    //     var cls = this.constructor;
    //     var clone = new cls(this.getUrl(), this.getHttpMethod(), this.getData());
    //     clone.setSerializer(this.serializer);
    //     clone.setHeaders(this.headers);
    //     return clone;
    // }

    setUrl(url) {
        this.url = url;
    }
    setHttpMethod(method) {
        this.httpMethod = method;
    }
    setData(data) {
        this.data = data;
    }
    getHttpMethod() {
        return this.httpMethod;
    }
    getUrl() {
        return this.url;
    }
    getData() {
        return this.data;
    }
    getHeader(key) {
        return this.headers[key]
    }
    /**
     * Assigns a single header
     *
     * @param string key
     * @param 
     * @return void
     */
    setHeader(key, value) {
        this.headers[key] = value;
    }
    /**
     * Adds or overwrites headers to the request"s header
     * hash object.
     *
     * @param arg
     * @return void
     */
    setHeaders(obj) {
        this.headers = _.extend(this.headers, obj);
    }
    /**
     * Receives an xhr object and iterates over the request"s header
     * hash object and applies each key value as a header to the XHR.
     *
     * @param arg
     * @return void
     */
    applyHeaders(xhr) {
        for (var key in this.headers) {
            var val = this.headers[key];
            xhr.setRequestHeader(key, val);
        }
        return xhr;
    }
    /**
     * Event listener attached to the native xhr"s onreadystatechange
     * method.  Mainly inspects the XHR and dispatches requests of its own.
     *
     * @param XMLHttpRequest xhr
     * @return void
     */
    handleStateChange(xhr) {
        var state = this.stateArr[xhr.readyState];

        if (state == "complete") {
            clearTimeout(xhr.timeout);
        }
        this.trigger(state, xhr);
        if (state == "complete" && this.isSuccess(xhr.status)) {
            this.triggerState("success", xhr);
        }
        else if (state == "complete" && !this.isSuccess(xhr.status)) {
            this.triggerState("failure", xhr);
        }

    }
    /**
     * Attempts to unserialize the XHR"s responseText
     * only used for final states of failure or success
     *
     * @param string          state
     * @param XmlHttpRequest  xhr
     */
    triggerState(state, xhr) {
        xhr.responseData = this.unserialize(xhr.responseText);
        this.trigger(state, xhr.responseData, xhr, this);
    }

    isSuccess(status) {
        return (status >= 200 && status < 300);
    }

    destroy() {
        this.off();
    }
    /**
     * Serializes the request"s data object. 
     * Creates the native XHR.
     * Opens and sends XHR.
     *
     * @param arg
     * @return void
     */
    send(data) {
        if (data) {
            this.setData(data);
        }
        var str = this.serialize();
        xhr = this.createXHR();
        url = this.getUrl();

        if ("GET" == this.getHttpMethod().toUpperCase() && str.length > 0) {
            url = this.getUrl() + "?" + str;
        }

        xhr.open(this.getHttpMethod(), url, true);

        this.applyHeaders(xhr);

        xhr.send(str);

        return this;
    }
    /**
     * Callback function attached to a setTimeout method that is invoked
     * on the xhr"s creation.  The timer gets canelled after completion
     * otherwise this is fired and the XHR is aborted.
     *
     * @param arg
     * @return void
     */
    handleTimeout(xhr) {
        xhr.abort();
        this.trigger("failure", xhr);
        this.trigger("timeout", xhr);
    }
    /**
     * Send a string matching one of the keys in the serializerMap
     * or a serializer object.
     *
     * @param mixed ser
     * @return void
     */
    setSerializer(ser) {
        if (typeof ser == "string") {
            this.serializer = new this.serializerMap[ser]();
        }
        else {
            this.serializer = ser;
        }
        return this;
    }
    /**
     * Invokes the serializers serialize method on the Request"s data
     *
     * @return string
     */
    serialize() {
        return this.serializer.serialize(this.getData());
    }
    /**
     * Invokes the serializers unserialize method on the string provided
     *
     * @param string str
     * @return mixed
     */
    unserialize(str) {
        return this.serializer.unserialize(str);
    }
    /**
     * Gets an XHR and attaches the request"s listeners
     * to the native XHR callback.  Also invokes
     * the timeout functionality and applies headers.
     *
     * @return XmlHttpRequest
     */
    createXHR() {
        var xhr = this.createRawXHR();

        xhr.onreadystatechange = _.bind(this.handleStateChange, this, xhr);
        xhr.timeout = setTimeout(_.bind(this.handleTimeout, this, xhr), this.timeoutDelay);

        return xhr;
    }
    /**
     * Creates the native XmlHttpRequest object.
     *
     * @return XMLHttpRequest
     */
    createRawXHR() {
        try {
            return new XMLHttpRequest();
        }
        catch (e) {
            try {
                return new ActiveXObject("Msxml2.XMLHTTP")
            }
            catch (e2) {
                return new ActiveXObject("Microsoft.XMLHTTP")
            }
        }
    }
}
