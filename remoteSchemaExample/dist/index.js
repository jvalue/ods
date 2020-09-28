"use strict";

var _apolloClient = require("apollo-client");

var _apolloCacheInmemory = require("apollo-cache-inmemory");

var _apolloLinkHttp = require("apollo-link-http");

var _graphqlTag = _interopRequireDefault(require("graphql-tag"));

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _templateObject3() {
  var data = _taggedTemplateLiteral(["\n    query MyQuery {\n      ", " {\n        id\n        agency\n      }\n    }\n  "]);

  _templateObject3 = function _templateObject3() {
    return data;
  };

  return data;
}

function _templateObject2() {
  var data = _taggedTemplateLiteral(["\n      query MyQuery {\n        ", "(limit: 1) {\n          id\n          agency\n        }\n      }\n    "]);

  _templateObject2 = function _templateObject2() {
    return data;
  };

  return data;
}

function _templateObject() {
  var data = _taggedTemplateLiteral(["\n\n  # Example enriched data type\n  type ImprovedData {\n    id: String\n    agency: String\n    newCustomField: String\n  }\n\n  # Example Query type\n  type Query {\n    betterData: ImprovedData\n  }\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var _require = require('apollo-server'),
    ApolloServer = _require.ApolloServer; // defines the different new types of the server.
// These types will be added to the schema.


var typeDefs = (0, _graphqlTag["default"])(_templateObject()); // example function that firstly collects data from the server and then
// enriches the data with custom business logic

var API_NAME = "storage_publicapi5";

function collectBetterData() {
  var data = client.query({
    query: (0, _graphqlTag["default"])(_templateObject2(), API_NAME)
  }).then(function (result) {
    console.log(result['data'][API_NAME][0].id);
    return {
      // ...,
      id: result['data'][API_NAME][0].id,
      agency: result['data'][API_NAME][0].agency,
      newCustomField: "custom1"
    };
  });
  return data;
} // mapping of how the example type betterData is being resolved


var resolvers = {
  Query: {
    betterData: function betterData() {
      return collectBetterData();
    }
  }
}; // creates new server utilising the Apollo library

var server = new ApolloServer({
  typeDefs: typeDefs,
  resolvers: resolvers
}); // The `listen` method launches a web server.

server.listen({
  port: process.env.PORT || 4000
}).then(function (_ref) {
  var url = _ref.url;
  console.log("\uD83D\uDE80  Server ready at ".concat(url));
});
var cache = new _apolloCacheInmemory.InMemoryCache();
var link = new _apolloLinkHttp.HttpLink({
  uri: "http://172.17.0.1:7654/v1/graphql",
  fetch: _nodeFetch["default"]
}); //initialies a new client.
// this client can be used to fetch data froma  graph ql server endpoint

var client = new _apolloClient.ApolloClient({
  cache: cache,
  link: link
});
client.query({
  query: (0, _graphqlTag["default"])(_templateObject3(), API_NAME)
});