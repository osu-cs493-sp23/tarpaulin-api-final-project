const mongoose = require('mongoose')
const { Schema } = mongoose
const { ObjectId } = require('mongodb')

const assignmentSchema = new Schema({
	courseid: {
		type: Schema.ObjectId,
		required: true
    },
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

exports.getSubmissionsByAssignmentId = async function (id) {
	const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "submissions" })
	if (!ObjectId.isValid(id)) {
		return null
	}
	else {
		const projection = { 'metadata.contentType': 1, 'metadata.studentid': 1, 'metadata.timestamp': 1, 'metadata.grade': 1, _id: 1 };
		const results = await bucket.find({ 'metadata.assignmentid': id }).project(projection).toArray()
		return results
	}
}