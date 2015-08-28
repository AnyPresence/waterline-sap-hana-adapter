var run = require('./connector').run;
var buildQuery = require('./connector').buildQuery;
var OPERATIONS = require('./connector').OPERATIONS;
var hdb = require('hdb');
var _ = require('lodash');
var database = require('./connector.js');
var client;

/**
 * Creates a database connection agains a SAP HANA instance
 */
function getClient(config){
	var clientConnection = hdb.createClient({
		host : config.host,
		port : config.port,
		user : config.user,
		password : config.password
	});

	clientConnection.on('error', function (err) {
		sails.log.error('Network connection error', err);
	});

	return clientConnection;
}

module.exports = (function () {
	var connections = {};
	var _collections = {};

	var adapter = {
		syncable: false,
		defaults: {},
		registerConnection: function (connection, collections, cb) {
			if (!connection.identity) return cb(new Error('Connection is missing an identity.'));
			if (connections[connection.identity]) return cb(new Error('Connection is already registered.'));
			client = getClient(connection);
			_.keys(collections).forEach(function (key) {
				_collections[key] = collections[key];
			});
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
			var query = buildQuery(OPERATIONS.FIND, collection, null, options);
			return run(query, _collections[collection], client, cb);
		},
		create: function (connection, collection, values, cb) {
			var query = buildQuery(OPERATIONS.INSERT, collection, values, null);
			return run(query, _collections[collection], client, cb);
		},
		update: function (connection, collection, options, values, cb) {
			var query = buildQuery(OPERATIONS.UPDATE, collection, values, options);
			return run(query, _collections[collection], client, cb);
		},
		destroy: function (connection, collection, options, cb) {
			var query = buildQuery(OPERATIONS.DELETE, collection, null, options);
			return run(query, _collections[collection], client, cb);
		}
	};

	return adapter;
})();
