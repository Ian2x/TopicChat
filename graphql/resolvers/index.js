
const userResolvers = require('./users')

module.exports = {
    UserTopic: {
        chatCount: (parent) => parent.chats.length,
    },
    Query: {
        ...userResolvers.Query
    },
    Mutation: {
        ...userResolvers.Mutation
    },
    Subscription: {
        ...userResolvers.Subscription
    }
}