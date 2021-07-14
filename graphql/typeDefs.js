const { gql } = require('apollo-server-express')

module.exports = gql`
    type UserChat {
        id: ID!
        user: ID!
        chat: String!
        createdAt: Date!
    }
    type UserTopic {
        topic: String!
        image: String
        chats: [UserChat]!
        chatCount: Int!
    }
    type User {
        id: ID!
        token: String!
        name: String!
        email: String
        mobileNumber: String
        username: String!
        topics: [UserTopic]!
    }
    input RegisterInput {
        name: String!
        username: String!
        password: String!
        confirmPassword: String!
        email: String
        mobileNumber: String
    }
    type Query {
        getUsers: [User]!
        getUserTopics(userId: ID!): [UserTopic]!
        getUserChats(userId: ID!): [UserChat]!
        getUserTopicChats(userId: ID!, topic: String!): [UserChat]!
        getUser(userId: ID!): User!
    }
    type Mutation {
        register(registerInput: RegisterInput): User!
        login(username: String!, password: String!): User!
        createTopic(topic: String!, image: String): UserTopic!
        createChat(chat: String!): UserChat!
        deleteTopic(topic: String!): UserTopic!
        deleteChat(topic: String!, chatId: String!): UserChat!
    }
    type Subscription{
        newPost: Post!
    }
`