
/**
 * Creates a separate reference
 *
 */

var eventId = 0;
function getEventID() {
	return eventId++;
}


export class EventDispatcher {
	constructor() {
		this.eventMap = {};
        this.listenMap = {};
        this.evtId = getEventID();
	}

	on(name, cb) {
		this.addEvent(this, name, cb);
	}

	off(name, cb) {
		this.removeEvent(this, name, cb);
	}

	once(name, cb) {
        let me = this;
        let r =  ()=>{
            cb.apply(me, arguments);
            me.off(name, r);
        }

        this.on(name, r);
	}

	listen(obj, name, cb) {
        this.listenMap[obj.evtId] = this.buildListener(obj, name, cb);
        this.addEvent(obj, name, cb);
	}

	stopListening(obj, name, cb) {
        
	}

	listenOnce(obj, name, cb) {
		this.addEvent(obj, name, cb);
	}

	addEvent(obj, name, cb) {
		this.eventMap = (this.eventMap[name] ? this.eventMap[name].push(cb) : this.eventMap[name] = [cb]);
	}

    buildListener(obj, name, cb){
        return { callback: cb, listener: obj, evtName: name};
    }

	removeEvent(obj, name, cb){
		if(!cb){
			obj.eventMap[name] = [];
		} else if(!name){
			obj.eventMap = {};
		} else {
			for(var i = 0, len = obj.eventMap[name]; i < len; i++){
				if(obj.eventMap[name] === cb){
					obj.eventMap[name].slice(i, i+1);
				}
			}
		}
	}

    trigger(name, evt){
        for(var i = 0, len = this.eventMap[name].length; i++){
            this.eventMap[name][i].
        }
    }
}