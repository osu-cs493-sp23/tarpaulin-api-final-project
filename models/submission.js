const mongoose = require('mongoose')
const { Schema } = mongoose
const { ObjectId } = require('mongodb')
const fs = require("fs")

const submissionSchema = new Schema({
	assignmentid: {
		type: Schema.ObjectId,
		required: true
	},
	studentid: {
		type: Schema.ObjectId,
		required: true
	},
	timestamp: {
		type: Date,
		required: true,
		default: Date.now
	},
	grade: {
		type: Number,
		required: true
	},
	submission: {
		type: String,
		required: true
	}

})

exports.Submission = mongoose.model('Submission', submissionSchema)

exports.saveSubmissionFile = async function (submission) {
	return new Promise(function (resolve, reject) {
		const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "submissions" })
		const metadata = {
			assignmentid: submission.assignmentid,
			studentid: submission.studentid,
			timestamp: submission.timestamp,
			grade: submission.grade,
			contentType: submission.contentType
		}
		const uploadStream = bucket.openUploadStream(
			submission.submission,
			{ metadata: metadata }
		)
		console.log("path", submission.path)

		fs.createReadStream(submission.path).pipe(uploadStream)
			.on("error", function (err) {
				reject(err)
			})
			.on("finish", function (result) {
				console.log("== write success, result:", result)
				resolve(result._id)
			})
	})
}

exports.getSubmissionsByAssignmentId = async function (id, studentId) {
	const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "submissions" })
	if (!ObjectId.isValid(id)) {
		return null
	}
	else {
		const query = { 'metadata.assignmentid': id };

		if (studentId) {
			query['metadata.studentid'] = studentId;
		}
		const projection = { 'metadata.contentType': 1, 'metadata.studentid': 1, 'metadata.timestamp': 1, 'metadata.grade': 1, _id: 1 };
		const results = await bucket.find(query).project(projection).toArray()
		return results
	}
}