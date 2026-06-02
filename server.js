const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// DATABASE CONNECTION
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'inventaris'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }

    console.log('Connected to MySQL Database!');
});

// HEALTH CHECK
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'Inventaris API Running'
    });
});

// GET USERS
app.get('/api/users', (req, res) => {

    const query = `
        SELECT id, nama, email, role
        FROM users
        WHERE role != 'admin'
    `;

    db.query(query, (err, results) => {

        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            data: results
        });

    });

});

// TAMBAH USER
app.post('/api/users', async (req, res) => {

    const { nama, email, password, role } = req.body;

    try {

        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO users
            (nama, email, password, role)
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            query,
            [nama, email, hashedPassword, role],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        error: err.message
                    });
                }

                res.json({
                    success: true,
                    message: 'User berhasil ditambahkan'
                });

            }
        );

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});

// EDIT USER
app.put('/api/users/:id', async (req, res) => {

    const { id } = req.params;

    const {
        nama,
        email,
        role
    } = req.body;

    const query = `
        UPDATE users
        SET
            nama = ?,
            email = ?,
            role = ?
        WHERE id = ?
    `;

    db.query(
        query,
        [
            nama,
            email,
            role,
            id
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'User berhasil diupdate'
            });

        }
    );

});

// DETAIL USER
app.get('/api/users/:id', (req, res) => {

    const { id } = req.params;

    db.query(
        'SELECT id,nama,email,role FROM users WHERE id = ?',
        [id],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false
                });
            }

            res.json({
                success: true,
                data: results[0]
            });

        }
    );

});

// HAPUS USER
app.delete('/api/users/:id', (req, res) => {

    const { id } = req.params;

    const query = `
        DELETE FROM users
        WHERE id = ?
        AND role != 'admin'
    `;

    db.query(query, [id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            message: 'User berhasil dihapus'
        });

    });

});

// CREATE ROOM
app.post('/api/rooms', (req, res) => {

    const { nama_ruangan, lokasi } = req.body;

    if (!nama_ruangan || !lokasi) {
        return res.status(400).json({
            success: false,
            message: 'Semua field wajib diisi'
        });
    }

    const query = `
        INSERT INTO rooms
        (nama_ruangan, lokasi)
        VALUES (?, ?)
    `;

    db.query(
        query,
        [nama_ruangan, lokasi],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            return res.status(201).json({
                success: true,
                message: 'Ruangan berhasil ditambahkan',
                room_id: result.insertId
            });

        }
    );

});

// Rooms
app.get('/api/rooms', (req, res) => {

    db.query(
        'SELECT * FROM rooms',
        (err, results) => {

            if(err){
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(results);
        }
    );

});

// DETAIL ROOM
app.get('/api/rooms/:id', (req, res) => {

    const { id } = req.params;

    db.query(
        'SELECT * FROM rooms WHERE id = ?',
        [id],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success:false
                });
            }

            res.json({
                success:true,
                data:results[0]
            });

        }
    );

});

// UPDATE ROOM
app.put('/api/rooms/:id', (req, res) => {

    const { id } = req.params;

    const {
        nama_ruangan,
        lokasi
    } = req.body;

    const query = `
        UPDATE rooms
        SET
            nama_ruangan = ?,
            lokasi = ?
        WHERE id = ?
    `;

    db.query(
        query,
        [
            nama_ruangan,
            lokasi,
            id
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success:false,
                    error:err.message
                });
            }

            res.json({
                success:true
            });

        }
    );

});

// DELETE ROOM
app.delete('/api/rooms/:id', (req, res) => {

    const { id } = req.params;

    db.query(
        'DELETE FROM rooms WHERE id = ?',
        [id],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success:false
                });
            }

            res.json({
                success:true
            });

        }
    );

});


// LOGIN
app.post('/api/login', (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email dan password wajib diisi'
        });
    }

    const query = `
        SELECT *
        FROM users
        WHERE email = ?
    `;

    db.query(
        query,
        [email],
        async (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Email tidak ditemukan'
                });
            }

            const user = results[0];

            try {

                const passwordMatch = await bcrypt.compare(
                    password,
                    user.password
                );

                if (!passwordMatch) {
                    return res.status(401).json({
                        success: false,
                        message: 'Password salah'
                    });
                }

                const token = jwt.sign(
                    {
                        id: user.id,
                        role: user.role
                    },
                    process.env.JWT_SECRET || 'inventaris_secret_key',
                    {
                        expiresIn: '1d'
                    }
                );

                return res.json({
                    success: true,
                    message: 'Login berhasil',
                    token,
                    user: {
                        id: user.id,
                        nama: user.nama,
                        email: user.email,
                        role: user.role
                    }
                });

            } catch (error) {

                return res.status(500).json({
                    success: false,
                    error: error.message
                });

            }

        }
    );

});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});