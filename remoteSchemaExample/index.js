import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { HttpLink } from "apollo-link-http";
import gql from 'graphql-tag';
import fetch from 'node-fetch';

const { ApolloServer } = require('apollo-server');

const typeDefs = gql`

  type ImprovedData {
    id: String
    agency: String
    newCustomField: String
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    betterData: ImprovedData
  }
`;

function collectBetterData() {
  const data = client.query({
    query: gql`
      query MyQuery {
        storage_viewz(limit: 1) {
          id
          agency
        }
      }
    `,
  })
.then(result => {
  console.log(result.data.storage_viewz[0].id)
    return {
      id: result.data.storage_viewz[0].id,
      agency: result.data.storage_viewz[0].agency,
      newCustomField: "custom1"
    }
  });
return data;
}

const resolvers = {
  Query: {
    betterData: () => collectBetterData(),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

// The `listen` method launches a web server.
server.listen({ port: process.env.PORT || 4000} ).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});


const cache = new InMemoryCache();
const link = new HttpLink({
  uri: "http://172.17.0.1:7654/v1/graphql",
  fetch: fetch
});

const client = new ApolloClient({
  cache,
  link,
});

client
.query({
  query: gql`
    query MyQuery {
      storage_viewz {
        id
        agency
      }
    }
  `
})
// .then(result => console.log(result));

