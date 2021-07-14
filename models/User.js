const { model, Schema } = require('mongoose');

const userSchema = new Schema({
    name: String,
    email: String,
    mobileNumber: String,
    username: String, // for login purposes, may eventually be phone # or email
    password: String,
    topics: [{ topic: String, image: String, chats: [{ chat: String, createdAt: Date }]}]
})

module.exports = model('User', userSchema);

//userTest