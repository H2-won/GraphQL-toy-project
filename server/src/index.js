import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import resolvers from './resolvers/index.js';
import schema from './schema/index.js';
import { readDB } from './dbController.js';

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  context: {
    db: {
      messages: readDB('messages'),
      users: readDB('users'),
    },
  },
  introspection: true,
  playground: true,
});

const app = express();
await server.start();
server.applyMiddleware({
  app,
  path: '/graphql',
  cors: {
    origin: ['http://localhost:3000', 'https://studio.apollographql.com'], // playground 설정을 위해 cross origin 추가
    credentials: true,
  },
});

await app.listen({ port: 8000 });
console.log('server listening on 8000 ...');
