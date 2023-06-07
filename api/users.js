const { Router } = require('express')
const router = Router()

const {
	insertNewUser,
	validateUser,
	getUserByEmail
} = require('../models/user')

const { generateAuthToken, checkRole } = require('../lib/auth')

router.post('/', async function (req, res, next) {
	if (req.body.role === "student" || (checkRole(req) === "admin" && (req.body.role === "admin" || req.body.role === "instructor"))) {
		try {
			const user = await insertNewUser(req.body)
			const validationError = user.validateSync()
			if (validationError) {
				res.status(400).send({ error: validationError.message })
			}

			res.status(200).send({ _id: user._id })
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
				res.status(200).send({
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
			error: "Request body requires `id` and `password`."
		})
	}
});

module.exports = router