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
        async createChat(_, {topic, chat}) {
            const user = checkAuth(context)

            const errors = {}

            if(chat.trim() === '') {
                errors.chat = 'Chat message is required'
                throw new UserInputError('Chat message is required', { errors })
            }

            await User.updateOne(
                {
                    "_id": mongoose.Types.ObjectId(user.id)
                },
                {
                    
                }
            )
        }
    }
}

/*
    type Query {
        getUserTopicChats(userId: ID!, topic: String!): [Chat]!
        getUser(userId: ID!): User!
    }
    type Mutation {
        createChat(topic: String!, chat: String!): Chat!
        deleteTopic(topic: String!): Topic!
        deleteChat(topic: String!, chatId: String!): Chat!
        addFriend(friendId: String!): User!
        removeFriend(friendId: String!): User!
    }
*/