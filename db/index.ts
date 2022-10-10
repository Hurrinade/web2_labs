import { Pool, Client } from 'pg'
import dotenv from 'dotenv'
dotenv.config()


const client = new Client()
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'lab1',
    password: process.env.DB_PASSWORD,
    port: 5432,
    ssl: true
})

export async function query(queryString: string, values: any[]) {
    const res = await client.query(queryString, values)
    console.log(res.rows[0])
}

export async function getComments() {
    const comments: string[] = [];
    const results = await pool.query('SELECT id, comment from comments');
    results.rows.forEach(r => {
        comments.push(r["comment"]);
    });
    return comments;
}