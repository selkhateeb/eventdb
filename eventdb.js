/**
 * @param {window.indexedDB} indexedDB HTML5 indexedDB implementation object
 * @constructor eventdb
 */
var eventdb = function(indexedDB) {
	eventdb.indexedDB = indexedDB;
};

/**
 * @type {string} name of database
 * NOTE: for some reason if DBNAME = 'eventdb' nothing works! 
 * 		 (tested on chrome only)
 */
eventdb.DBNAME = 'edb';

/**
 * @type {number} version of database automatically adjusted 
 * TODO: not sure if indexedDB version allows for number type but works on
 * 		 chrome for now
 */
eventdb.DBVERSION = 0.0;

/**
 * @type {string} object store name that holds 'eventdb.event' data
 */
eventdb.OBJECT_STORE_NAME = 'event';

/**
 * @type {window.IDBDatabase} holds the database instance once opened
 */
eventdb.prototype.db = null;

/**
 * general error handler
 * @param {Object} e event
 */
eventdb.prototype.onerror = function(e) {
	console.log("global error:", e);
};

/**
 * opens the eventdb and inits the object store
 * @param {function} onsuccess success callback 
 */
eventdb.prototype.open = function(onsuccess) {
	var request = eventdb.indexedDB.open(eventdb.DBNAME);
	var THIS = this;
	request.onsuccess = function(e) {
		THIS.db = e.target.result;
		var db = THIS.db;
		// We can only create Object stores in a setVersion transaction;
		if(eventdb.DBVERSION !== db.version) {
			THIS.createObjectStore_(eventdb.OBJECT_STORE_NAME, {keyPath: "when"}, onsuccess);
		} else {
			onsuccess();
		}
	};
	request.onerror = this.onerror;
};

/**
 * creates the named object store
 * @param {string} name name of object store to be created
 * @param {object} options object store options
 * @param {function} callback called when object store created successfully
 * @private
 */
eventdb.prototype.createObjectStore_ = function(name, options, callback){
	var THIS = this;
	eventdb.DBVERSION += 0.1;
	var setVrequest = this.db.setVersion(eventdb.DBVERSION);
	
	// onsuccess is the only place we can create Object Stores
	setVrequest.onerror = this.onerror;
	setVrequest.onsuccess = function(e) {
		if(THIS.db.objectStoreNames.contains(name)) {
//			THIS.db.deleteObjectStore(name);
			callback();
			return;
		}

		var store = THIS.db.createObjectStore(name, options);
		callback();
	};
};

/**
 * deletes the eventdb databese
 */
eventdb.prototype.deletedb = function() {
	if(!eventdb.indexedDB.deleteDatabase){
		console.warn("indexedDB.deleteDatebase not supported yet");
		return;
	}
	var dbreq = eventdb.indexedDB.deleteDatabase(eventdb.DBNAME);
	dbreq.onsuccess = function(e) {
		console.log("success", e);
	}
	dbreq.onerror = function(e) {
		console.log("error", e);
	}
};


/**
 * adds an event to object store
 * @param {eventdb.event} event event object
 * @param {function} onsuccess success callback
 * @param {function} onerror error callback
 */
eventdb.prototype.addEvent = function(event, onsuccess, onerror) {
	var db = this.db;
	var trans = db.transaction([eventdb.OBJECT_STORE_NAME], IDBTransaction.READ_WRITE);
	var store = trans.objectStore(eventdb.OBJECT_STORE_NAME);

	var request = store.put(event);
	var THIS = this;

	request.onsuccess = onsuccess;
	request.onerror = onerror;
};

/**
 * deletes the event by id
 * @param {string|number} id event id/key
 */
eventdb.prototype.deleteEvent = function(id) {
	var db = this.db;
	var trans = db.transaction([eventdb.OBJECT_STORE_NAME], IDBTransaction.READ_WRITE);
	var store = trans.objectStore(eventdb.OBJECT_STORE_NAME);

	var request = store.delete(id);
	var THIS = this;
	request.onsuccess = function(e) {
		THIS.getAllEvents();
	};
	request.onerror = function(e) {
		console.log("Error Deleting: ", e);
	};
};

/**
 * gets all events from database
 * @param {function} onevent fires on every result record
 */
eventdb.prototype.getAllEvents = function(onevent) {
	var db = this.db;
	var trans = db.transaction([eventdb.OBJECT_STORE_NAME], IDBTransaction.READ_WRITE);
	var store = trans.objectStore(eventdb.OBJECT_STORE_NAME);

	// Get everything in the store;
	var keyRange = IDBKeyRange.lowerBound(0);
	var cursorRequest = store.openCursor(keyRange);

	cursorRequest.onsuccess = function(e) {
		var result = e.target.result;
		if(!!result == false)
			return;

		onevent(result.value);
		result.continue();
	};
	cursorRequest.onerror = this.onerror;
};

/**
 * gets all objects from database
 * @param {string} storeName the name of the store to get all data 
 * @param {function} onrecord fires on every result record
 */
eventdb.prototype.getAll = function(storeName, onrecord) {
	var trans = this.db.transaction([storeName], IDBTransaction.READ_ONLY);
	var store = trans.objectStore(storeName);

	// Get everything in the store;
	var keyRange = IDBKeyRange.lowerBound(0);
	var cursorRequest = store.openCursor(keyRange);

	cursorRequest.onsuccess = function(e) {
		var result = e.target.result;
		if(!result)
			return;

		onrecord(result.value);
		result.continue();
	};
	cursorRequest.onerror = this.onerror;
};

/**
 * applys local changes
 */
eventdb.prototype.apply = function(){
  var self = this;
  this.getAllEvents(function(e){
  		self.applyInternal_(e);
  	});
};

/**
 * applys local changes
 * @param {eventdb.event} event event record
 * @private
 */
eventdb.prototype.applyInternal_ = function(event){
	if(event.what.operation === 'put'){
		this.handlePutOperation_(event.what.store, event.what.changed_to);
	}
	this.deleteEvent(event.when);
};

eventdb.prototype.handlePutOperation_ = function(store_name, object){
	console.log("store name", store_name);
	var self = this;
	if(!this.db.objectStoreNames.contains(store_name)){
		this.createObjectStore_(store_name, {autoIncrement: true, keyPath: 'id'}, function(){
			self.handlePutOperation_(store_name, object);
		});
		return;
	}
	var trans = this.db.transaction([store_name], IDBTransaction.READ_WRITE);
	console.log(trans);
	var store = trans.objectStore(store_name);

	var request = store.put(object);

	request.onsuccess = function(e){
		console.log('handleputSuccess', e);
	};
	request.onerror = function(e){
		console.log('handleputError', e);
	};

};

