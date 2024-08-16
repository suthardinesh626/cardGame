// index.js
import express from 'express';
import pg from 'pg';
import cors from 'cors';

const { Pool } = pg;

const app = express();

// PostgreSQL connection setup
const pool = new Pool({
    user: 'data_analytics_user',
    host: 'gamesoye-prototype-instance-1.chusisouy0v9.eu-north-1.rds.amazonaws.com',
    database: 'go_prototype',
    password: '4J1bjiHp3y',
    port: 5432,
});

// const pool = new Pool({
//     user: 'data_analytics_user',
//     host: 'eongames-prototype.chusisouy0v9.eu-north-1.rds.amazonaws.com',
//     database: 'postgres',
//     password: '4J1bjiHp3y',
//     port: 5432,
// });
// just show what data is inside this database data_analytics_user

app.use(cors());
app.use(express.json()); // To parse JSON bodies


// app.get('/api/users', async (req, res) => {
//     try {
//         const result = await pool.query('SELECT * FROM dev_db_go_prototype.go_boli_user_master');
//         res.json(result.rows);
//     } catch (err) {
//         console.error('Error executing query:', err.stack);
//         res.status(500).send('Server Error');
//     }
// });
// Route to get users
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM dev_db_go_prototype.go_boli_user_master');
        res.json(result.rows);
    } catch (err) {
        console.error('Error executing query:', err.stack);
        res.status(500).send('Server Error');
    }
});

// app.get('/api/playerCard', async (eq, res) => {
//     try {
//         const result = await pool.query('select * FROM ')
//     } catch (error) {
        
//     }
// })

app.patch('/api/updateWallet', async (req, res) => {
    const { email, amount } = req.body;

    if (!email || amount === undefined) {
        return res.status(400).send('Email and amount are required');
    }

    try {
        // Fetch current wallet balances
        const result = await pool.query(
            'SELECT wallet_balance, current_wallet_balance FROM dev_db_go_prototype.go_boli_user_master WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(404).send('User not found');
        }

        const user = result.rows[0];
        const newWalletBalance = user.wallet_balance + amount;
        const newCurrentWalletBalance = user.current_wallet_balance + amount;

        // Update wallet balances
        await pool.query(
            `UPDATE dev_db_go_prototype.go_boli_user_master 
             SET wallet_balance = $1, current_wallet_balance = $2 
             WHERE email = $3`,
            [newWalletBalance, newCurrentWalletBalance, email]
        );

        res.status(200).send('Wallet balances updated successfully');
    } catch (err) {
        console.error('Error executing query:', err.stack);
        res.status(500).send('Server Error');
    }
});

app.post('/api/login', async (req, res) => {
    const { name, email } = req.body;
    console.log("user details:", name, email)

    if (!name || !email) {
        return res.status(400).send('Name and email are required');
    }

    try {

        const result = await pool.query(
            'SELECT * FROM dev_db_go_prototype.go_boli_user_master WHERE name = $1 AND email = $2',
            [name, email]
        );

        if (result.rows.length === 0) {
            return res.status(404).send('User not found');
        }

        // Return user details
        const user = result.rows[0];
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            photo: user.photo,
            role: user.role,
            wallet_balance: user.wallet_balance,
            current_wallet_balance: user.current_wallet_balance,
            games_played: user.games_played,
            name_entry: user.name_entry,
        });

    } catch (err) {
        console.error('Error executing query:', err.stack);
        res.status(500).send('Server Error');
    }
});

app.post('/api/register', async (req, res) => {
    const { name, email, wallet_balance } = req.body;

    // Validate required fields
    if (!name || !email) {
        return res.status(400).send('Name and email are required');
    }

    // Set default wallet balance if not provided
    const userWalletBalance = wallet_balance !== undefined ? wallet_balance : 300;

    try {
        // Check if user already exists
        const checkResult = await pool.query(
            'SELECT * FROM dev_db_go_prototype.go_boli_user_master WHERE email = $1',
            [email]
        );

        if (checkResult.rows.length > 0) {
            return res.status(409).send('User with this email already exists');
        }

        // Insert new user into the database with the wallet balance
        const result = await pool.query(
            `INSERT INTO dev_db_go_prototype.go_boli_user_master (name, email, wallet_balance) 
             VALUES ($1, $2, $3) RETURNING id, name, email, wallet_balance`,
            [name, email, userWalletBalance]
        );

        const newUser = result.rows[0];
        res.status(201).json(newUser);
    } catch (err) {
        console.error('Error executing query:', err.stack);
        res.status(500).send('Server Error');
    }
});





// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
