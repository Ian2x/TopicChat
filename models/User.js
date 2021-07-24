const { model, Schema } = require('mongoose');

const userSchema = new Schema({
    // name: String,
    // email: String,
    // mobileNumber: String,
    username: String, // for login purposes, may eventually be phone # or email
    password: String,
    topics: [{ keyword: String, chats: [{ chat: String, replies: [String], createdAt: String }]}], // no images within each topic for now
    friends: [String], // store friend ids
    friendRequests: [String],
    createdAt: String
})

module.exports = model('User', userSchema);