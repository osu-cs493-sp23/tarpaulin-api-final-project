const { Router } = require('express')
const router = Router()

const {
	User,
	insertNewUser,
	validateUser,
	getUserByEmail,
	getInstructorCourses,
	getStudentCourses
} = require('../models/user')

const { generateAuthToken, requireAuthentication, checkRole } = require('../lib/auth')

router.post('/', async function (req, res, next) {
	if (req.body.role === "student" || (checkRole(req) === "admin" && (req.body.role === "admin" || req.body.role === "instructor"))) {
		try {
			const user = await insertNewUser(req.body)
			const validationError = user.validateSync()
			if (validationError) {
				res.status(400).send({ error: validationError.message })
			}

			res.status(201).send({ _id: user._id })
		}
		catch (err) {
			res.status(400).send({ err: err })
		}
	}
	else {
		res.status(403).send({ error: "Only admins can create admin/instructor accounts." })
    }
})

router.post('/login', async function (req, res, next) {
	if (req.body && req.body.email && req.body.password) {
		try {
			const authenticated = await validateUser(
				req.body.email,
				req.body.password
			)
			console.log("authenticated", authenticated)
			const user = await getUserByEmail(req.body.email)
			if (authenticated) {
				const token = generateAuthToken(authenticated, user.role)
				res.status(201).send({
					token: token
				})
			} else {
				res.status(401).send({
					error: "Invalid authentication credentials"
				})
			}
		} catch (err) {
			next(err)
		}
	} else {
		res.status(400).send({
			error: "Request body requires `email` and `password`."
		})
	}
});

router.get('/:userid', requireAuthentication, async function( req, res, next ){
	const userId = req.params.userid
	const user = await User.findById(userId)
	if (req.user === userId || req.role === 'admin') {
		try {
			if ((req.role === 'instructor' || req.role === 'admin') && user.role === 'instructor') {
				const instructorCourses = await getInstructorCourses(userId)
				return res.status(200).send({
					user,
					coursestaught: instructorCourses || "No courses taught"
				})
			}
			if ((req.role === 'student' || req.role === 'admin') && user.role === 'student') {
				const studentCourses = await getStudentCourses(userId)
				return res.status(200).send({
					user,
					coursestaken: studentCourses || "No courses taken"
				})
			}
		}catch(err) {
			console.error(err)
		}
	}else {
		res.status(403).send({
			error: "Unauthorized accessed to data."
		})
	}
})

module.exports = router
