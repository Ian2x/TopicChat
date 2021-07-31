const { model, Schema } = require('mongoose');

const userSchema = new Schema({
    // name: String,
    // email: String,
    // mobileNumber: String,
    username: String, // for login purposes, may eventually be phone # or email
    password: String,
    topics: [{ keyword: String, chats: [{ user: String, username: String, chat: String, replies: [{user: String, username: String, reply: String, createdAt: String}], createdAt: String }]}], // no images within each topic for now
    friends: [String], // store friend ids
    friendRequests: [String],
    createdAt: String
})

module.exports = model('User', userSchema);