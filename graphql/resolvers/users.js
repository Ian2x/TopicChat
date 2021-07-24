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


module.exports = {
    Query: {
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
        async getUserTopics(_, {username}) {
            try {
                //const user = await User.findOne({'username': username })
                const user = await User.findOne({username})
                if (user) {
                    // console.log(user.posts)
                    return user.topics.sort(byMostRecent)
                }
            } catch (err) {
                throw new Error(err);
            }
        },
        // getUserTopicChats(userId: ID!, topic: String!): [Chat]!
        
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
                friendRequests:[],
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
        async createTopic(_, {keyword: kw}, context) {
            const user = checkAuth(context)

            const errors = {}

            if (kw.trim() === '') {
                errors.keyword = 'Topic keyword is required'
                throw new UserInputError('Topic keyword is required', { errors })
            }

            await User.updateOne(
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
            // get updated user (which contains the newly created topic)
            const updatedUser = await User.findOne({ "_id": mongoose.Types.ObjectId(user.id) })
            // return newly created topic
            return updatedUser.topics.find( ({ keyword }) => keyword === kw )

        },
        // createChat(topic: String!, chat: String!): Chat!
        async createChat(_, {keyword: kw, chat: ct}, context) {
            const user = checkAuth(context)

            const errors = {}

            if(ct.trim() === '') {
                errors.ct = 'Chat message is required'
                throw new UserInputError('Chat message is required', { errors })
            }

            await User.updateOne(
                {
                    "_id": mongoose.Types.ObjectId(user.id),
                    "topics.keyword": kw
                },
                {
                    "$push": {
                        "topics.$.chats": {
                            user: user.id,
                            chat: ct,
                            replies:[],
                            createdAt: new Date().toISOString()
                        }
                    }
                }
            )

            // get updated user (which contains the newly created topic)
            const updatedUser = await User.findOne({ "_id": mongoose.Types.ObjectId(user.id) })
            // return newly created topic
            return updatedUser.topics.find( ({ keyword }) => keyword === kw).chats.find( ({ chat }) => chat === ct)
        },
        // deleteTopic(keyword: String!): String!
        async deleteTopic(_, {keyword}, context) {
            const user = checkAuth(context);

            try {
                const { nModified } = await User.updateOne(
                    { "_id": mongoose.Types.ObjectId(user.id), "topics.keyword": keyword },
                    { $pull: { "topics": { "keyword": keyword } } }
                )
                if (nModified===0) return 'Deletion failed'
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
                    { "_id": mongoose.Types.ObjectId(user.id), "topics.keyword": keyword, "topics.chats._id": mongoose.Types.ObjectId(chatId)},
                    { $pull: {"topics.$.chats": { "_id": mongoose.Types.ObjectId(chatId)}}}
                )
                if (nModified===0) return 'Deletion failed'
                else return 'Chat deleted'
            } catch (err) {
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
                { "_id": mongoose.Types.ObjectId(user.id) , "friends": friendId }
            )
            const alreadyFriends2 = await User.findOne(
                { "_id": mongoose.Types.ObjectId(friendId) ,  "friends": user.id }
            )
            if (alreadyFriends1 && alreadyFriends2) return 'Already friends'

            // check they haven't sent a friend request, in which case just become friends
            if (await User.findOne({"_id": mongoose.Types.ObjectId(user.id), "friendRequests": friendId})) {
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
                if (nModified===0) errors+='Adding friend failed, '
                if (nModified2===0) errors+='Adding to friend\'s friend list failed, '
                if (errors!='') return errors
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
                if (nModified===0) return 'Friend request failed, a friend request has most likely already been sent'
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
                if(!isPendingFriend) return 'No such pending friend request'

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
                if (nModified===0) errors+='Adding friend failed, '
                if (nModified2===0) errors+='Adding to friend\'s friend list failed, '
                if (nModified2===0) errors+='Removing from pending friends failed'
                if (errors!='') return errors
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
                if(!isPendingFriend) return 'No such pending friend request'

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
                if (nModified===0) return 'Failed to reject friend request'
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
                if(!isFriend) return 'No such friend'

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
                if (nModified===0) return 'Failed to remove friend'
                else return 'Removed friend'
            } catch (err) {
                throw new Error(err);
            }
        }
    }
}

/*
    type Query {
        getUserTopicChats(userId: ID!, topic: String!): [Chat]!
        getUser(userId: ID!): User!
    }
*/