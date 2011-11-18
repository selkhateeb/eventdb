/**
 * @constructor
 */
var eventdb = function(indexedDB) {
	eventdb.indexedDB = indexedDB;
};

/**
 * name of database
 */
eventdb.DBNAME = 'edb';

/**
 * version of database
 */
eventdb.DBVERSION = 0.0;

eventdb.OBJECT_STORE_NAME = 'event';

eventdb.prototype.db = null;

eventdb.prototype.onerror = function(e) {
	console.log("global error:", e);
};

eventdb.prototype.open = function(onsuccess) {
	var request = eventdb.indexedDB.open(eventdb.DBNAME);
	var THIS = this;
	request.onsuccess = function(e) {
		console.log(e);
		THIS.db = e.target.result;
		var db = THIS.db;
		// We can only create Object stores in a setVersion transaction;
		if(eventdb.DBVERSION !== db.version) {
			THIS.createObjectStore(eventdb.OBJECT_STORE_NAME, {keyPath: "when"}, onsuccess);
		} else {
			THIS.getAllEvents();
		}
		console.log("request success", e);
	};
	request.onerror = this.onerror;
};
eventdb.prototype.createObjectStore = function(name, options, callback){
	console.debug("createOS");
	var THIS = this;
	eventdb.DBVERSION += 0.1;
	var setVrequest = this.db.setVersion(eventdb.DBVERSION);
	console.log(setVrequest);
	
	// onsuccess is the only place we can create Object Stores
	setVrequest.onerror = this.onerror;
	setVrequest.onsuccess = function(e) {
		console.log(e);
		if(THIS.db.objectStoreNames.contains(name)) {
//			THIS.db.deleteObjectStore(name);
			return;
		}

		var store = THIS.db.createObjectStore(name, options);
		callback();
	};
};
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

eventdb.prototype.addEvent = function(event, onsuccess, onerror) {
	var db = this.db;
	var trans = db.transaction([eventdb.OBJECT_STORE_NAME], IDBTransaction.READ_WRITE);
	var store = trans.objectStore(eventdb.OBJECT_STORE_NAME);

	var request = store.put(event);
	var THIS = this;

	request.onsuccess = onsuccess;
	request.onerror = onerror;
};

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

		console.log(result.value);
		onevent(result.value);
		result.continue();
	};
	cursorRequest.onerror = this.onerror;
};

eventdb.prototype.getAll = function(storeName, onrecord) {
	var trans = this.db.transaction([storeName], IDBTransaction.READ_ONLY);
	var store = trans.objectStore(storeName);

	// Get everything in the store;
	var keyRange = IDBKeyRange.lowerBound(0);
	var cursorRequest = store.openCursor(keyRange);

	cursorRequest.onsuccess = function(e) {
		var result = e.target.result;
		if(!!result == false)
			return;

		console.log(result.value);
		onrecord(result.value);
		result.continue();
	};
	cursorRequest.onerror = this.onerror;
};


/**
 * @constructor event
 */
eventdb.event = function() {
	this.when = new Date().getTime();
};

eventdb.event.when = null;
eventdb.event.who = null;
eventdb.event.what = null;//action, changed_from, changed_to
eventdb.event.where = null;//url, browser, mobile
eventdb.event.how = null;//how it happened? user clicked

var edb = null;
function init() {
	var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
	
	if('webkitIndexedDB' in window) {
		window.IDBTransaction = window.webkitIDBTransaction;
		window.IDBKeyRange = window.webkitIDBKeyRange;
	}

	edb = new eventdb(indexedDB);
	edb.open(function(e){
		console.log("opened");
		edb.getAllEvents(function(e){
			console.log('getall');
			addTodo(e.when);
		});
	});
}
window.addEventListener("DOMContentLoaded", init, false);

function addButton(){
	var event = new eventdb.event();
	var item = document.getElementById('item');

	event.what = item.value;
	edb.addEvent(event, function(e){
		addTodo(item.value);
	}, edb.onerror);
};

function addTodo(item){
	var items = document.getElementById('todoItems');
	items.innerHTML += '<li>' + item + '</li>';
	document.getElementById('item').value = '';
};
