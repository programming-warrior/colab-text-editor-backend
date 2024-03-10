const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const bcrypt = require('bcrypt');
const { MongoError,ObjectId } = require('mongodb');
const verifyToken = require('../middlewares/verifyToken');


router.post('/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    email = email.trim().length > 0 ? email.trim() : null;
    password = password.trim().length > 0 ? password.trim() : null;

    if (email && password) {
        req.db.collection('users').findOne({ email: email }).then(async (result) => {
            if (!result) return res.status(401).end();
            if (await bcrypt.compare(password, result.password)) {
                const accessToken = jwt.sign({ email }, process.env.SECRET_KEY);
                if (!accessToken) return res.status(500).end();

                res.status(201).json({
                    email: email,
                    token: accessToken,
                })
            }
            else {
                res.status(401).end();
                return;
            }
        }).catch(err => {
            if (err instanceof MongoError) res.status(500).end();
            return res.status(500).end();
        })

    }
})


router.post('/register', async (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    email = email.trim().length > 0 ? email.trim() : null;
    password = password.trim().length > 0 ? password.trim() : null;
    password = password ? await bcrypt.hash(password, 5) : null;

    if (email && password) {
        req.db.collection('users').insertOne({ email, password }).then(() => {

            const accessToken = jwt.sign({ email }, process.env.SECRET_KEY);

            if (!accessToken) return res.status(500).end();

            res.status(201).json({
                email: email,
                token: accessToken,
            })

        }).catch(err => {
            if (err instanceof MongoError) res.status(500).end();
            return res.status(500).end();
        })
    }
})



router.post('/share', verifyToken, async (req, res) => {
    const shareto = req.body.shareto;
    const document_id = req.body.document_id;
    const result = await req.db.collection('users').findOne({ email: shareto })

    if (result && Object.keys(result).length > 0) {
        const objectId = new ObjectId(document_id)
        const docDetails = await req.db.collection('documents').findOne({ _id: objectId });

        if(!docDetails) return res.status(404).end();

        docDetails['id']=docDetails['_id'];
        delete docDetails['_id'];

        await req.db.collection('sharedDocuemnts').insertOne({doc:{...docDetails},shareWith:result.email});
        res.status(201).end();
    }
    else {
        return res.status(404).end();
    }
})

router.get('/auth', verifyToken, async (req, res) => {
    try {
        const result = await req.db.collection('users').findOne({ email: req.email })
        if (!result) {
            return res.status(403).end();
        }

        return res.status(200).end();
    }
    catch (e) {
        return res.status(500).end();
    }

})

module.exports = router;