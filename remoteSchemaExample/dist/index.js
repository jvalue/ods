"use strict";

var _apolloClient = require("apollo-client");

var _apolloCacheInmemory = require("apollo-cache-inmemory");

var _apolloLinkHttp = require("apollo-link-http");

var _graphqlTag = _interopRequireDefault(require("graphql-tag"));

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _templateObject3() {
  var data = _taggedTemplateLiteral(["\n    query MyQuery {\n      storage_viewz {\n        id\n        agency\n      }\n    }\n  "]);

  _templateObject3 = function _templateObject3() {
    return data;
  };

  return data;
}

function _templateObject2() {
  var data = _taggedTemplateLiteral(["\n      query MyQuery {\n        storage_viewz(limit: 1) {\n          id\n          agency\n        }\n      }\n    "]);

  _templateObject2 = function _templateObject2() {
    return data;
  };

  return data;
}

function _templateObject() {
  var data = _taggedTemplateLiteral(["\n\n  type ImprovedData {\n    id: String\n    agency: String\n    newCustomField: String\n  }\n\n  # The \"Query\" type is special: it lists all of the available queries that\n  # clients can execute, along with the return type for each. In this\n  # case, the \"books\" query returns an array of zero or more Books (defined above).\n  type Query {\n    betterData: ImprovedData\n  }\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var _require = require('apollo-server'),
    ApolloServer = _require.ApolloServer;

var typeDefs = (0, _graphqlTag["default"])(_templateObject());

function collectBetterData() {
  var data = client.query({
    query: (0, _graphqlTag["default"])(_templateObject2())
  }).then(function (result) {
    console.log(result.data.storage_viewz[0].id);
    return {
      id: result.data.storage_viewz[0].id,
      agency: result.data.storage_viewz[0].agency,
      newCustomField: "custom1"
    };
  });
  return data;
}

var resolvers = {
  Query: {
    betterData: function betterData() {
      return collectBetterData();
    }
  }
};
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
});
var client = new _apolloClient.ApolloClient({
  cache: cache,
  link: link
});
client.query({
  query: (0, _graphqlTag["default"])(_templateObject3())
}); // .then(result => console.log(result));