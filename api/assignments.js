const { Router } = require('express')

const router = Router()

router.post('/', requireAuthentication, async function (req, res, next) {
    const business = new Business(req.body)
    const validationError = business.validateSync();

    if (validationError) {
        res.status(400).send({ error: validationError.message })
    }

    if (req.user === business.ownerid.toString() || req.admin) {
        try {
            await business.save()
            res.status(201).send({ id: business._id })
        }
        catch (e) {
            res.status(400).send({ error: e.message })
        }
    }
    else {
        res.status(403).send({
            err: "Unauthorized to post for another user."
        })
    }
})