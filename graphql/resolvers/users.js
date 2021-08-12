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

function byChatCount(a, b) {
    return (a.totalChats < b.totalChats ? 1 : ((a.totalChats > b.totalChats) ? -1 : 0))
}

function byReplyCount(a, b) {
    return (a.replyCount < b.replyCount ? 1: ((a.replyCount > b.replyCount) ? -1 : 0))
}

/*
async function userExists(userId) {
    const user = await User.findOne({ "_id": mongoose.Types.ObjectId(userId) })
    if (!user) {
        throw new Error('No such user')
    }
}
*/

async function syncFriendRelationship(id1, id2) {
    const user1HasFriend = await User.findOne({ $and: [
        {"_id": mongoose.Types.ObjectId(id1)},
        {"friends.userId": id2}
    ]})
    const user2HasFriend = await User.findOne({ $and: [
        {"_id": mongoose.Types.ObjectId(id2)},
        {"friends.userId": id1}
    ]})

    if (user1HasFriend && !user2HasFriend) {
        await User.updateOne(
            {
                "_id": mongoose.Types.ObjectId(id1)
            },
            {
                "$pull": {
                    "friends": {"userId": id2}
                }
            },
            {
                multi: true
            })
    }
    if (!user1HasFriend && user2HasFriend) {
        await User.updateOne(
            {
                "_id": mongoose.Types.ObjectId(id2),
            },
            {
                "$pull": {
                    "friends": {"userId": id1}
                }
            },
            {
                multi: true
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
                    "friendRequests": {
                        "userId": mongoose.Types.ObjectId(id2)
                    }
                }
            }
        )
        await User.updateOne(
            {
                "_id": mongoose.Types.ObjectId(id2)
            },
            {
                "$pull": {
                    "friendsRequests": {
                        "userId": mongoose.Types.ObjectId(id1)
                    }
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

async function getSuggestedTopics(user, onlyNew) {
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
        friend = await User.findOne({ "_id": mongoose.Types.ObjectId(user.friends[i].userId)})
        for (j = 0; j < friend.topics.length; j++) {
            addTopicByCountToList(friend.topics[j], suggestedTopics)
        }
    }
    // sort based on totalChats
    suggestedTopics.sort(byChatCount)
    // topics that are already added
    const alreadyAddedTopics = user.topics.map(topic => topic.keyword)
    // if onlyNew:
    if (onlyNew) {
        suggestedTopics = suggestedTopics.map(sortedTopic => ({'keyword': sortedTopic.keyword, 'totalChats': sortedTopic.totalChats}))
        return suggestedTopics.filter(sortedTopic => !alreadyAddedTopics.includes(sortedTopic.keyword))
    }
    // return topics and whether they're already in user
    return suggestedTopics.map(sortedTopic => ({'keyword': sortedTopic.keyword, 'totalChats': sortedTopic.totalChats, 'addedTopic': alreadyAddedTopics.includes(sortedTopic.keyword)}))
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
                    groupChat = groupChat.concat(await getUserChatsForTopic(user.friends[i].userId, keyword))
                }
                return groupChat.sort(byMostRecent).reverse()
            } catch (err) {
                throw new Error(err)
            }
        },
        // getUserFeed: [Chat]!
        async getUserFeed(_, __, context) {
            try {
                // primitive feed: essentially merges all groupchats for interested topics
                var user = checkAuth(context)
                user = await User.findOne({ "_id": mongoose.Types.ObjectId(user.id)})
                const topicKeywords = user.topics.map(topic => topic.keyword)
                var feed = []
                for (i = 0; i < topicKeywords.length; i++) {
                    for (j = 0; j < user.friends.length; j++) {
                        const temp = await getUserChatsForTopic(user.friends[j].userId, topicKeywords[i])
                        for (k = 0; k < temp.length; k++) {
                            temp[k].parentTopic = topicKeywords[i]
                        }
                        feed = feed.concat(temp)
                    }
                    // add own chats to feed
                    const temp = await getUserChatsForTopic(user.id, topicKeywords[i])
                    for (k = 0; k < temp.length; k++) {
                        temp[k].parentTopic = topicKeywords[i]
                    }
                    feed = feed.concat(temp)
                }
                return feed.sort(byReplyCount).reverse()
            } catch (err) {
                throw new Error(err)
            }
        },
        // getAllSuggestedTopics: [SuggestedTopic]!
        async getAllSuggestedTopics(_, {}, context) {
            try {
                var user = checkAuth(context)
                user = await User.findOne({ "_id": mongoose.Types.ObjectId(user.id)})
                return await getSuggestedTopics(user, false)
            } catch (err) {
                throw new Error(err)
            }
        },
        
        // getNewSuggestedTopics: [SuggestedTopic]!
        async getNewSuggestedTopics(_, {}, context) {
            try {
                var user = checkAuth(context)
                user = await User.findOne({ "_id": mongoose.Types.ObjectId(user.id)})
                return await getSuggestedTopics(user, true)
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
                profilePic: null,
                topics: [],
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

            const fullUser = await User.findOne({ "_id": mongoose.Types.ObjectId(user.id) })
            // getUser.topics.some(t => t.keyword === keyword)
            if(fullUser.topics.some(t=>t.keyword === kw)) {
                errors.keyword = 'Topic already added'
                throw new UserInputError('Topic already added', { errors })
            }

            topicId = mongoose.Types.ObjectId();
            const { nModified } = await User.updateOne(
                {
                    "_id": mongoose.Types.ObjectId(user.id),
                },
                {
                    "$addToSet": {
                        "topics": {
                            _id: topicId,
                            keyword: kw,
                            image: null,
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
            return updatedUser.topics.find(({ _id }) => String(_id) == String(topicId))

        },
        // createChat(topic: String!, chat: String!): Chat!
        async createChat(_, { keyword: kw, chat: ct }, context) {
            const user = checkAuth(context)

            const errors = {}

            if (ct.trim() === '') {
                errors.ct = 'Chat message is required'
                throw new UserInputError('Chat message is required', { errors })
            }

            chatId = mongoose.Types.ObjectId()
            const { nModified } = await User.updateOne(
                {
                    "_id": mongoose.Types.ObjectId(user.id),
                    "topics.keyword": kw
                },
                {
                    "$push": {
                        "topics.$.chats": {
                            _id: chatId,
                            user: mongoose.Types.ObjectId(user.id),
                            username: user.username,
                            chat: ct,
                            votes: [],
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
            return updatedUser.topics.find(({ keyword }) => keyword === kw).chats.find(({ _id }) => String(_id) == String(chatId))
        },
        // replyToChat(chatUserId: ID!, keyword: String!, chatId: ID!, reply: String!): String!
        async replyToChat(_, { chatUserId, keyword: kw, chatId, reply: rp}, context) {
            const user = checkAuth(context)

            try {
                replyId = mongoose.Types.ObjectId()
                const { nModified } = await User.updateOne(
                    {
                        "_id": mongoose.Types.ObjectId(chatUserId),
                        "topics.keyword": kw,
                        "topics.chats._id": mongoose.Types.ObjectId(chatId)
                    },
                    {
                        "$push": {
                            "topics.$[topic].chats.$[chat].replies": {
                                _id: replyId,
                                user: user.id,
                                username: user.username,
                                reply: rp,
                                votes: [],
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
                return updatedUser.topics.find(({ keyword }) => keyword === kw).chats.find(({ _id }) => String(_id) == String(chatId)).replies.find(({ _id }) => String(_id) == String(replyId))

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
        // sendFriendRequest(friendUsername: String!, friendId: ID!): String!
        async sendFriendRequest(_, { friendUsername, friendId }, context) {
            const user = checkAuth(context);

            // check not self
            if (user.id === friendId) throw new UserInputError("Can't send friend request to self")

            // check legit id
            const friend = await User.findOne({ "_id": mongoose.Types.ObjectId(friendId) })
            if (!friend) {
                throw new Error('No such user')
            }
            // check no friend request sent already
            if (friend.friendRequests.some(friend=>friend.userId===user.id)) return 'Friend request already sent'


            // check not already friends
            const alreadyFriends1 = await User.findOne(
                { "_id": mongoose.Types.ObjectId(user.id), "friends.userId": friendId }
            )
            const alreadyFriends2 = await User.findOne(
                { "_id": mongoose.Types.ObjectId(friendId), "friends.userId": user.id }
            )
            if (alreadyFriends1 && alreadyFriends2) return 'Already friends'

            // check friend hasn't already sent a friend request back, in which case just become friends
            if (await User.findOne({ "_id": mongoose.Types.ObjectId(user.id), "friendRequests.userId": friendId })) {
                // add to friend list
                const { nModified } = await User.updateOne(
                    {
                        "_id": mongoose.Types.ObjectId(user.id),
                    },
                    {
                        "$addToSet": {
                            "friends": {"username": friendUsername, "userId": friendId}
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
                            "friends": {"username": user.username, "userId": user.id}
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
                            "friendRequests": {"username": user.username, "userId": user.id}
                        }
                    }
                )
                syncFriendRelationship(user.id, friendId)
                if (nModified === 0) return 'Friend request failed'
                else return 'Friend request sent'
            } catch (err) {
                throw new Error(err);
            }
        },
        // acceptFriendRequest(friendUsername: String!, friendId: ID!): String!
        async acceptFriendRequest(_, { friendUsername, friendId }, context) {
            const user = checkAuth(context)
            try {

                // check friendId is really in pending friend requests
                const isPendingFriend = await User.findOne({
                    "_id": mongoose.Types.ObjectId(user.id), "friendRequests.userId": friendId
                })
                if (!isPendingFriend) return 'No such pending friend request'

                // add to friend list
                const { nModified } = await User.updateOne(
                    {
                        "_id": mongoose.Types.ObjectId(user.id),
                    },
                    {
                        "$addToSet": {
                            "friends": {"username": friendUsername, "userId": friendId}
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
                            "friends": {"username": user.username, "userId": user.id}
                        }
                    }
                )
                await syncFriendRelationship(user.id, friendId)
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
        // rejectFriendRequest(friendId: ID!): String!
        async rejectFriendRequest(_, { friendId }, context) {
            const user = checkAuth(context)

            try {
                // check friendId is really in pending friend requests
                const isPendingFriend = await User.findOne({
                    "_id": mongoose.Types.ObjectId(user.id), "friendRequests.userId": friendId
                })
                if (!isPendingFriend) return 'No such pending friend request'

                // remove friend request
                const { nModified } = await User.updateOne(
                    {
                        "_id": mongoose.Types.ObjectId(user.id),
                    },
                    {
                        $pull: {
                            "friendRequests": {"userId": friendId}
                        }
                    }
                )
                await syncFriendRelationship(user.id, friendId)
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
                    "_id": mongoose.Types.ObjectId(user.id), "friends.userId": friendId
                })
                if (!isFriend) return 'No such friend'

                // remove friend
                const { nModified } = await User.updateOne(
                    {
                        "_id": mongoose.Types.ObjectId(user.id)
                    },
                    {
                        $pull: {
                            "friends": {"userId": friendId}
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
