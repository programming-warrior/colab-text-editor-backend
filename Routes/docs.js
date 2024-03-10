const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { MongoError } = require('mongodb');
const verifyToken = require('../middlewares/verifyToken');
const generateUniqueId = require('../helperFunctions/generateUniqueId');


router.get('/docs', verifyToken, async (req, res) => {
    try {
        const documents = await req.db.collection('documents').find({ owner: req.email }).toArray();
        if (documents.length === 0) {
            return res.status(404).end();
        }

        documents.forEach(doc => {
            doc['id'] = doc['_id'];
            delete doc['_id'];
        })

        return res.status(200).json(documents);

    } catch (error) {

        console.error("Error occurred while fetching documents:", error);
        return res.status(500).end();

    }
})

router.get('/sharedDocs', verifyToken, async (req, res) => {
    try {
        const documents = await req.db.collection('sharedDocuemnts').find({ shareWith: req.email }).toArray();
        if (!documents || documents.length === 0) {
            return res.status(404).end();
        }

        documents.forEach(doc => {
            doc['id'] = doc['_id'];
            delete doc['_id'];
        })
        return res.status(200).json(documents);

    } catch (error) {
        console.error("Error occurred while fetching documents:", error);
        return res.status(500).end();
    }
})

router.post('/docs', verifyToken, async (req, res) => {
    try {
        const body = req.body;
        body['owner'] = req.email;
        body['title'] = 'Document' + new Date().getSeconds();
        const result = await req.db.collection('documents').insertOne({ ...body });
        if (!result) return res.status(500).end();
        const doc={}
        doc['id']=result['insertedId'];
        return res.status(201).json(doc);
    }
    catch (e) {
        return res.status(500).end();
    }
})




module.exports = router;