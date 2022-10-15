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

router.get('/comments', checkJwt, (req, res) => {
    res.json(comments)
})

router.post('/comments', checkJwt, (req, res) => {
    const newComment = req.body;

    comments.sort((a, b) => a.commentId - b.commentId);
    const lastCommentId = comments[comments.length - 1].commentId

    newComment.commentId = lastCommentId + 1;
    comments.push(newComment)

    res.json(comments)
})

router.put('/comments', checkJwt, (req, res) => {
    const commentId = Number(req.query.id)
    console.log(commentId, req.body)
    res.json(comments)
})

router.delete('/comments', checkJwt, (req, res) => {
    const commentId = Number(req.query.id)

    comments.sort((a, b) => a.commentId - b.commentId);

    for (const index in comments) {
        console.log(commentId, comments[index].commentId)
        if (comments[index].commentId === commentId) {
            comments.splice(index, 1)
            break;
        }
    }

    res.json(comments)
})

module.exports = router