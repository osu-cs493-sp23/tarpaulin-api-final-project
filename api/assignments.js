const { Router } = require('express')

const multer = require("multer")
const crypto = require("node:crypto")

const { Assignment } = require('../models/assignment')
const { Course } = require('../models/course')
const { Submission } = require('../models/submission')
const { User } = require('../models/user')
const { requireAuthentication } = require("../lib/auth")

const router = Router()

const fileTypes = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "application/zip": "zip"
}

const upload = multer({
    storage: multer.diskStorage({
        destination: `${__dirname}/uploads`,
        filename: (req, file, callback) => {
            const filename = crypto.pseudoRandomBytes(16).toString("hex")
            const extension = fileTypes[file.mimetype]
            callback(null, `${filename}.${extension}`)
        }
    }),
    fileFilter: (req, file, callback) => {
        callback(null, !!imageTypes[file.mimetype])
    }
})

router.post('/', requireAuthentication, async function (req, res, next) {
    const assignment = new Assignment(req.body)
    const validationError = assignment.validateSync();

    if (validationError) {
        res.status(400).send({ error: validationError.message })
    }

    const course = await Course.findById(assignment.courseid)

    if (req.user === course.instructorid.toString() || req.admin) {
        try {
            await assignment.save()
            res.status(201).send({ id: assignment._id })
        }
        catch (e) {
            res.status(400).send({ error: e.message })
        }
    }
    else {
        res.status(403).send({
            err: "Unauthorized to post for another user."
        })
    }
})

router.get('/:assignmentid', async function (req, res, next) {
    const assignmentId = req.params.assignmentid
    try {
        const assignment = await Business.findById(assignmentId)

        if (assignment) {
            res.status(200).send(assignment)
        }
        else {
            next()
        }
    }
    catch (e) {
        next(e)
    }
})

router.patch('/:assignmentid', requireAuthentication, async function (req, res, next) {
    const assignmentId = req.params.assignmentid
    const assignment = await Business.findById(assignmentId)
    const options = { new: true }

    const course = await Course.findById(assignment.courseid)

    if (req.user === course.instructorid.toString() || req.admin) {
        try {
            const assignmentToUpdate = await Assignment.findByIdAndUpdate(assignmentId, req.body, options)
            if (businessToUpdate) {
                res.status(200).send(assignmentToUpdate)
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

router.delete('/:assignmentid', requireAuthentication, async function (req, res, next) {
    const assignmentId = req.params.assignmentid
    const assignment = await Assignemnt.findById(assignmentId)
    const course = await Course.findById(assignment.courseid)

    if (req.user === course.instructorid.toString() || req.admin) {
        try {
            const assignmentToDelete = await Business.findByIdAndDelete(businessId);
            if (assignmentToDelete) {
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

router.get('/:assignmentid/submissions', requireAuthentication, async function (req, res, next) {
    const assignmentId = req.params.assignmentid
    const assignment = await Assignemnt.findById(assignmentId)
    const course = await Course.findById(assignment.courseid)

    if (req.user === course.instructorid.toString() || req.admin) {
        try {
            const result = await Submission.find({ assignemntid: assignmentId })

            let page = parseInt(req.query.page) || 1
            page = page < 1 ? 1 : page
            const numPerPage = 10
            const offset = (page - 1) * numPerPage

            const studentId = req.query.studentId || null

            const student = User.findById(studentId)

            if (!student) {
                next()
            }

            /*
            * Generate HATEOAS links for surrounding pages.
            */
            const lastPage = Math.ceil(result.length / numPerPage)

            const start = (page - 1) * numPerPage;
            const end = start + numPerPage;
            const pageAssignments = result.slice(start, end);

            const links = {}
            if (page < lastPage) {
                links.nextPage = `/assignments/${assignmentId}/submissions?page=${page + 1}`
                links.lastPage = `/assignments/${assignmentId}/submissions?page=${lastPage}`
            }
            if (page > 1) {
                links.prevPage = `/assignments/${assignmentId}/submissions?page=${page - 1}`
                links.firstPage = '/assignments/${assignmentId}/submissions?page=1'
            }

            /*
                * Construct and send response.
                */
            res.status(200).json({
                businesses: pageAssignments,
                pageNumber: page,
                totalPages: lastPage,
                pageSize: numPerPage,
                totalCount: result.length,
                links: links
            })
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

router.post('/:assignmentid/submissions', requireAuthentication, upload.single("submissions"), async function (req, res, next) {
    const assignmentId = req.params.assignmentid
    const submission = new Submission(req.body)
    const validationError = submission.validateSync()

    if (validationError) {
        res.status(400).send({ error: validationError.message })
    }

    if (submission.assignmentid === assignmentId) {
        res.status(400).send({ error: "Improper submission. Submitting for wrong assignment." })
    }

    if ((req.user === submission.studentid.toString() && req.role === "student") || req.admin) {
        try {
            await submission.save()
            res.status(201).send({ id: submission._id })
        }
        catch (e) {
            res.status(400).send({ error: e.message })
        }
    }
    else {
        res.status(403).send({
            err: "Unauthorized to post for another user."
        })
    }
})

module.exports = router