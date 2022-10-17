const express = require('express')
const router = express.Router()

const results = require('../db/results-data.json')
const table = require('../db/table-data.json')
const fixtures = require('../db/fixtures-data.json')
const comments = require('../db/comments-data.json')

const axios = require('axios');
const roles = require('../models/roles')

const { expressjwt: jwt } = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const jwtAuthz = require('express-jwt-authz');

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

// , customUserKey: 'auth' LOCAL TESTING
const checkAdminPermissions = jwtAuthz(['delete:comments', 'edit:result', 'add:result'], { customScopeKey: 'permissions', customUserKey: 'auth' });
const checkUserPermissions = jwtAuthz([
    "delete:comment",
    "edit:comment"
], { customScopeKey: 'permissions', customUserKey: 'auth' });


router.get('/', (req, res) => {
    const leagueData = {
        table,
        results,
        fixtures
    }
    res.json(leagueData)
})

router.get('/role/user', checkJwt, checkUserPermissions, (req, res) => {
    res.json(roles.User)
})

router.get('/role/admin', checkJwt, checkAdminPermissions, (req, res) => {
    res.json(roles.Admin)
})

router.get('/comments', checkJwt, (req, res) => {
    res.json(comments)
})

router.post('/comments', checkJwt, checkUserPermissions, (req, res) => {
    const newComment = req.body;

    comments.sort((a, b) => a.commentId - b.commentId);
    const lastCommentId = comments[comments.length - 1].commentId

    newComment.commentId = lastCommentId + 1;
    comments.push(newComment)

    res.json(comments)
})


// User can edit only his mails
router.put('/comments', checkJwt, checkUserPermissions, async (req, res) => {
    const editedComment = req.body

    const accessToken = req.headers.authorization.split(" ")[1]

    const userData = await axios.get(`https://${authConfig.domain}/userinfo`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })

    if (editedComment.email !== userData.data.email) {
        res.status(403).json({ error: "You can not change others comments" })
        return
    }

    // Test it with email that acctually made comment also add this to delete
    for (const comment of comments) {
        if (comment.commentId === Number(editedComment.commentId)
            && comment.email === editedComment.email
            && comment.resultId === Number(editedComment.resultId)) {
            comment.date = editedComment.date;
            comment.text = editedComment.text;
            res.json(comments)
            return;
        }
    }

    res.status(404).json({ error: "This comment not found or you are not the person who wrote it" })


})

// User can delete only his mails
router.delete('/comments', checkJwt, checkUserPermissions, async (req, res) => {
    const commentId = Number(req.query.id)

    const accessToken = req.headers.authorization.split(" ")[1]

    const userData = await axios.get(`https://${authConfig.domain}/userinfo`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })

    comments.sort((a, b) => a.commentId - b.commentId);

    for (const index in comments) {
        if (comments[index].commentId === commentId) {
            if (comments[index].email !== userData.data.email) {
                res.status(403).json({ error: "You can not delete others comments" })
                return
            }
            comments.splice(index, 1)
            break;
        }
    }

    res.json(comments)
})

// Admin can delete any comment
router.delete('/comments/any', checkJwt, checkAdminPermissions, (req, res) => {
    const commentId = Number(req.query.id)

    comments.sort((a, b) => a.commentId - b.commentId);

    for (const index in comments) {
        if (comments[index].commentId === commentId) {
            comments.splice(index, 1)
            break;
        }
    }

    res.json(comments)
})

router.post('/results', checkJwt, checkAdminPermissions, (req, res) => {
    const newResult = req.body

    if (newResult.firstTeamId != null
        && newResult.secondTeamId != null
        && newResult.firstTeamScore != null
        && newResult.secondTeamScore != null
        && newResult.firstTeamId != newResult.secondTeamId) {
        results.sort((a, b) => a.resultId - b.resultId);
        const lastResultId = results[results.length - 1].resultId

        newResult.resultId = lastResultId + 1;
        results.push(newResult)

        res.json(results)
    }
    else {
        res.json({ error: "All data was not provided or team id's are the same" })
    }
})


router.put('/results', checkJwt, checkAdminPermissions, (req, res) => {
    const editedResult = req.body

    // Test it with email that acctually made comment also add this to delete
    for (const result of results) {
        if (result.resultId === Number(editedResult.resultId)) {
            result.firstTeamId = editedResult.firstTeamId;
            result.secondTeamId = editedResult.secondTeamId;
            result.firstTeamScore = editedResult.firstTeamScore;
            result.secondTeamScore = editedResult.secondTeamScore;
            break;
        }
    }

    res.json(results)
})

module.exports = router