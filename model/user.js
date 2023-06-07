const mongoose = require('mongoose')
const { Schema } = mongoose

const bcrypt = require('bcrypt')

const userSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	role: {
		type: String,
		required: true,
		enum: ['admin', 'student', 'instructor']
	}
});
const User = mongoose.model('User', userSchema)

exports.getUserByEmail = async function(email, includePassword){
	try {
		const projection = includePassword ? {} : { password: 0 };
		const user = await User.findOne({ email : email }).select(projection).exec();
		return user;
	} catch (error) {
		console.error(error);
		return null;
	}
}

exports.insertNewUser = async function(user){
	try{
		const validationError = user.validateSync()
		if(validationError){
			res.status(400).send({ error: validationError.message })
		}

		let userToInsert = user
		const hash = await bcrypt.hash(user.password, 10)
		user.password = hash
		const newUser = await User.create(userToInsert)
		return newUser._id
	}catch(err){
		console.log(err)
		throw err
	}
}


exports.User = mongoose.model('User', userSchema)
