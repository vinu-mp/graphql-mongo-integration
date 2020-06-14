//ref: https://www.youtube.com/watch?v=MRrcUQhZwBc&list=PL55RiY5tL51rG1x02Yyj93iypUuHYXcB_&index=6
const express = require('express');
const bodyparser = require('body-parser');

//https://cloud.mongodb.com/v2/5ee5ce5dd747e2064fee6756#security/database/users
const mongoose = require('mongoose');

//buildSchema seems to be old which accepts a string which contains a schema key
const {
  buildSchema,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLNonNull,
  GraphQLFloat,
  GraphQLID
} = require('graphql')
// exports a valid middleware to be used along with express
// this parser the incoming requests and forward it to the resolver
const graphqlHttp = require('express-graphql');

const app = express();

app.use(bodyparser.json());

// modals/events exports an Event constructor
const Events = require('./modals/events');

const EventType = new GraphQLObjectType({
  name: "Events",
  description: "This list out the events",
  fields:() => ({
    _id: { type: GraphQLNonNull(GraphQLString) },
    title: { type: GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLNonNull(GraphQLString) },
    date: { type: GraphQLNonNull(GraphQLString) },
    price: { type: GraphQLNonNull(GraphQLFloat) },
  })
})

const rootQuery = new GraphQLObjectType({
  name: 'rootQuery',
  description: 'This handles all the API route name',
  fields: () => ({
    events: {
      type: new GraphQLList(EventType),
      resolve: () => {
        return Events.find()
          .then((results) => {
            const res = results.map(event => {
              return { ...event._doc, _id: event._doc._id.toString()}
            })
            return res;
          })
            .catch(e => {
              console.log('error', e);
              throw e;
            })
      }
    }
  })
})
const rootMutation = new GraphQLObjectType({
  name: 'rootMutation',
  description: 'This handles all the API mutations - CRUD',
  fields: () => ({
    createEvents: {
      type: EventType,
      args: {
        title: { type: GraphQLNonNull(GraphQLString) },
        description: { type: GraphQLNonNull(GraphQLString) },
        price: { type: GraphQLNonNull(GraphQLFloat) },
        date: { type: GraphQLNonNull(GraphQLString) }
      },
      resolve: (parents, args) => {
        // const eventObj = {
        //   _id: Math.random().toString(),
        //   title: args.title,
        //   description: args.description,
        //   date: new Date().toISOString(),
        //   price: args.price,
        // }
        const eventObj = new Events({
          title: args.title,
          description: args.description,
          date: new Date(args.date),
          price: args.price,
        })

       return eventObj
        .save()
        .then(
          (res) => {
            return res
          }
        ).catch((e) => {
          console.log(e);
          throw e;
        })
      }
    }
  })
})
const rootSchema = new GraphQLSchema({
  query: rootQuery,
  mutation: rootMutation
});

// we have only one end point where all requests are send /graphql
// root value contains all the resolver names whose name should match with the endpoint name
// using the old approach-- buildschema is based on SDL and is not advisable to use
//schema: buildSchema(`
// type rootQuery{
// events: [String!]!
// }
// type rootMutation{
// createEvent: (name: String) :  String
// }
// schema {
//   query: rootQuery,
//   mutation: rootMutation
// }`)

app.use('/graphql', graphqlHttp({
  schema: rootSchema,
  rootValue: {},
  graphiql: true
}))

mongoose.connect(`
mongodb+srv://${process.env.MONGO_ADMIN}:${process.env.MONGO_PWD}@clustere4ecom-gbqvv.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority
`).then(
  app.listen(9000, () => console.log('server starts'))
).catch((e) => console.log(e));


