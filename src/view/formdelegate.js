define(["backbone"], function(Backbone){

	return Backbone.View.extend({
		expand : false,
		events : {
			"submit" : "handleSubmit"
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

});