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
exports.User = User

const getUserByEmail = async function (email, includePassword) {
	try {
		const projection = includePassword ? {} : { password: 0 };
		const user = await User.findOne({ email: email }).select(projection).exec();
		return user;
	} catch (error) {
		console.error(error);
		return null;
	}
}
exports.getUserByEmail = getUserByEmail

exports.getUserById = async function (id, includePassword) {
	try {
		const projection = includePassword ? {} : { password: 0 };
		const user = await User.findById(id).select(projection).exec();
		return user;
	} catch (error) {
		console.error(error);
		return null;
	}

};

exports.insertNewUser = async function (user) {
	try {
		let userToInsert = user
		const hash = await bcrypt.hash(user.password, 10)
		user.password = hash
		const newUser = await User.create(userToInsert)
		return newUser
	} catch (err) {
		console.log(err)
		throw err
	}
}

exports.validateUser = async function (id, password) {
	const user = await getUserByEmail(id, true)
	if (user && await bcrypt.compare(password, user.password)) {
		console.log("- successful validation of user")
		return user._id
	} else {
		console.log("returned NULL")
		return null
	}
}

exports.getInstructorCourses = async function (instructorId) {
	try {

	} catch (err) {

	}
}

exports.getStudentCourses = async function (studentId) {
	try {
	} catch {
	}
}