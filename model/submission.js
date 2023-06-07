const mongoose = require('mongoose')
const { Schema } = mongoose
const { ObjectId, GridFSBucket } = require('mongodb')

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
		type: Float,
		required: true
	},
	file: {
		type: String,
		required: true
	}

})

exports.Submission = mongoose.model('Submission', submissionSchema)

exports.saveSubmissionFile = async function (submission) {
	return new Promise(function (resolve, reject) {
		const db = getDbReference()
		const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "submissions" })
		const metadata = {
			assignmentid: submission.assignemntid,
			studentid: submission.studentid,
			timestamp: submission.timestamp,
			grade: submission.grade
		}
		const uploadStream = bucket.openUploadStream(
			submission.file,
			{ metadata: metadata }
		)
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