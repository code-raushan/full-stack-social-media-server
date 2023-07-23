import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import bodyParser from 'body-parser';
import { User } from './user';
import {Post} from './post'
import cors from 'cors'
import { GraphqlContext } from '../interfaces';
import JWTService from '../services/jwt';


export async function initServer() {
    const app = express();
    app.use(bodyParser.json())
    app.use(cors())
    const graphqlServer = new ApolloServer<GraphqlContext>({
        typeDefs: `
        ${User.types}
        ${Post.types}

        type Query{
            ${User.queries}
            ${Post.queries}
        }    
        type Mutation{
            ${Post.mutations}
        }  
        `,
        resolvers: {
            Query: {
                ...User.resolvers.queries,
                ...Post.resolvers.queries
            }, 
            Mutation :{
                ...Post.resolvers.mutations
            },
            ...User.resolvers.extraResolvers,
            ...Post.resolvers.extraResolvers
        }
    })
    // waiting for the graphql server to start
    await graphqlServer.start();
    app.use("/graphql", expressMiddleware(graphqlServer, 
        {
        context: async ({ req, res }) => {
            // console.log(req.headers.authorization)
            let token: string;
            if(req.headers.authorization?.includes("Bearer ")){
                token = req.headers.authorization.split("Bearer ")[1];
            }else {
                token = req.headers.authorization as string;
            }
            return {
                user: req.headers.authorization ? JWTService.decodeJWT(token) : undefined  
            }
        }
    }
    ));
    return app;
}
