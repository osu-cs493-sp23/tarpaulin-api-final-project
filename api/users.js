const { Router } = require('express')
const router = Router()

const mongoose = require('mongoose')
const { Schema } = mongoose

const {
	userSchema,
	insertNewUser,
	validateUser,
	getUserById,
	getUserByEmail
} = require('../model/user')

router.post('/', validateUserOptional, async function(req, res, next){
	try{
		const validationError = req.validateSync()
		if(validationError){
			res.status(400).send( { error: validationError.message } )
		}
		const user = req.body

		if( ((user.role === 'admin') || (user.role === 'instructor')) && (req.role != 'admin')){
			res.status(403).send({ error: "Only admins can create admin/instructor accounts." })
		}
		const id = await insertNewUser(user)
		res.status(200).send( { _id: id } )
	}catch(err){
		res.status(400).send( { err: err } )
	}
})

router.post('/login', async function (req, res, next) {
	if(req.body && req.body.email && req.body.password){
		try{
			const authenticated = await validateUser(
				req.body.email,
				req.body.password
			)
			const user = await getUserByEmail(req.body.email)
			console.log('user.admin', user.admin)
			if(authenticated) {
				const token = generateAuthToken(authenticated, user.role)
				res.status(200).send({
					token: token
				})
			}else {
				res.status(401).send({
					error: "Invalid authentication credentials"
				})
			}
		}catch(err) {
			next(err)
		}
	}else{
		res.status(400).send({
			error: "Request body requires `id` and `password`."
		})
	}
});
