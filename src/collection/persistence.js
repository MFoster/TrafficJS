define(["./base"], function(BaseCollection){

  return BaseCollection.extend({
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
});