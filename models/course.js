const mongoose = require('mongoose')
const { Schema } = mongoose

const courseSchema = new Schema({
	subject: {
		type: String,
		required: true
	},
	number: {
		type: String,
		required: true
	},
	title: {
		type: String,
		required: true
	},
	term: {
		type: String,
		required: true
	},
	instructorid: {
		type: Schema.ObjectId,
		required: true
	},
	rooster: {
		type: [Schema.ObjectId],
		default: [],
		required: false
    }
});

const Course = mongoose.model('Course', courseSchema)
exports.Course = Course

exports.addStudentsToRooster = async function (id, students) {
	try {
		const result = await Course.findByIdAndUpdate(id, { $push: { rooster: { $each: students } } }, { new: true })
		return result
	}
	catch(e) {
		return e
	}
}

exports.removeStudentsToRooster = async function (id, students) {
	try {
		const result = await Course.findByIdAndUpdate(id, { $pull: { rooster: { $in: students } } }, { new: true })
		return result
	}
	catch (e) {
		return e
	}
}