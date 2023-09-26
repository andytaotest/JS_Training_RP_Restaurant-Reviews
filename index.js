// Required packages
const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
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

function generateToken(userId, role) {
    return jwt.sign({ id: userId, role: role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

function verifyToken(req, res, next) {
    // const token = req.headers.authorization; //JWT inside
    const token = req.headers.authorization.split(" ")[1]; //split because using insomnia and there's a bearer in front
    console.log(token);
    if (!token) {
        return res.status(403).send('No token provided');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send('Failed to authenticate token');
        }
        req.userId = decoded.id;
        req.role = decoded.role;
        next();
    });
}

// we assume verifyToken has been called on the request
function checkRole(roles) {
    return function(req,res,next) {
        // includes function exists on array
        // [1,2,3].includes(2) ==> true
        // [1,2,3].includes(-99) ==> false
        if (roles.includes(req.role)) {
            next();
        } else {
            return res.status(403).send("Permission denied");
        }
    }
}

// RESTful routes

// Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const [users] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = users[0];

    if (user && user.password === password) {
        const token = generateToken(user.id, user.role);
        res.json({ token });
    } else {
        res.status(401).send('Invalid credentials');
    }
});

// GET - Fetch all reviews
app.get('/reviews', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM reviews');
    res.json(rows);
});

app.post('/reviews', [verifyToken, checkRole(["admin", "editor"])], async (req, res) => {
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
