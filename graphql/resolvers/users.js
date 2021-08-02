const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserInputError, AuthenticationError } = require('apollo-server-express');
const mongoose = require('mongoose');

const { validateRegisterInput, validateLoginInput } = require('../../util/validators')
const { SECRET_KEY } = require('../../config');
const User = require('../../models/User');
const checkAuth = require('../../util/check-auth');

function generateToken(user) {
    return jwt.sign({
        id: user.id,
        username: user.username
    }, SECRET_KEY, { expiresIn: '1h' });
}

function byMostRecent(a, b) {
    var date_a = new Date(a.createdAt);
    var date_b = new Date(b.createdAt);
    return ((date_a < date_b) ? 1 : ((date_a > date_b) ? -1 : 0))
}

async function userExists(userId) {
    const user = await User.findOne({ "_id": mongoose.Types.ObjectId(userId) })
    if (!user) {
        throw new Error('No such user')
    }
}

async function syncFriendRelationship(id1, id2) {
    const user1HasFriend = await User.findOne({ "_id": mongoose.Types.ObjectId(id1), "friends": id2 })
    const user2HasFriend = await User.findOne({ "_id": mongoose.Types.ObjectId(id2), "friends": id1 })
    if (user1HasFriend && !user2HasFriend) {
        await User.updateOne(
            {
                "_id": mongoose.Types.ObjectId(id1)
            },
            {
                "$pull": {
                    "friends": id2
                }
            })
    }
    if (!user1HasFriend && user2HasFriend) {
        await User.updateOne(
            {
                "_id": mongoose.Types.ObjectId(id2),
            },
            {
                "$pull": {
                    "friends": id1
                }
            })
    }
    // remove pending requests if friends already
    if (user1HasFriend && user2HasFriend) {
        await User.updateOne(
            {
                "_id": mongoose.Types.ObjectId(id1)
            },
            {
                "$pull": {
                    "friendRequests": id2
                }
            }
        )
        await User.updateOne(
            {
                "_id": mongoose.Types.ObjectId(id2)
            },
            {
                "$pull": {
                    "friendRequests": id1
                }
            }
        )
    }

}

async function getUserChatsForTopic(userId, keyword) {
    const user = await User.findOne({ "_id": mongoose.Types.ObjectId(userId) })
    if (!user) throw new Error("Invalid userid")
    try {
        return user.topics.find(topic => topic.keyword === keyword).chats
    } catch (err) {
        return []
    }
}

async function addTopicByCountToList(addTopic, topicList) {
    index = topicList.findIndex((topic) => topic.keyword === addTopic.keyword)
    if (index===-1) {
        // need to add topic to topicList
        topicList.push({keyword: addTopic.keyword, totalChats: addTopic.chats.length})
    } else {
        // topic is already in topicList, just add to count
        topicList[index].totalChats+=addTopic.chats.length
    }
}

function byChatCount(a, b) {
    return (a.totalChats < b.totalChats ? 1 : ((a.totalChats > b.totalChats) ? -1 : 0))
}

async function getSuggestedTopics(user) {
    var suggestedTopics = []
    /*
    suggestedTopics structure:
    [{
        keyword: ___,
        totalChats: ___
    },...]
    */
    for (i = 0; i < user.topics.length; i++) {
        addTopicByCountToList(user.topics[i], suggestedTopics)
    }
    for (i = 0; i < user.friends.length; i++) {
        friend = await User.findOne({ "_id": mongoose.Types.ObjectId(user.friends[i])})
        for (j = 0; j < friend.topics.length; j++) {
            addTopicByCountToList(friend.topics[j], suggestedTopics)
        }
    }
    // sort based on totalChats
    suggestedTopics.sort(byChatCount)
    // just return keywords
    return suggestedTopics.map(sortedTopic => sortedTopic.keyword)
}

