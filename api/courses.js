const { Router } = require('express')

const { Course, addStudentsToRoster, removeStudentsToRoster } = require('../models/course')
const { convertRosterToCSV } = require('../models/user')
const { getUserById } = require('../models/user')
const { requireAuthentication } = require("../lib/auth")
const { getDbReference } = require("../lib/mongo")
const { Assignment } = require("../models/assignment")

const router = Router()

/*
 * Fetch the list of all Courses
*/
router.get('/', async function (req, res, next) {

    try {
        const db = getDbReference()
        const collection = db.collection("courses")

        /*
         * Compute page number based on optional query string parameter `page`.
         * Make sure page is within allowed bounds.
        */
        let page = parseInt(req.query.page) || 1
        const numPerPage = 10;
        const numOfBusinesses = await collection.count()
        const lastPage = Math.ceil(numOfBusinesses / numPerPage);
        page = page > lastPage ? lastPage : page;
        page = page < 1 ? 1 : page;

        // Gather query parameters from request
        const queryParams = {
            "subject": req.query.subject || null, 
            "number": req.query.number || null, 
            "term": req.query.term || null
        }

        // Remove any null fields
        for (query in queryParams) {
            if (queryParams[query] === null) {
                delete queryParams[query]
            }
        }

        /*
         * Calculate starting and ending indices of courses on requested page and
         * slice out the corresponsing sub-array of courses.
        */
        const start = (page - 1) * numPerPage;
        const end = start + numPerPage;

        /*
         * Generate HATEOAS links for surrounding pages.
        */
        const links = {};
        if (page < lastPage) {
            links.nextPage = `/courses?page=${page + 1}`;
            links.lastPage = `/courses?page=${lastPage}`;
        }
        if (page > 1) {
            links.prevPage = `/courses?page=${page - 1}`;
            links.firstPage = '/courses?page=1';
        }

        // Collect a page of courses without their MongoDB IDs
        const pageCourses = await collection.find(queryParams, { projection: { _id: 0 }})
            .skip(start)
            .limit(numPerPage)
            .toArray()

        /*
         * Construct and send response.
        */
        res.status(200).json({
            courses: pageCourses,
            pageNumber: page,
            totalPages: lastPage,
            pageSize: numPerPage,
            totalCount: pageCourses.length,
            links: links
        })
    }
    catch (e) {
        next(e)
    }
})

/*
 * Create a new course
*/
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

/*
 * Fetch data about a specific Course
*/
router.get('/:courseid', async function (req, res, next) {
    const courseId = req.params.courseid
    try {
        const course = await Course.findById(courseId)

        if (course) {
            res.status(200).send(course)
        }
        else {
            next()
        }
    }
    catch (e) {
        next(e)
    }
})


/*
 * Update data for a specific Course
*/
router.patch('/:courseid', requireAuthentication, async function (req, res, next) {
    const courseid = req.params.courseid
    const course = await Course.findById(courseid)
    const options = { new: true }

    if (req.user === course.instructorid.toString() || req.role === "admin") {
        try {
            const courseToUpdate = await Course.findByIdAndUpdate(courseid, req.body, options)
            if (courseToUpdate) {
                res.status(200).send(courseToUpdate)
            }
            else {
                next()
            }
        }
        catch (e) {
            next(e)
        }
    }
    else {
        res.status(403).send({
            err: "Unauthorized to edit for another user."
        })
    }
})

/*
 * Remove a specific Course from the database
*/
router.delete('/:courseid', requireAuthentication, async function (req, res, next) {
    const courseId = req.params.courseid
    const course = await Course.findById(courseId)

    if (req.role === "admin") {
        try {
            const courseToDelete = await Course.findByIdAndDelete(courseId);
            if (courseToDelete) {
                res.status(204).send()
            }
            else {
                next()
            }
        }
        catch (e) {
            next(e)
        }
    }
    else {
        res.status(403).send({
            err: "Unauthorized to delete for another user."
        })
    }
})

/*
 * Fetch a list of the students enrolled in the Course
*/
router.get('/:courseid/students', requireAuthentication, async function (req, res, next) {
    const courseId = req.params.courseid
    const course = await Course.findById(courseId)
    if (req.user === course.instructorid.toString() || req.role === "admin") {
        try {
            let students = []
            for (const id of course.roster) {
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
            err: "Unauthorized to update roster."
        })
    }
})

/*
 * Update enrollment for a Course
*/
router.post('/:courseid/students', requireAuthentication, async function (req, res, next) {
    const courseId = req.params.courseid
    const course = await Course.findById(courseId)
    if (req.user === course.instructorid.toString() || req.role === "admin") {
        try {
            let updatedRoster = null
            if (req.body.add) {
                updatedRoster = addStudentsToRoster(courseId, req.body.add)
            }
            if (req.body.remove) {
                updatedRoster = removeStudentsToRoster(courseId, req.body.remove)
            }
            res.status(200).send({ message: "Successfully updated roster!" })
        }
        catch (e) {
            res.status(400).send({ error: e.message })
        }
    }
    else {
        res.status(403).send({
            err: "Unauthorized to update roster."
        })
    }
})


/*
 * Fetch a CSV file containing list of the students enrolled in the Course
*/
router.get('/:courseid/roster', requireAuthentication, async function (req, res, next) {
    const courseId = req.params.courseid
    
    const course = await Course.findById(courseId)
    if (req.user === course.instructorid.toString() || req.role === "admin") {
        try {
            const students = await convertRosterToCSV(course.roster)
            res.status(200).type('text/csv').send(students)
        } catch (e) {
            next(e)
        }
    }
})

/*
 * Fetch a list of the Assignments for the Course
*/
router.get('/:courseid/assignments', async function (req, res, next) {
    const courseId = req.params.courseid    

    const course = await Course.findById(courseId)
    try {
        const assignments = await Assignment.find( { courseid: courseId } )
        res.status(200).send(assignments)
    } catch (e) {
        next(e)
    }

})


module.exports = router