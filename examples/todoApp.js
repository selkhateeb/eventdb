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
	this.eventdb.open(function(){
		// console.log("opened");
		THIS.eventdb.getAll('todo', function(e){
			THIS.addTodo(e.item);
		});
	});
};

todoApp.prototype.addButton = function() {
	var event = new eventdb.event();
	var item = document.getElementById('item');
	var THIS = this;
	event.what = {
		store: 'todo',
		operation: 'put',
		changed_from: null,
		changed_to: {item: item.value},
		};
	event.where = {
		url: window.location.href,
		elementId: 'item'
	};
	event.how = {
		browser_event: 'onclick',
		src_element: 'button'
	};
	
	event.who = 'selkhateeb';
	
	
	this.eventdb.addEvent(event, function(e){
		THIS.addTodo(item.value);
	}, this.eventdb.onerror);
	
	this.eventdb.apply();
};

todoApp.prototype.addTodo = function(item){
	var items = document.getElementById('todoItems');
	items.innerHTML += '<li>' + item + '</li>';
	document.getElementById('item').value = '';
};
