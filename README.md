# Traffic JS

## Ajax Communication Library

Traffic JS provides an object oriented and class structure approach to dealing with 
Ajax communications.

Many libraries implement an ajax request with a function based approach.  
Meaning you send a request, attach the callbacks in the call itself, usually as
success or failure options and they are called once that request returns.

This poses a problem when multiple components need to listen to these events. 
To accommodate you end up stashing callbacks and chaining them along.

Traffic allows you to reuse requests, many components can attach
listeners to the request's life cycle and respond accordingly.  




HttpRequest class example
-------------------------

#### Basic 

```javascript
function handleSuccess(response, request){ 
  //... 
}

var request = new Traffic.HttpRequest("/info.api");

request.on("success", handleSuccess);

request.send();

```

#### Post Request and sending some data

```javascript
var request = new Traffic.HttpRequest("/info.api", "POST");

request.once("success", handleSuccess);

request.send({ "id" : 123, "title" : "New York Man Buys Pizza" });
```

#### Shorthand event binding

To accomodate for more natural language syntax and event binding, 
there are the "then" and "otherwise" functions.  These will attach a
success and failure callback via the "once" method.
```javascript
var request = new Traffic.HttpRequest("/info.api");

request.send().then(handleSuccess).otherwise(handlefailure);
```

Serializers
-----------

Traffic has delegated request data seriailization to it's own set of classes completely.
The request has a reference to data and a reference to a serializer.  Upon sending the request
it sends it's data to the serializer before posting the request.  There are 3 packaged serializers
with Traffic JS but it'd be easy to extend or create your own.


```javascript
var CustomSerializer = Traffic.Serializer.extend({});

var serial = new CustomSerializer();

var request = new Traffic.HttpRequest("/info.api", "POST");

request.setSerializer("plain");
request.setSerializer("json");
request.setSerializer("php");
request.setSerializer(serial);
```

FormDelegate
------------

Form delegate handles the data extractions from a form and supresses the native submit event
but fires a submit of it's own for your Javascript architecture to handle.  This allows you to 
easily "Hijax" a form and perform custom operations on a form submit event.

The data extraction is fairly sophisticated and will stack naming collisions and appropriately
detect values based on the input type.

```javascript
var form = new Traffic.FormDelegate("#form-container");
var request = new Traffic.HttpRequest("/info.api");

form.on("submit", handleSubmit);

function handleSubmit(evt){
  request.send(evt.data);
}
```

Backbone Integration
--------------------

Traffic JS is heavily integrated with Backbone and extends both 
Backbone.Model and Backbone.Collection to operate using an HttpRequest object.
This also provides an easy way to perform pessimistic or optimistic model loading.

#### Pessimistic 
```javascript
var request = new Traffic.HttpRequest("/info.api", "POST");

function handleSuccess(response){
  collection.add(response);
}

request.on("success", handleSuccess);

request.send(info);
```

BackboneRequest
---------------

There is a subclass for smoother use with a Backbone Model.  The major feature
is the setMethod function which maps the backbone methods, such as create and remove
to HTTP Methods such as POST and DELETE.

This is a more optimistic approach, in which you can add or update the model to the collection
for display before the server has validated the information.

```javascript
var request = new Traffic.BackboneRequest("/info.api");

var form = new Traffic.FormDelegate("#form-container");

var model = new Traffic.Model({
  request : request
});

form.on("submit", function(evt){
  
  model.set(evt.data);
  
})
```








