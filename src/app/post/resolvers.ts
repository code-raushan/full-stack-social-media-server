import { Post, User } from "@prisma/client";
import { prismaClient } from "../../client/db";
import { GraphqlContext } from "../../interfaces";
import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'

interface CreatePostData {
    content: string;
    imageURL?: string;
}

const s3Client = new S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: String(process.env.S3ACCESSKEY),
        secretAccessKey: String(process.env.S3SECRETACCESSKEY)
    }
})

const queries = {
    getAllPosts: async () => await prismaClient.post.findMany({orderBy: {createdAt: 'desc'}}),

    getSignedURLForPost: async(parent: any, {imageName, imageType}: {imageName: string, imageType: string}, ctx: GraphqlContext)=>{
        if(!ctx.user || !ctx.user.id) throw new Error("Unauthorized");
        const allowedImageTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp'];
        if(!allowedImageTypes.includes(imageType)) throw new Error("Unsupported Image Type");

        const putObjectCommand = new PutObjectCommand({
            Bucket: "raushan-twitter-project-bucket",
            Key: `uploads/${ctx.user.id}/tweets/${imageName}-${Date.now().toString()}.${imageType.substring(6)}`
        });

        const signedURL = await getSignedUrl(s3Client, putObjectCommand);

        return signedURL;

    }
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