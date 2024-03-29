import axios from "axios";
import { json } from "body-parser";
import { prismaClient } from "../../client/db";
import JWTService from "../../services/jwt";
import { GraphqlContext } from "../../interfaces";
import { User } from "@prisma/client";
interface Result {
    iss?: string;
    nbf?: string;
    aud?: string;
    sub?: string;
    email: string;
    email_verified: string;
    azp?: string;
    name: string;
    picture: string;
    given_name: string;
    family_name: string;
    iat?: string;
    exp?: string;
    jti?: string;
    alg?: string;
    kid?: string;
    typ?: string;
}

const queries = {
    verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
        const googleToken = token;
        const googleOAuthURL = new URL("https://oauth2.googleapis.com/tokeninfo");
        googleOAuthURL.searchParams.set("id_token", googleToken);
        // making the request to the google oauth2 service to get the information about the user
        const { data } = await axios.get<Result>(googleOAuthURL.toString(), { responseType: "json" });

        const user = await prismaClient.user.findUnique({
            where: { email: data.email }
        });
        //if user does not exist in the database we will create the user in the db;
        if (!user) {
            await prismaClient.user.create({
                data: {
                    email: data.email,
                    firstName: data.given_name,
                    lastName: data.family_name,
                    profileImg: data.picture,
                }
            })
        }
        // checking for unique user in the db and handling errors;
        const userInDB = await prismaClient.user.findUnique({ where: { email: data.email } });
        if (!userInDB) throw new Error('No user with this email exist');

        // generating the JWT token and returning it;
        const jwtToken = JWTService.generateJWT(userInDB);
        return jwtToken;

    },
    // context is available for all the resolvers
    getCurrentUser: async (parent: any, args: any, ctx: GraphqlContext) => {
        // console.log(ctx.user);
        const id = ctx.user?.id;
        const user = await prismaClient.user.findUnique({
            where: {
                id
            }
        });
        // console.log(user);
        return user;
    },
    getUserById: async (parent: any, { id }: { id: string }, ctx: GraphqlContext) => prismaClient.user.findUnique({ where: { id } })
}

// resolver to retrieve the posts mades the user
const extraResolvers = {
    User: {
        posts: (parent: User) =>
            prismaClient.post.findMany({ where: { author: { id: parent.id } } })
    }
}

export const resolvers = { queries, extraResolvers };