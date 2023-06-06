const mongoose = require('mongoose')
const { Schema } = mongoose

const assignmentSchema = new Schema({
	title: {
		type: String,
		required: true
	},
	points: {
		type: Number,
		required: true
	},
	due: {
		type: Date,
		required: true,
		default: Date.now
	}
});

exports.Assignment = mongoose.model('Assignment', assignmentSchema)