/**
 * Used for testing XHR interactions
 */
define(["../eventdispatcher", "underscore"], function(EventDispatcher, _){

	return EventDispatcher.extend({
		readyState : 0,

		cadence : 10,

		url : false,

		method : false,

		async : true,

		status : 200,

		responseText : '',

		open : function(url, method, async){
			this.url = url;
			this.method = method;
			this.async = async;
		},
		abort : function(){

		},

		setRequestHeader : function(key, value){

		},
		send : function(payload){
			var pace = 0;
			var handle = _.bind(this.handleStateChange, this);
			for(var i = 0, len = 4; i < len; i++){
				setTimeout(handle, pace += this.cadence);
			}
		},
		handleStateChange : function(){
			this.readyState++;
			this.trigger("change", this);
		}
		
	});
});