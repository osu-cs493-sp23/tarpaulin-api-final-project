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
	studentid: {
		type: Schema.Objectid,
		required: false
	}
});

exports.Course = mongoose.model('Course', courseSchema)
