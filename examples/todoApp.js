/**
 * @constructor
 */
var todoApp = function(){
	
}

/**
 * @type {eventdb} instance of eventdb
 */
todoApp.prototype.eventdb = null;

todoApp.prototype.init = function() {
	var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;

	if('webkitIndexedDB' in window) {
		window.IDBTransaction = window.webkitIDBTransaction;
		window.IDBKeyRange = window.webkitIDBKeyRange;
	}
	var THIS = this;
	this.eventdb = new eventdb(indexedDB);
	this.eventdb.open(function(e){
		console.log("opened");
		THIS.eventdb.getAllEvents(function(e){
			THIS.addTodo(e.when);
		});
	});
};

todoApp.prototype.addButton = function() {
	var event = new eventdb.event();
	var item = document.getElementById('item');
	var THIS = this;
	event.what = item.value;
	this.eventdb.addEvent(event, function(e){
		THIS.addTodo(item.value);
	}, this.eventdb.onerror);
};

todoApp.prototype.addTodo = function(item){
	var items = document.getElementById('todoItems');
	items.innerHTML += '<li>' + item + '</li>';
	document.getElementById('item').value = '';
};
