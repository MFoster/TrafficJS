/**
 * Serializes to typical query string but if nested, will resort to php nested notation
 * Deserializes JSON, coming back from the server.
 * This is a handy class as you can send the server serialization it typically deals with
 * and then respond to the client with JSON.
 *
 */
 define(["src/serializer/json"], function(JsonSerializer){
  return JsonSerializer.extend({
 
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
});