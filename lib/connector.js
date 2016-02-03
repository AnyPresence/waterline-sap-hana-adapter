var sql = require('squel');

/**
 * @type {Object} Database operations
 */
const OPERATIONS = Object.freeze({INSERT: 1, FIND: 2, DELETE: 3, UPDATE: 4, DEFINE: 5, ALTER: 6});

/**
 * Executes the given query using the given SAP HANA client, in order to obtain instances of the given model
 * @param client the client connection
 * @param query the query to be executed
 * @param model the model
 * @param cb the callback function
 */
function run(query, model, client, cb){
	client.exec(query, function (err, results) {
		if (err) return cb(err, null);
		var waterlineResults = [];
		if(results && results.length > 0 && model._model){
			results.forEach(function(result){
				waterlineResults.push(new model._model(result, {}));
			});
			return cb(null, waterlineResults);
		} else {
			if(results > 0){
				return cb(null, waterlineResults)
			} else {
				return cb(new Error('Not Found'), waterlineResults);
			}
		}
	});
}

/**
 * Given an operation, a table name, an entity object and an an options object (if required)
 * this functions attempts to build a SAP HANA SQL statement
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
	 * SAP HANA requires invocation of specific function to correctly format values.
	 * In case of dates, TO_DATE function needs to be invoked. In order to
	 * support function call from SQL, we will need to wrap provided date value in a SAP HANAS's TO_DATE function call
	 * @param value the date value
	 * @returns {*}
	 * @private
	 */
	var _transformNonSupportedTypeToString = function(value){
		var _isDate = function(value){
			return value && typeof value === "object" && value.setUTCMilliseconds;
		};

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
				mappedAttribute += columnName + " INTEGER(5) ";
				break;
			default:
				mappedAttribute += columnName + " VARCHAR(256) ";
				break;
		}
		if(isPK) mappedAttribute += " PRIMARY KEY";

		return mappedAttribute;
	};

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
	};

	/* Data definition language is out of scope of squel library, so we will need to handle this case apart */
	var _alterTableQuery = function(table) {
		var query = "";
		Object.keys(table.def).forEach(function (col) {
			var alterQuery = "ALTER TABLE " + table.name + " ADD ( " + _mapColumnType(table, col) + " ) ";
			query += alterQuery;
		});

		return query;
	};

	switch (operation) {
		case OPERATIONS.INSERT:
			query = sql.insert().into(table);
			break;
		case OPERATIONS.FIND:
			query = sql.select().from(table);
			break;
		case OPERATIONS.DELETE:
			query = sql.delete().from(table);
			break;
		case OPERATIONS.UPDATE:
			query = sql.update().table(table);
			break;
		case OPERATIONS.DEFINE:
			query = _createTableQuery(table);
			break;
		case OPERATIONS.ALTER:
			query = _alterTableQuery(table);
			break;
	}

	if (entity && operation != OPERATIONS.DELETE) {
		Object.keys(entity).forEach(function (fieldName) {
			query.set(fieldName, _transformNonSupportedTypeToString(entity[fieldName]));
		});
	}

	if (options && options.where) {
		var where = "WHERE (1=1) ";
		opts = options.where;
		Object.keys(options.where).forEach(function (key) {
			where += " and " + key + " ='" + opts[key] + "' ";
		});
		query += " "+where;
	}

	if (opts.limit) {
		query += ' LIMIT ' + opts.limit;
		if(opts.skip) query += ' OFFSET ' + opts.skip;
	}

	return query.toString().split("'TO_DATE").join("TO_DATE").split("')'").join("')");
}


/**
 * Public Interface
 * @type {
 *          {
 *            run: run,
 *            buildQuery: buildQuery,
 *            OPERATIONS: Object
 *          }
 *       }
 */
module.exports = {
	run: run,
	buildQuery: buildQuery,
	OPERATIONS: OPERATIONS
};
