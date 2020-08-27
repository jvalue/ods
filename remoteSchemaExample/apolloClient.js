import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { HttpLink } from "apollo-link-http";

const cache = new InMemoryCache();

const link = new HttpLink({
  //change this uri to the endpoint of the grapql server that you want to query
  uri: "http://172.17.0.1:8090/v1/graphql"
});

const client = new ApolloClient({
  cache,
  link
});

export default client
