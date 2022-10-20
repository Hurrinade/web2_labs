const express = require('express')
const router = express.Router()

const results = require('../db/results-data.json')
const table = require('../db/table-data.json')
const fixtures = require('../db/fixtures-data.json')
const comments = require('../db/comments-data.json')

const axios = require('axios');
const roles = require('../models/roles')

const auth = require('../middleware/userRole')

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

// USER
router.get('/role/user', checkJwt, auth.checkUserRole, (req, res) => {
    res.json(roles.User)
})

router.get('/role/admin', checkJwt, auth.checkAdminRole, (req, res) => {
    res.json(roles.Admin)
})

router.get('/comments', checkJwt, (req, res) => {
    res.json(comments)
})

// USER
router.post('/comments', checkJwt, auth.checkUserRole, (req, res) => {
    try {
        const newComment = req.body;

        comments.sort((a, b) => a.commentId - b.commentId);
        const lastCommentId = comments[comments.length - 1].commentId

        newComment.commentId = lastCommentId + 1;
        comments.push(newComment)

        res.json(comments)
    } catch (err) {
        res.status(500).json({ error: "internal error" })
    }
})


// User can edit only his mails
router.put('/comments', checkJwt, auth.checkUserRole, async (req, res) => {
    try {
        const editedComment = req.body

        if (editedComment.email !== req.email) {
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
    } catch (err) {
        res.status(500).json({ error: "internal error" })
    }

})

// User can delete only his mails
router.delete('/comments', checkJwt, auth.checkUserRole, async (req, res) => {
    try {
        const commentId = Number(req.query.id)

        comments.sort((a, b) => a.commentId - b.commentId);

        for (const index in comments) {
            if (comments[index].commentId === commentId) {
                if (comments[index].email !== req.email) {
                    res.status(403).json({ error: "You can not delete others comments" })
                    return
                }
                comments.splice(index, 1)
                break;
            }
        }

        res.json(comments)

    } catch (err) {
        res.status(500).json({ error: "internal error" })
    }
})

// Admin can delete any comment
router.delete('/comments/any', checkJwt, auth.checkAdminRole, (req, res) => {
    try {
        const commentId = Number(req.query.id)

        comments.sort((a, b) => a.commentId - b.commentId);

        for (const index in comments) {
            if (comments[index].commentId === commentId) {
                comments.splice(index, 1)
                break;
            }
        }

        res.json(comments)

    } catch (err) {
        res.status(500).json({ error: "internal error" })
    }
})

router.post('/results', checkJwt, auth.checkAdminRole, (req, res) => {
    try {
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

    } catch (err) {
        res.status(500).json({ error: "internal error" })
    }
})


router.put('/results', checkJwt, auth.checkAdminRole, (req, res) => {
    try {
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

    } catch (err) {
        res.status(500).json({ error: "internal error" })
    }
})

module.exports = router