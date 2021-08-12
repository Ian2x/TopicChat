const { model, Schema } = require('mongoose');

const userSchema = new Schema({
    // name: String,
    // email: String,
    // mobileNumber: String,
    username: String, // for login purposes, may eventually be phone # or email
    password: String,
    profilePic: String,
    topics: [{ keyword: String, image: {url: String, createdAt: String}, chats: [{ user: String, username: String, chat: String, votes: [{userId: String, up: Boolean}], replies: [{user: String, username: String, reply: String, votes: [{userId: String, up: Boolean}], createdAt: String}], createdAt: String }]}], // no images within each topic for now
    friends: [{username: String, userId: String}],
    friendRequests: [{username: String, userId: String}],
    createdAt: String
})

module.exports = model('User', userSchema);