define(["src/connection/http", "src/connection/xhr"], function(HttpRequest, XHR){
	return HttpRequest.extend({
		createRawXHR : function(){
			var xhr = new XHR();
			xhr.on("change", this.handleStateChange.bind(this));
			xhr.responseText = this.responseText;
			return xhr;
		},
		setResponse : function(data){
			this.responseText = this.serializer.serialize(data);
		}
	});
});