const { gql } = require('apollo-server-express')


module.exports = gql`
    scalar ISODate
    type Chat {
        id: ID!
        user: ID!
        chat: String!
        replies: [String]!
        createdAt: String!
    }
    type Topic {
        keyword: String!
        chats: [Chat]!
        chatCount: Int!
    }
    type User {
        id: ID!
        token: String!
        username: String!
        topics: [Topic]!
        friends: [User]!
        createdAt: String!
    }
    input RegisterInput {
        username: String!
        password: String!
        confirmPassword: String!
    }
    type Query {
        getAllUsers: [User]!
        getUserTopics(username: String!): [Topic]!
        getUserTopicChats(userId: ID!, topic: String!): [Chat]!
        getUser(userId: ID!): User!
    }
    type Mutation {
        register(registerInput: RegisterInput!): User!
        login(username: String!, password: String!): User!
        createTopic(keyword: String!): Topic!
        createChat(topic: String!, chat: String!): Chat!
        deleteTopic(topic: String!): Topic!
        deleteChat(topic: String!, chatId: String!): Chat!
        addFriend(friendId: String!): User!
        removeFriend(friendId: String!): User!
    }
`