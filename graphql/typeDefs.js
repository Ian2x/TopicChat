const { gql } = require('apollo-server-express')


module.exports = gql`
    type ChatReply {
        id: ID!
        user: ID!
        username: String!
        reply: String!
        createdAt: String!
    }
    type Chat {
        id: ID!
        user: ID!
        username: String!
        chat: String!
        replies: [ChatReply]!
        createdAt: String!
    }
    type Topic {
        id: ID!
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
        getUser(userId: ID!): User!
        getAllUsers: [User]!
        getUserTopics(username: String!): [Topic]!
        getUserTopicChats(userId: ID!, keyword: String!): [Chat]!
        getGroupChat(keyword: String!): [Chat]!
        getAllSuggestedTopics: [String]!
        getNewSuggestedTopics: [String]!
    }
    type Mutation {
        register(registerInput: RegisterInput!): User!
        login(username: String!, password: String!): User!
        createTopic(keyword: String!): Topic!
        createChat(keyword: String!, chat: String!): Chat!
        replyToChat(chatUserId: ID!, keyword: String!, chatId: ID!, reply: String!): ChatReply!
        deleteTopic(keyword: String!): String!
        deleteChat(keyword: String!, chatId: ID!): String!
        deleteReply(chatUserId: ID!, keyword: String!, chatId: ID!, replyId: ID!, replyUser: ID!): String!
        sendFriendRequest(friendId: ID!): String!
        acceptFriendRequest(friendId: ID!): String!
        rejectFriendRequest(friendId: ID!): String!
        removeFriend(friendId: ID!): String!
    }
`