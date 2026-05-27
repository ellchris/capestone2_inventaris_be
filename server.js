const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Ganti kode koneksi lo pake ini, King! Langsung ketik manual biar anti-bengong.
const db = mysql.createConnection({
    host: '127.0.0.1',             
    user: 'root',                  
    password: '',                  
    database: 'inventaris' 
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL Database!');
});

// ENDPOINT TEST: Ambil Data Users
app.get('/api/users', (req, res) => {
    db.query('SELECT id, nama, email, role FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ENDPOINT: Tambah Data Ruangan Baru
app.post('/api/rooms', (req, res) => {
    // Nangkep data dari laravel
    const { nama_ruangan, lokasi } = req.body;

    // Validasi simpel biar gak ada data kosong
    if (!nama_ruangan || !lokasi) {
        return res.status(400).json({ error: 'Semua field wajib diisi, King!' });
    }

    const query = 'INSERT INTO rooms (nama_ruangan, lokasi) VALUES (?, ?)';
    db.query(query, [nama_ruangan, lokasi], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Kembalikan respon sukses ke Laravel
        res.status(201).json({ 
            message: '✅ Ruangan berhasil ditambahkan!', 
            id: result.insertId 
        });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));