
const userResolvers = require('./users')

module.exports = {
    Reply: {
        totalVotes: (parent) => parent.votes.length,
        upVotes: (parent) => parent.votes.filter(vote=>vote.up).length,
        downVotes: (parent) => parent.votes.filter(vote=>!vote.up).length,
    },
    Chat: {
        replyCount: (parent) => parent.replies.length,
        totalVotes: (parent) => parent.votes.length,
        upVotes: (parent) => parent.votes.filter(vote=>vote.up).length,
        downVotes: (parent) => parent.votes.filter(vote=>!vote.up).length,
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