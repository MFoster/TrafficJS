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

HttpRace and HttpQueue
----------------------
These are two convienence classes to help handle the quirky
workflow of having a collection of requests and something
that requires all of their responses to operate.

The main difference between Race and Queue is that race sends all of the requests at once, so
the responses are not in order, this has the advantage of being overall faster for the entire set.
Queue on the other hand will only send one at a time, and only sends the next if the previous one
was successful.  Neither will fire the complete event if any of the requests in the set fail.

```javascript
var queue = new Traffic.HttpRace();
  
var seeds = [110,109,108,107,106,105,104,102,103,100,101,99,98,96,97,94,95,93,92,91,90,89,88,87,86,85,84,83,82,81];

var collection = new Backbone.Collection();

_.each(seeds, function(id){
  var req = new Traffic.HttpRequest("/info.api");
  req.setData({ id : id });
  queue.add(req);
});
    
queue.start();

queue.on("complete", operate);

function operate(evt){

}
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
Backbone.Model and Backbone.Collection to operate using an BackboneRequest object.

The BackboneRequest class provides an easy translation from backbone's create/remove methods
to the HTTP verbs in typical rest architecture.  

Let's take a look at a few example of how to work Traffic and Backbone such that you can achieve
various techniques of pessimistic and optimistic model additions and changes.

#### Pessimistic Creation with Request
```javascript
var request = new Traffic.HttpRequest("/info.api", "POST");

var form = new Traffic.FormDelegate("#form-container");

form.on("submit", handleSubmit);

request.on("success", handleSuccess);

function handleSuccess(response){
  collection.add(response);
}

function handleSubmit(evt){
  request.send(evt.data);
}
```

This is a more optimistic approach, in which you can add or update the model to the collection
for display before the server has validated the information.

#### Optimistic Update with Request and Model
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

#### Optimistic Creation with Collection
```javascript
var request = new Traffic.BackboneRequest("/info.api");

var collection = new Traffic.Collection([], { request : request });

var form = new Traffic.FormDelegate("#form-container");

form.on("submit", function(evt){
  collection.add(evt.data);
});
```

The request object will appropriately respond to a non 200 response code
and fire the failure event.  Backbone Collection's create method with the "wait"
option will hold off on adding to the collection until the request
has fired it's success event.

#### Pessimistic Creation with Collection
```javascript
var request = new Traffic.BackboneRequest("/info.api");

var collection = new Traffic.Collection([], { request : request });

var form = new Traffic.FormDelegate("#form-container");

form.on("submit", function(evt){
  collection.create(evt.data, { wait : true});
});
```







