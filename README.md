![http://cdn2.hubspot.net/hub/127273/file-2303064436-png/Blog_pictures/sap-hana.png](http://cdn2.hubspot.net/hub/127273/file-2303064436-png/Blog_pictures/sap-hana.png)

# Waterline SAP HANA adapter

Provides easy access to SAP HANA database from Sails.js & Waterline.

This module is a Waterline/Sails adapter, an early implementation of a rapidly-developing, tool-agnostic data standard.  Its goal is to provide a set of declarative interfaces, conventions, and best-practices for integrating with all sorts of data sources.  Not just databases-- external APIs, proprietary web services, or even hardware.

Strict adherence to an adapter specification enables the (re)use of built-in generic test suites, standardized documentation, reasonable expectations around the API for your users, and overall, a more pleasant development experience for everyone.


### Installation

To install this adapter, run:

```sh
$ npm install waterline-sap-hana-adapter
```

In config/connections.js, you should use a configuration object like this:

 storage_adapter: {
    adapter: 'waterline-sap-hana-adapter',                                                                        
    host: "locahost",
    user: "user",
    password: "password",
    port: "port"
  }


### Running the tests

Configure the interfaces you plan to support (and targeted version of Sails/Waterline) in the adapter's `package.json` file:

```javascript
{
  //...
  "sails": {
  	"adapter": {
	    "sailsVersion": "~0.10.0",
	    "implements": [
	      "semantic",
	      "queryable"
	    ]
	  }
  }
}
```

In your adapter's directory, run:

```sh
$ npm test
```


### License

AnyPresence License
