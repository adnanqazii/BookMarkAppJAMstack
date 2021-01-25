const { ApolloServer, gql } = require('apollo-server-lambda')
const dotenv=require("dotenv")

dotenv.config()


const faunadb = require('faunadb'),
  q = faunadb.query;

const typeDefs = gql`
  
  type Query {
    bookmark: [Bookmark!]
  }
  type Bookmark {
    id: ID!
    url: String!
    desc: String!
  }
  type Mutation {
    addBookmark(url: String!, desc: String!) : Bookmark
  }
`



const resolvers = {
  Query: {
    bookmark: async (root, args, context) => {
      try{
        var client = new faunadb.Client({ secret: process.env.FAUNA_SERVER_KEY });
        var result = await client.query(
          q.Map(
            q.Paginate(q.Match(q.Index("url"))),
            q.Lambda(x => q.Get(x))
          )
        )
        return result.data.map(d => {
          return {
            id: d.ref.id,
            url: d.data.url,
            desc: d.data.desc,
          }
        })
      }
      catch(err){
        console.log('err',err);
      }
    }
  },
  Mutation: {
    addBookmark: async (_, {url,desc}) => {
      try {
        var client = new faunadb.Client({ secret: process.env.FAUNA_SERVER_KEY });
        var result = await client.query(
          q.Create(
            q.Collection('Links'),
            { data: { 
              url,
              desc
             } },
          )

        );

        return result.ref.data

      } 
      catch (error){
          console.log('Error: ');
          console.log(error);
      }
      // console.log('url--desc', url,'desc',desc);
      
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

const handler = server.createHandler()

module.exports = { handler }
