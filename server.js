require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const redis = require('redis')

const api = require('./api')
const { connectToDb } = require('./lib/mongo')
const { requireAuthentication } = require('./lib/auth')

const app = express()
const port = process.env.PORT || 8000

const redisHost = process.env.REDIS_HOST || "localhost"
const redisPort = process.env.REDIS_PORT || "6379"
const redisClient = redis.createClient({
    url: `redis://${redisHost}:${redisPort}`
})

async function rateLimit(req, res, next) {
    requireAuthentication(req, res, async () => {
        const isAuthUser = req.user !== undefined
        const key = isAuthUser ? `rate-limit:${req.user}` : `rate-limit:${req.ip}`
        const rateLimitMaxRequests = isAuthUser ? 30 : 10
        const rateLimitWindowMillis = 60000
        const rateLimitRefreshRate = rateLimitMaxRequests / rateLimitWindowMillis

        let tokenBucket
        try {
            tokenBucket = await redisClient.hGetAll(key)
        } catch (e) {
            next()
            return
        }

        tokenBucket = {
            tokens: parseFloat(tokenBucket.tokens) || rateLimitMaxRequests,
            last: parseInt(tokenBucket.last) || Date.now()
        }

        const timestamp = Date.now()
        const ellapsedMillis = timestamp - tokenBucket.last
        tokenBucket.tokens += ellapsedMillis * rateLimitRefreshRate
        tokenBucket.tokens = Math.min(tokenBucket.tokens, rateLimitMaxRequests)
        tokenBucket.last = timestamp

        if (tokenBucket.tokens >= 1) {
            tokenBucket.tokens -= 1
            await redisClient.hSet(key, [
                ["tokens", tokenBucket.tokens],
                ["last", tokenBucket.last]
            ])
            next()
        } else {
            await redisClient.hSet(key, [
                ["tokens", tokenBucket.tokens],
                ["last", tokenBucket.last]
            ])
            res.status(429).send({
                error: "Too many requests per minute"
            })
        }
    })
}

redisClient.connect()
    .then(() => {
        console.log("== Redis client connected");
    })
    .catch((err) => {
        console.error(err);
    });

app.use(rateLimit)

app.use(morgan('dev'))

app.use(express.json())

app.use('/', api)

app.use('*', function (req, res, next) {
    res.status(404).json({
        error: "Requested resource " + req.originalUrl + " does not exist"
    })
})

/*
 * This route will catch any errors thrown from our API endpoints and return
 * a response with a 500 status to the client.
 */
app.use('*', function (err, req, res, next) {
    console.error("== Error:", err)
    res.status(500).send({
        err: "Server error.  Please try again later."
    })
})

connectToDb(async () => {
    app.listen(port, function () {
        console.log("== Server is running on port", port)
    })
})