const express = require('express')
const path = require('path')
const dotenv = require('dotenv')
const fs = require('fs')
const https = require('https')

dotenv.config()

const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 4080
const app = express()


app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.send('Hello World!')
})

if (externalUrl) {
    const hostname = '127.0.0.1';
    app.listen(port, hostname, () => {
        console.log(`Server locally running at http://${hostname}:${port}/ and from
    outside on ${externalUrl}`);
    });
}
else {
    https.createServer({
        key: fs.readFileSync('server.key'),
        cert: fs.readFileSync('server.cert')
    }, app).listen(port, () => {
        console.log(`Server locally running at http://localhost:${port}`);
    });
}
