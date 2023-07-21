export const types = `#graphql
    type User{
        id: ID!
        firstName: String!
        lastName: String
        email: String!
        profileImg: String


        posts: [Post]
    }
`;
