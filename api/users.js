const { Router } = require('express')
const router = Router()

const { requireAuthentication } = require("../lib/auth")

const { insertNewUser } = require('../model/user')

router.post('/', requireAuthentication, async function(req, res, next){
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
