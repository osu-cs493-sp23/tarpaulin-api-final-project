const mongoose = require('mongoose')

const mongoHost = process.env.MONGO_HOST || "localhost"
const mongoPort = process.env.MONGO_PORT || 27017
const mongoUser = process.env.MONGO_USER
const mongoPassword = process.env.MONGO_PASSWORD
const mongoDBName = process.env.MONGO_DB_NAME

const mongoURL = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDBName}`

let db = null

exports.connectToDb = function (callback) {
    mongoose.connect(mongoURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => {
        const mongoClient = mongoose.connection.getClient()
        db = mongoClient.db(mongoDBName)

        callback()
    }).catch((err) => {
        console.log(err)
    })
}

exports.getDbReference = function () {
    return db
}

exports.closeDbConnection = function (callback) {
    _closeDbConnection(callback)
}
