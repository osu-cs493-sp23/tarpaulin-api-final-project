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

exports.removeStudentsFromRoster = async function (id, students) {
	try {
		const result = await Course.findByIdAndUpdate(id, { $pull: { roster: { $in: students } } }, { new: true })
		return result
	}
	catch (e) {
		return e
	}
}

exports.getInstructorCourses = async function (instructorId) {
	const instructorCourses = await Course.find({ instructorid: instructorId })
	return instructorCourses
}

exports.getStudentCourses = async function (studentId) {
	const studentCourses = await Course.find({ rooster: { $in: [studentId] } }).select({ _id: 1 })
	return studentCourses
}

exports.isEnrolled = async function (studentId, courseId) {
	const course = await Course.findById(courseId)
	if (course && course.roster.includes(studentId)) {
		return true
	}
	else {
		return false 
	}
}