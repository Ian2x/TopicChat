
const userResolvers = require('./users')

module.exports = {
    Chat: {
        replyCount: (parent) => parent.replies.length
    },
    Topic: {
        chatCount: (parent) => parent.chats.length,
    },
    Query: {
        ...userResolvers.Query
    },
    Mutation: {
        ...userResolvers.Mutation
    },
}