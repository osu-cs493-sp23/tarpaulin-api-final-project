const jwt = require('jsonwebtoken')

const secretKey = "SuperSecret"

exports.generateAuthToken = function (userId, role) {
	const payload = {
		sub: userId,
		role: role
	}
	return jwt.sign(payload, secretKey, { expiresIn: "24h" })
}

exports.requireAuthentication = function (req, res, next) {
	const authHeader = req.get("Authorization")
	if (authHeader) {
		const authHeaderParts = authHeader.split(" ")
		const token = authHeaderParts[0] === "Bearer" ? authHeaderParts[1] : null
		try {
			const payload = jwt.verify(token, secretKey)
			req.user = payload.sub
			req.role = payload.role
			next()
		}
		catch (e) {
			console.error("Error verifying token: ", e)
			res.status(401).send({
				error: "Invalid authentication token"
			})
		}
	}
	else {
		next()
    }
}

exports.checkRole = function (req, res, next) {
	const authHeader = req.get("Authorization")
	if (authHeader) {
		const authHeaderParts = authHeader.split(" ")
		const token = authHeaderParts[0] === "Bearer" ? authHeaderParts[1] : null
		try {
			const payload = jwt.verify(token, secretKey)
			return payload.role
		}
		catch (e) {
			return false
		}
    }
}
