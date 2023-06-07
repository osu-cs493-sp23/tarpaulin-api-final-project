const { Router } = require('express')

const { Course } = require('../models/course')
const { getUserById } = require('../models/user')
const { requireAuthentication } = require("../lib/auth")

const router = Router()

router.post('/', requireAuthentication, async function (req, res, next) {
    const course = new Course(req.body)
    const validationError = course.validateSync();

    if (validationError) {
        res.status(400).send({ error: validationError.message })
    }

    const user = await getUserById(course.instructorid)

    if (user.role === "student") {
        res.status(403).send({
            err: "User is not an instructor."
        })
    }

    if (req.role === "admin") {
        try {
            await course.save()
            res.status(201).send({ id: course._id })
        }
        catch (e) {
            res.status(400).send({ error: e.message })
        }
    }
    else {
        res.status(403).send({
            err: "Unauthorized to create a new course."
        })
    }
})

module.exports = router