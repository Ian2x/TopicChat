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
        friends: [String]!
        friendRequests: [String]!
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
        getUserTopicChats(userId: ID!, keyword: String!): [Chat]!
        getUser(userId: ID!): User!
        getGroupChat(keyword: String!): [Chat]!
    }
    type Mutation {
        register(registerInput: RegisterInput!): User!
        login(username: String!, password: String!): User!
        createTopic(keyword: String!): Topic!
        createChat(keyword: String!, chat: String!): Chat!
        deleteTopic(keyword: String!): String!
        deleteChat(keyword: String!, chatId: String!): String!
        sendFriendRequest(friendId: String!): String!
        acceptFriendRequest(friendId: String!): String!
        rejectFriendRequest(friendId: String!): String!
        removeFriend(friendId: String!): String!
    }
`