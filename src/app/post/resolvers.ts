import { Post, User } from "@prisma/client";
import { prismaClient } from "../../client/db";
import { GraphqlContext } from "../../interfaces";

interface CreatePostData {
    content: string;
    imageURL?: string;
}

const queries = {
    getAllPosts: async ()=> await prismaClient.post.findMany({orderBy: {createdAt: 'desc'}})
}

const mutations = {
    createPost: async (parent: any, { payload }: { payload: CreatePostData }, ctx: GraphqlContext) => {
        if (!ctx.user) {
            throw new Error('You are not authenticated');
        }
        const post = await prismaClient.post.create({
            data: {
                content: payload.content,
                imageURL: payload?.imageURL,
                // connecting using foreign relations between table Post and User
                author: { connect: { id: ctx.user.id } }
            }
        });
        return post;
    }
}
// resolver to retrieve the author of the post
const extraResolvers = {
    Post: {
        author: (parent: Post) => prismaClient.user.findUnique({where: {id: parent.authorId}})
        
    }
}

export const resolvers = { mutations, extraResolvers, queries };