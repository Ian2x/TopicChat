const express = require('express')
// const { ApolloServer, PubSub } = require('apollo-server-express')
const { ApolloServer, PubSub } = require('apollo-server');

const mongoose = require('mongoose')
// const { PubSub } = require('apollo-server-express')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const cors = require('cors')
const fs = require('fs')
const util = require('util')

const typeDefs = require('./graphql/typeDefs')
const resolvers = require('./graphql/resolvers');
const { MONGODB } = require('./config.js');
const { uploadFile, getFileStream } = require('./s3')

const unlinkFile = util.promisify(fs.unlink)

// Use pubsub for live chat?
// const pubsub = new PubSub();

const PORT = process.env.PORT || 5000


/*
// BC Error: You must `await server.start()` before calling `server.applyMiddleware()`
// Only allow interactions from designated server (localhost:3000)
var corsOptions = {
    origin: function (origin, callback) {
        console.log(origin)
        if (origin.startsWith('http://localhost:3000')) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({ req, pubsub })
});

mongoose
    .connect(MONGODB, { useNewUrlParser: true, useUnifiedTopology: true })
    .catch(err => {
        console.error(err)
    })

const app = express();
server.applyMiddleware({ app });
*/

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({ req })
});

mongoose
    .connect(MONGODB, { useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => {
        console.log('MongoDB Connected');
        return server.listen({ port: PORT});
    })
    .then(res => {
        console.log(`Server running at ${res.url}`)
    })
    .catch(err=> {
        console.error(err)
    })



// Don't need image capabilities for now
/*
app.get('/images/:key', (req, res) => {
    console.log(req.params)
    const key = req.params.key
    const readStream = getFileStream(key)

    readStream.pipe(res)
})

app.post('/images', cors(corsOptions), upload.single('image'), async (req, res) => {
    const file = req.file
    console.log(file)

    // apply filter
    // resize

    const result = await uploadFile(file)
    await unlinkFile(file.path)
    console.log(result)
    res.send({imageURL: result.Location})
})
*/

/*
app.listen({ port: PORT }, () =>
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`)
)
*/
// node index + npm start