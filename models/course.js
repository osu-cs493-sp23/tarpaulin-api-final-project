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
	roster: {
		type: [Schema.ObjectId],
		default: [],
		required: false
    }
});

const Course = mongoose.model('Course', courseSchema)
exports.Course = Course

exports.addStudentsToRoster = async function (id, students) {
	try {
		const result = await Course.findByIdAndUpdate(id, { $push: { roster: { $each: students } } }, { new: true })
		return result
	}
	catch(e) {
		return e
	}
}

exports.removeStudentsToRoster = async function (id, students) {
	try {
		const result = await Course.findByIdAndUpdate(id, { $pull: { roster: { $in: students } } }, { new: true })
		return result
	}
	catch (e) {
		return e
	}
}