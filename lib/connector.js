var sql = require('squel');
var hdb = require('hdb');
var connection = connect();


const OPERATIONS = Object.freeze({INSERT: 1, FIND: 2, DELETE: 3, UPDATE: 4, DEFINE: 5, ALTER: 6});


/**
 * Creates a database connection agains a SAP HANA instance
 */
function connect(config){
	connection = hdb.createClient({
		host : config.host,
		port : config.port,
		user : config.username,
		password : config.password
	});

	connection.on('error', function (err) {
		sails.log.error('Network connection error', err);
	});
}

/**
 * @param database the database connection
 * @param query the query to be executed
 * @param model the model
 * @param cb the callback function
 */
function run(database, query, model, cb){
	query = 'select * from DUMMY';
	connection.connect(function (err) {
		if (err) return cb(err, null);
		connection.exec(query, function (err, results) {
			if (err) return cb(err, null);
			var waterlineResults = [];
			results.forEach(function(result){
				waterlineResults.push(new model._model(result, {}));
			});


			return cb(null, waterlineResults);
		});
	});
}

/**
 * Given an operation, a table name, an entity object and an an options object (if required)
 * this functions attempts to build an ANSI SQL statement
 * @param operation the required operation (INSERT, FIND, DELETE, UPDATE)
 * @param table The table object
 * @param entity the entity object (In example: in INSERT, the entity to be added)
 * @param options (an options object, containing additional query information)
 * @returns {*}
 */
function buildQuery(operation, table, entity, options) {
	var query;
	var opts = options || {};

	/**
	 * Oracle requires invocation of specific function to correctly format values.
	 * In case of dates, TO_DATE function needs to be invoked. In order to
	 * support function call from SQL, we will need to wrap provided date value in a Oracle's TO_DATE function call
	 * @param value the date value
	 * @returns {*}
	 * @private
	 */
	var _transformNonSupportedTypeToString = function(value){
		var _isDate = function(value){
			return value && typeof value === "object" && value.setUTCMilliseconds;
		};

		//TODO: Maybe designer would provide date format somewhere?
		if (_isDate(value)) return "TO_DATE('" + value.toISOString().slice(0,10) + " " + value.toISOString().slice(11, 19) + "', 'yyyy-mm-dd hh24:mi:ss')";
		return value;
	};

	var _mapColumnType = function(table, columnName){
		var columnType = table.def[columnName].type;
		var isPK = table.def[columnName].primaryKey;

		var mappedAttribute = "";

		switch(columnType){
			case "date":
				mappedAttribute += columnName + " DATE ";
				break;
			case "datetime":
				mappedAttribute += columnName + " TIMESTAMP ";
				break;
			case "integer":
				mappedAttribute += columnName + " NUMBER(5) ";
				break;
			default:
				mappedAttribute += columnName + " VARCHAR2(256) ";
				break;
		}
		if(isPK) mappedAttribute += " PRIMARY KEY";

		return mappedAttribute;
	}

	/* Data definition language is out of scope of squel library, so we will need to handle this case apart */
	var _createTableQuery = function(table){
		var columns = " ( ";
		Object.keys(table.def).forEach(function(col) {
			columns += _mapColumnType(table, col);
			columns += ",";
		});
		columns = columns.substring(0, columns.length - 1); //Removes trailing comma
		columns += " ) ";
		var createQuery = "CREATE TABLE " + table.name + columns;
		return createQuery;
	}

	/* Data definition language is out of scope of squel library, so we will need to handle this case apart */
	var _alterTableQuery = function(table) {
		var query = "";
		Object.keys(table.def).forEach(function (col) {
			var alterQuery = "ALTER TABLE " + table.name + " ADD ( " + _mapColumnType(table, col) + " ) ";
			query += alterQuery;
		});

		return query;
	}

	switch (operation) {
		case 1:
			query = sql.insert().into(table);
			break;
		case 2:
			if (opts.limit || opts.skip) {
				//return _createOracleSpecificQuery(table, opts.skip, opts.limit, options.where);
			} else {
				query = sql.select().from(table);
			}
			break;
		case 3:
			query = sql.delete().from(table);
			break;
		case 4:
			query = sql.update().table(table);
			break;
		case 5:
			query = _createTableQuery(table);
			break;
		case 6:
			query = _alterTableQuery(table);
			break;
	}

	if (entity && operation != 3) {
		Object.keys(entity).forEach(function (fieldName) {
			query.set(fieldName, _transformNonSupportedTypeToString(entity[fieldName]));
		});
	}

	if (options && options.where) {
		var where = "(1=1) ";
		var opts = options.where;
		Object.keys(options.where).forEach(function (key) {
			where += "and " + key + " ='" + opts[key] + "' ";
		});
		query.where(where);
	}

	return query.toString().split("'TO_DATE").join("TO_DATE").split("')'").join("')");
}


/**
 * Public Interface
 * @type {{simpleExecute: simpleExecute, releaseConnection: releaseConnection, execute: execute, getConnection: getConnection, addTeardownSql: addTeardownSql, addBuildupSql: addBuildupSql, getPool: getPool, terminatePool: terminatePool, createPool: createPool, OBJECT: *, execute: execute, buildQuery: buildQuery, OPERATIONS: OPERATIONS}}
 */
module.exports = {
	run: run,
	buildQuery: buildQuery,
	OPERATIONS: OPERATIONS,
	connection: connection
};
