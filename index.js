// Required packages
const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Express setup
const app = express();
app.use(express.json());
const port = 3000;

// Database connection setup
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


// RESTful routes

// GET - Fetch all reviews
app.get('/reviews', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM reviews');
    res.json(rows);
});

app.post('/reviews', async (req, res) => {
    const query = "INSERT INTO reviews (restaurant_name, review_text, rating) VALUES (?, ?, ?)";
    await pool.execute(query, [
        req.body.restaurant_name, 
        req.body.review_text, 
        req.body.rating]);
    res.sendStatus(200);
});

app.put('/reviews/:id', async (req, res) => {
    const id = req.params.id;
    const { restaurant_name, review_text, rating } = req.body;
    await pool.execute('UPDATE reviews SET restaurant_name = ?, review_text = ?, rating = ? WHERE id = ?', [restaurant_name, review_text, rating, id]);
    res.send('Review updated');
});

app.delete('/reviews/:id', async (req, res) => {
    const id = req.params.id;
    await pool.execute('DELETE FROM reviews WHERE id = ?', [id]);
    // res.send('Review deleted');
    res.json({
        "success": true
    });
});

/*
// POST - Add a new review
app.post('/reviews', express.json(), async (req, res) => {
    const { restaurant_name, review_text, rating, user_id } = req.body;
    const query = 'INSERT INTO reviews (restaurant_name, review_text, rating, user_id) VALUES (?, ?, ?, ?)';
    await pool.execute(query, [restaurant_name, review_text, rating, user_id]);
    res.status(201).send('Review added');
});

// PUT - Update a review
app.put('/reviews/:id', express.json(), async (req, res) => {
    const id = req.params.id;
    const { restaurant_name, review_text, rating } = req.body;
    await pool.execute('UPDATE reviews SET restaurant_name = ?, review_text = ?, rating = ? WHERE id = ?', [restaurant_name, review_text, rating, id]);
    res.send('Review updated');
});

// DELETE - Delete a review
app.delete('/reviews/:id', async (req, res) => {
    const id = req.params.id;
    await pool.execute('DELETE FROM reviews WHERE id = ?', [id]);
    res.send('Review deleted');
});
*/
// Start the server
app.listen(port, () => {
    console.log(`Server running on <http://localhost>:${port}`);
});
