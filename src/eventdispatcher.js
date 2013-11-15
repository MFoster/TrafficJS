define(["./base"], function(BaseClass){

	/**
	 * Creates a separate reference
	 *
	 */
	var EventDispatcher = BaseClass.extend({});

	_.extend(EventDispatcher.prototype, Backbone.Events);

	return EventDispatcher;

});