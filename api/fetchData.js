const express = require('express')
const router = express.Router()

const results = require('../db/results-data.json')
const table = require('../db/table-data.json')
const fixtures = require('../db/fixtures-data.json')
const comments = require('../db/comments-data.json')

const { expressjwt: jwt } = require("express-jwt");
const jwksRsa = require("jwks-rsa");

const authConfig = {
    domain: "dev-djm6hoiw.us.auth0.com",
    audience: "https://vue-web2-api.com"
};


const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`
    }),
    audience: authConfig.audience,
    issuer: `https://${authConfig.domain}/`,
    algorithms: ["RS256"]
});

router.get('/', (req, res) => {
    const leagueData = {
        table,
        results,
        fixtures
    }
    res.json(leagueData)
})

//secure this
router.get('/comments', checkJwt, (req, res) => {
    // check if user has permision to see comments
    res.json(comments)
})

module.exports = router