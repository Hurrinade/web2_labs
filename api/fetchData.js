const express = require('express')
const router = express.Router()

const results = require('../db/results-data.json')
const table = require('../db/table-data.json')
const fixtures = require('../db/fixtures-data.json')
const comments = require('../db/comments-data.json')

router.get('/', (req, res) => {

    const leagueData = {
        table,
        results,
        fixtures
    }
    res.json(leagueData)
})

//secure this
router.get('/comments', (req, res) => {
    // check if user has permision to see comments
    res.json(comments)
})

module.exports = router