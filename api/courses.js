const { Router } = require('express')

const { Course, addStudentsToRooster, removeStudentsToRooster } = require('../models/course')
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

    if (user.role !== "instructor") {
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





router.get('/:courseid/students', requireAuthentication, async function (req, res, next) {
    const courseId = req.params.courseid
    const course = await Course.findById(courseId)
    if (req.user === course.instructorid.toString() || req.role === "admin") {
        try {
            let students = []
            for (const id of course.rooster) {
                const student = await getUserById(id)
                students.push(student)
            }

            res.status(200).send({
                students: students
            })
        }
        catch (e) {
            res.status(400).send({ error: e.message })
        }
    }
    else {
        res.status(403).send({
            err: "Unauthorized to update rooster."
        })
    }
})

router.post('/:courseid/students', requireAuthentication, async function (req, res, next) {
    const courseId = req.params.courseid
    const course = await Course.findById(courseId)
    if (req.user === course.instructorid.toString() || req.role === "admin") {
        try {
            let updatedRooster = null
            if (req.body.add) {
                updatedRooster = addStudentsToRooster(courseId, req.body.add)
            }
            if (req.body.remove) {
                updatedRooster = removeStudentsToRooster(courseId, req.body.remove)
            }
            res.status(200).send({ message: "Successfully updated roster!" })
        }
        catch (e) {
            res.status(400).send({ error: e.message })
        }
    }
    else {
        res.status(403).send({
            err: "Unauthorized to update rooster."
        })
    }
})

module.exports = router