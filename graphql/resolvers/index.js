
const userResolvers = require('./users')

module.exports = {
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