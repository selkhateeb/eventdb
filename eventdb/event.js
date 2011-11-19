
/**
 * @constructor event
 */
eventdb.event = function() {
	this.when = new Date().getTime();
};

/**
 * @type {number} timestamp when the event happened
 */
eventdb.event.when = null;

/**
 * @type {*} who did this event
 * example: user name, user object, id , etc ...
 */
eventdb.event.who = null;

/**
 * @type {Object} what happend 
 * example:
 * 		this is what an object looks like when we try to change
 * 		the value of a todo item from 'hmm' to 'drink water'
 * 		{  
 * 			store: 'todos',
 * 			property: 'text',
 *          operation: 'put',
 * 			key: 1243421432,
 * 			changed_from: 'hmm',
 * 			changed_to: 'drink water'
 * 		}
 */
eventdb.event.what = null;

/**
 * @type {*} where did the event take place
 * examples: 
 * 		mobile, browser, url, etc ...
 */
eventdb.event.where = null;//url, browser, mobile

/**
 * @type {*} how did it happen
 * examples:
 * 		- user clicked button/link
 *		- user hit key
 * 		- backend process
 * 		- etc..
 */
eventdb.event.how = null;
