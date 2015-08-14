/**
 * waterline-sap-hana-adapter
 *
 * Most of the methods below are optional.
 *
 * If you don't need / can't get to every method, just implement
 * what you have time for.  The other methods will only fail if
 * you try to call them!
 *
 * For many adapters, this file is all you need.  For very complex adapters, you may need more flexiblity.
 * In any case, it's probably a good idea to start with one file and refactor only if necessary.
 * If you do go that route, it's conventional in Node to create a `./lib` directory for your private submodules
 * and load them at the top of the file with other dependencies.  e.g. var update = `require('./lib/update')`;
 */
module.exports = (function () {

	var connections = {};

	var adapter = {

		syncable: false,


		defaults: {},


		registerConnection: function (connection, collections, cb) {

			if (!connection.identity) return cb(new Error('Connection is missing an identity.'));
			if (connections[connection.identity]) return cb(new Error('Connection is already registered.'));

			connections[connection.identity] = connection;

			cb();
		},


		teardown: function (conn, cb) {
			if (typeof conn == 'function') {
				cb = conn;
				conn = null;
			}
			if (!conn) {
				connections = {};
				return cb();
			}
			if (!connections[conn]) return cb();
			delete connections[conn];
			cb();
		},


		describe: function (connection, collection, cb) {
			return cb();
		},

		define: function (connection, collection, definition, cb) {
			return cb();
		},

		drop: function (connection, collection, relations, cb) {
			return cb();
		},

		find: function (connection, collection, options, cb) {
			return cb();
		},

		create: function (connection, collection, values, cb) {
			return cb();
		},

		update: function (connection, collection, options, values, cb) {
			return cb();
		},

		destroy: function (connection, collection, options, cb) {
			return cb();
		}

	};

	return adapter;
})();

