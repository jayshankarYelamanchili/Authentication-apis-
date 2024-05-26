// app.js
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('./database/db');
const authenticateToken = require("./middleware/authenticationToken")

const app = express();
const port = 3000;
const SECRET_KEY = 'your_secret_key';

app.use(bodyParser.json());


// Signup route
app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    const query = `INSERT INTO users (username, password) VALUES (?, ?)`;
    db.run(query, [username, hashedPassword], function(err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                return res.status(400).send({ message: 'User already exists' });
            }
            return res.status(500).send({ message: 'Database error' });
        }
        res.status(201).send({ message: 'User created successfully' });
    });
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = `SELECT * FROM users WHERE username = ?`;
    db.get(query, [username], (err, user) => {
        if (err) return res.status(500).send({ message: 'Database error' });
        if (!user) return res.status(404).send({ message: 'User not found' });

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).send({ message: 'Invalid password' });

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });

        res.status(200).send({ token });
    });
});

// User details route (protected)
app.get('/user', authenticateToken, (req, res) => {
    const query = `SELECT id, username FROM users WHERE id = ?`;
    db.get(query, [req.user.id], (err, user) => {
        if (err) return res.status(500).send({ message: 'Database error' });
        if (!user) return res.status(404).send({ message: 'User not found' });

        res.status(200).send(user);
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
