const mongoose = require('mongoose')
const { Schema } = mongoose

const submissionSchema = new Schema({
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

exports.Submission = mongoose.model('Submission', submissionSchema)