var run = require('./connector').run;
var buildQuery = require('./connector').buildQuery;
var OPERATIONS = require('./connector').OPERATIONS;
var _ = require('lodash');
var database = require('./connector.js');

module.exports = (function () {
	var connections = {};
	var _collections = {};

	var adapter = {
		syncable: false,
		defaults: {},
		registerConnection: function (connection, collections, cb) {

			console.log("TTTregisterConnection");
			var _augmentConnectionWithOracleSpecificDate = function (connection) {
				connections[connection.identity].connectString = connection.host + ":" + connection.port + "/" + connection.database;
				connections[connection.identity].user = connection.username;
			};

			if (!connection.identity) return cb(new Error('Connection is missing an identity.'));
			if (connections[connection.identity]) return cb(new Error('Connection is already registered.'));

			_.keys(collections).forEach(function (key) {
				_collections[key] = collections[key];
			});

			connections[connection.identity] = connection;

			console.log("TTTfineshedRegistering");
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
			database.connection.end();
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
			return run(database, buildQuery(OPERATIONS.FIND, collection, null, options), _collections[collection], cb);
		},
		create: function (connection, collection, values, cb) {
			return run(database, buildQuery(OPERATIONS.INSERT, collection, values, null), _collections[collection], cb);
		},
		update: function (connection, collection, options, values, cb) {
			return run(database, buildQuery(OPERATIONS.UPDATE, collection, values, options), _collections[collection], cb);
		},
		destroy: function (connection, collection, options, cb) {
			return run(database, buildQuery(OPERATIONS.DELETE, collection, null, options), _collections[collection], cb);
		}
	};

	return adapter;
})();