// QUERY AND MUTATION RESOLVERS (BELOW)
module.exports = {
    Query: {
        // getUser(userId): User!
        async getUser(_, { userId }) {
            try {
                return await User.findOne({ "_id": mongoose.Types.ObjectId(userId) })
            } catch (err) {
                throw new Error(err)
            }
        },
        // getAllUsers: [User]!
        async getAllUsers() {
            try {
                const users = await User.find();
                return users.sort(byMostRecent);
            } catch (err) {
                throw new Error(err);
            }
        },
        // getUserTopics(username: String!): [Topic]!
        async getUserTopics(_, { username }) {
            try {
                const user = await User.findOne({ username })
                if (user) {
                    return user.topics.sort(byMostRecent).reverse()
                }
                throw new Error("Invalid username")
            } catch (err) {
                throw new Error(err);
            }
        },
        // getUserTopicChats(userId: ID!, keyword: String!): [Chat]!
        async getUserTopicChats(_, { userId, keyword }) {
            try {
                return await getUserChatsForTopic(userId, keyword)
            } catch (err) {
                throw new Error(err)
            }
        },
        // getGroupChat(keyword: String!): [Chat]!
        async getGroupChat(_, { keyword }, context) {
            try {
                // need to search all within one degree and with keyword
                var user = checkAuth(context)
                user = await User.findOne({ "_id": mongoose.Types.ObjectId(user.id) })
                var groupChat = await getUserChatsForTopic(user.id, keyword)
                for (i = 0; i < user.friends.length; i++) {
                    groupChat = groupChat.concat(await getUserChatsForTopic(user.friends[i], keyword))
                }
                return groupChat.sort(byMostRecent).reverse()
            } catch (err) {
                throw new Error(err)
            }
        },
        // getAllSuggestedTopics: [String]!
        async getAllSuggestedTopics(_, {}, context) {
            try {
                var user = checkAuth(context)
                user = await User.findOne({ "_id": mongoose.Types.ObjectId(user.id)})
                return await getSuggestedTopics(user)
            } catch (err) {
                throw new Error(err)
            }
        },
        // getNewSuggestedTopics: [String]!
        async getNewSuggestedTopics(_, {}, context) {
            try {
                var user = checkAuth(context)
                user = await User.findOne({ "_id": mongoose.Types.ObjectId(user.id)})
                const toExclude = user.topics.map(topic => topic.keyword)
                return (await getSuggestedTopics(user)).filter( el => !toExclude.includes( el ) );
            } catch (err) {
                throw new Error(err)
            }
        }
    },
    Mutation: {
        // register(registerInput: RegisterInput): User!
        async register(_, { registerInput: { username, password, confirmPassword } }) {
            // Validate user data
            const { valid, errors } = validateRegisterInput(username, password, confirmPassword);
            if (!valid) {
                throw new UserInputError('Errors', { errors })
            }
            // Make sure user doesn't already exist
            const user = await User.findOne({ username });
            if (user) {
                throw new UserInputError('Username is taken', {
                    errors: {
                        username: 'This username is taken'
                    }
                })
            }
            // hash password and create an auth token
            password = await bcrypt.hash(password, 12);

            const newUser = new User({
                username,
                password,
                friends: [],
                friendRequests: [],
                createdAt: new Date().toISOString()
            });

            const res = await newUser.save();

            const token = generateToken(res)

            return {
                ...res._doc,
                id: res.id,
                token
            }
        },
        // login(username: String!, password: String!): User!
        async login(_, { username, password }) {
            const { errors, valid } = validateLoginInput(username, password);

            if (!valid) {
                throw new UserInputError('Errors', { errors })
            }

            const user = await User.findOne({ username });

            if (!user) {
                errors.general = 'User not found'
                throw new UserInputError('User not found', { errors });
            }

            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                errors.general = 'Wrong credentials'
                throw new UserInputError('Wrong credentials', { errors });
            }

            const token = generateToken(user);

            return {
                ...user._doc,
                id: user.id,
                token
            }
        },
        // createTopic(keyword: String!): Topic!
        async createTopic(_, { keyword: kw }, context) {
            const user = checkAuth(context)

            const errors = {}

            if (kw.trim() === '') {
                errors.keyword = 'Topic keyword is required'
                throw new UserInputError('Topic keyword is required', { errors })
            }

            const { nModified } = await User.updateOne(
                {
                    "_id": mongoose.Types.ObjectId(user.id),
                },
                {
                    "$push": {
                        "topics": {
                            keyword: kw,
                            chats: [],
                            createdAt: new Date().toISOString()
                        }
                    }
                }
            )
            if ( nModified === 0) throw new Error('Topic creation failed')

            // get updated user (which contains the newly created topic)
            const updatedUser = await User.findOne({ "_id": mongoose.Types.ObjectId(user.id) })
            // return newly created topic
            return updatedUser.topics.find(({ keyword }) => keyword === kw)

        },
        // createChat(topic: String!, chat: String!): Chat!
        async createChat(_, { keyword: kw, chat: ct }, context) {
            const user = checkAuth(context)

            const errors = {}

            if (ct.trim() === '') {
                errors.ct = 'Chat message is required'
                throw new UserInputError('Chat message is required', { errors })
            }

            const { nModified } = await User.updateOne(
                {
                    "_id": mongoose.Types.ObjectId(user.id),
                    "topics.keyword": kw
                },
                {
                    "$push": {
                        "topics.$.chats": {
                            user: mongoose.Types.ObjectId(user.id),
                            username: user.username,
                            chat: ct,
                            replies: [],
                            createdAt: new Date().toISOString()
                        }
                    }
                }
            )

            if ( nModified === 0) throw new Error('Chat creation failed')

            // get updated user (which contains the newly created chat)
            const updatedUser = await User.findOne({ "_id": mongoose.Types.ObjectId(user.id) })
            // return newly created chat
            return updatedUser.topics.find(({ keyword }) => keyword === kw).chats.find(({ chat }) => chat === ct)
        },
        // replyToChat(chatUserId: ID!, keyword: String!, chatId: ID!, reply: String!): String!
        async replyToChat(_, { chatUserId, keyword: kw, chatId, reply: rp}, context) {
            const user = checkAuth(context)

            try {
                const { nModified } = await User.updateOne(
                    {
                        "_id": mongoose.Types.ObjectId(chatUserId),
                        "topics.keyword": kw,
                        "topics.chats._id": mongoose.Types.ObjectId(chatId)
                    },
                    {
                        "$push": {
                            "topics.$[topic].chats.$[chat].replies": {
                                user: user.id,
                                username: user.username,
                                reply: rp,
                                createdAt: new Date().toISOString()
                            }
                        }
                    },
                    {
                        arrayFilters: [
                            {"topic.keyword": kw},
                            {"chat._id": mongoose.Types.ObjectId(chatId)}
                        ]
                    }
                )

                if ( nModified === 0) throw new Error('Reply failed')
                
                // get updated user (which contains the newly created topic)
                const updatedUser = await User.findOne({ "_id": mongoose.Types.ObjectId(chatUserId) })
                // return newly created reply
                return updatedUser.topics.find(({ keyword }) => keyword === kw).chats.find(({ _id }) => String(_id) == String(chatId)).replies.find(({ reply }) => reply === rp)

            } catch (err) {
                throw new Error(err)
            }
        },
        // deleteTopic(keyword: String!): String!
        async deleteTopic(_, { keyword }, context) {
            const user = checkAuth(context);

            try {
                const { nModified } = await User.updateOne(
                    {
                        "_id": mongoose.Types.ObjectId(user.id),
                        "topics.keyword": keyword
                    },
                    {
                        $pull: {
                            "topics": {
                                "keyword": keyword
                            }
                        }
                    }
                )
                if (nModified === 0) return 'Deletion failed'
                else return 'Topic deleted'

            } catch (err) {
                throw new Error(err);
            }
        },
        // deleteChat(keyword: String!, chatId: String!): String!
        async deleteChat(_, { keyword, chatId }, context) {
            const user = checkAuth(context);

            try {
                const { nModified } = await User.updateOne(
                    {
                        "_id": mongoose.Types.ObjectId(user.id),
                        "topics.keyword": keyword,
                        "topics.chats._id": mongoose.Types.ObjectId(chatId)
                    },
                    {
                        $pull: { 
                            "topics.$.chats": {
                                "_id": mongoose.Types.ObjectId(chatId)
                            }
                        }
                    }
                )
                if (nModified === 0) return 'Deletion failed'
                else return 'Chat deleted'
            } catch(err) {
                throw new Error(err);
            }
        },
        // deleteReply(chatUserId: ID!, keyword: String!, chatId: ID!, replyId: ID!, replyUser: ID!): String!
        async deleteReply(_, {chatUserId, keyword, chatId, replyId, replyUser}, context) {
            const user = checkAuth(context);

            if(user.id !== replyUser) return 'Not allowed to delete someone else\'s reply'

            try {
                // could be quite slow (searching over all of chatUser)
                const { nModified } = await User.updateOne(
                    {
                        "_id": mongoose.Types.ObjectId(chatUserId),
                        "topics.keyword": keyword,
                        "topics.chats._id": mongoose.Types.ObjectId(chatId),
                        "topics.chats.replies._id": mongoose.Types.ObjectId(replyId)
                    },
                    {
                        $pull: {
                            "topics.$[].chats.$[].replies": {
                                "_id": replyId
                            }
                        }
                    }
                )

                if (nModified === 0) return 'Deletion failed'
                else return 'Reply deleted'
            } catch(err) {
                throw new Error(err);
            }
        },
        // sendFriendRequest(friendId: String!): String!
        async sendFriendRequest(_, { friendId }, context) {
            const user = checkAuth(context);

            // check not self
            if (user.id === friendId) throw new UserInputError("Can't send friend request to self")

            // check legit id
            userExists(friendId)

            // check not already friends
            const alreadyFriends1 = await User.findOne(
                { "_id": mongoose.Types.ObjectId(user.id), "friends": friendId }
            )
            const alreadyFriends2 = await User.findOne(
                { "_id": mongoose.Types.ObjectId(friendId), "friends": user.id }
            )
            if (alreadyFriends1 && alreadyFriends2) return 'Already friends'

            // check they haven't sent a friend request, in which case just become friends
            if (await User.findOne({ "_id": mongoose.Types.ObjectId(user.id), "friendRequests": friendId })) {
                // add to friend list
                const { nModified } = await User.updateOne(
                    {
                        "_id": mongoose.Types.ObjectId(user.id),
                    },
                    {
                        "$addToSet": {
                            "friends": friendId
                        }
                    }
                )
                // add to friend's friend list
                const { nModified: nModified2 } = await User.updateOne(
                    {
                        "_id": mongoose.Types.ObjectId(friendId),
                    },
                    {
                        "$addToSet": {
                            "friends": user.id
                        }
                    }
                )
                syncFriendRelationship(user.id, friendId)
                const errors = ''
                if (nModified === 0) errors += 'Adding friend failed, '
                if (nModified2 === 0) errors += 'Adding to friend\'s friend list failed, '
                if (errors != '') return errors
                else return 'Added friend'
            }

            try {
                // send friend request
                const { nModified } = await User.updateOne(
                    {
                        "_id": mongoose.Types.ObjectId(friendId),
                    },
                    {
                        "$addToSet": {
                            "friendRequests": user.id
                        }
                    }
                )
                syncFriendRelationship(user.id, friendId)
                if (nModified === 0) return 'Friend request failed, a friend request has most likely already been sent'
                else return 'Friend request sent'
            } catch (err) {
                throw new Error(err);
            }
        },
        // acceptFriendRequest(friendId: String!): String!
        async acceptFriendRequest(_, { friendId }, context) {
            const user = checkAuth(context)

            try {

                // check friendId is really in pending friend requests
                const isPendingFriend = await User.findOne({
                    "_id": mongoose.Types.ObjectId(user.id), "friendRequests": friendId
                })
                if (!isPendingFriend) return 'No such pending friend request'

                // add to friend list
                const { nModified } = await User.updateOne(
                    {
                        "_id": mongoose.Types.ObjectId(user.id),
                    },
                    {
                        "$addToSet": {
                            "friends": friendId
                        }
                    }
                )
                // add to friend's friend list
                const { nModified: nModified2 } = await User.updateOne(
                    {
                        "_id": mongoose.Types.ObjectId(friendId),
                    },
                    {
                        "$addToSet": {
                            "friends": user.id
                        }
                    }
                )
                syncFriendRelationship(user.id, friendId)
                const errors = ''
                if (nModified === 0) errors += 'Adding friend failed, '
                if (nModified2 === 0) errors += 'Adding to friend\'s friend list failed, '
                if (nModified2 === 0) errors += 'Removing from pending friends failed'
                if (errors != '') return errors
                else return 'Added friend'
            } catch (err) {
                throw new Error(err);
            }
        },
        // rejectFriendRequest(friendId: String!): String!
        async rejectFriendRequest(_, { friendId }, context) {
            const user = checkAuth(context)

            try {
                // check friendId is really in pending friend requests
                const isPendingFriend = await User.findOne({
                    "_id": mongoose.Types.ObjectId(user.id), "friendRequests": friendId
                })
                if (!isPendingFriend) return 'No such pending friend request'

                // remove friend request
                const { nModified } = await User.updateOne(
                    {
                        "_id": mongoose.Types.ObjectId(user.id),
                    },
                    {
                        $pull: {
                            "friendRequests": friendId
                        }
                    }
                )
                syncFriendRelationship(user.id, friendId)
                if (nModified === 0) return 'Failed to reject friend request'
                else return 'Rejected friend request'
            } catch (err) {
                throw new Error(err);
            }
        },
        // removeFriend(friendId: String!): User!
        async removeFriend(_, { friendId }, context) {
            const user = checkAuth(context)

            try {
                // check friendId is really in pending friend requests
                const isFriend = await User.findOne({
                    "_id": mongoose.Types.ObjectId(user.id), "friends": friendId
                })
                if (!isFriend) return 'No such friend'

                // remove friend
                const { nModified } = await User.updateOne(
                    {
                        "_id": mongoose.Types.ObjectId(user.id)
                    },
                    {
                        $pull: {
                            "friends": friendId
                        }
                    }
                )
                syncFriendRelationship(user.id, friendId)
                if (nModified === 0) return 'Failed to remove friend'
                else return 'Removed friend'
            } catch (err) {
                throw new Error(err);
            }
        }
    }
}
