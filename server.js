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

    // Safely add foto_qr to items
    db.query("ALTER TABLE items ADD COLUMN foto_qr VARCHAR(255) NULL", (err) => {
        if (err && err.errno !== 1060) {
            console.error('Error adding foto_qr to items:', err.message);
        }
    });

    // Safely add registered_item_id to procurement_items
    db.query("ALTER TABLE procurement_items ADD COLUMN registered_item_id INT NULL", (err) => {
        if (err && err.errno !== 1060) {
            console.error('Error adding registered_item_id to procurement_items:', err.message);
        }
    });

    // Safely add approval_status to procurements
    db.query("ALTER TABLE procurements ADD COLUMN approval_status VARCHAR(50) DEFAULT 'pending'", (err) => {
        if (err && err.errno !== 1060) {
            console.error('Error adding approval_status to procurements:', err.message);
        }
    });
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

// ==========================================
// KEPALA LAB PROCUREMENT ENDPOINTS
// ==========================================

// GET ALL ITEMS (for replacement selection)
app.get('/api/items', (req, res) => {
    db.query('SELECT * FROM items', (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, data: results });
    });
});

// GET ALL PROCUREMENTS (optional filter by user_id)
app.get('/api/procurements', (req, res) => {
    const userId = req.query.user_id;
    let query = 'SELECT * FROM procurements';
    let params = [];
    if (userId) {
        query += ' WHERE user_id = ?';
        params.push(userId);
    }
    query += ' ORDER BY created_at DESC';
    
    db.query(query, params, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, data: results });
    });
});

// GET PROCUREMENT DETAIL WITH ITEMS
app.get('/api/procurements/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM procurements WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Procurement not found' });
        }
        const procurement = results[0];
        
        const itemsQuery = `
            SELECT pi.*, i.nama_barang as replaced_item_name 
            FROM procurement_items pi 
            LEFT JOIN items i ON pi.replaced_item_id = i.id 
            WHERE pi.procurement_id = ?
        `;
        db.query(itemsQuery, [id], (err, itemsResults) => {
            if (err) {
                return res.status(500).json({ success: false, error: err.message });
            }
            procurement.items = itemsResults;
            res.json({ success: true, data: procurement });
        });
    });
});

// POST CREATE PROCUREMENT
app.post('/api/procurements', (req, res) => {
    const { user_id, tahun_anggaran, items } = req.body;
    
    db.beginTransaction((err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        
        const procQuery = 'INSERT INTO procurements (user_id, tahun_anggaran, status) VALUES (?, ?, ?)';
        db.query(procQuery, [user_id, tahun_anggaran, 'draft'], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({ success: false, error: err.message });
                });
            }
            const procurementId = result.insertId;
            
            if (!items || items.length === 0) {
                return db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ success: false, error: err.message });
                        });
                    }
                    res.json({ success: true, message: 'Procurement draft created', id: procurementId });
                });
            }
            
            const itemQuery = `
                INSERT INTO procurement_items 
                (procurement_id, nama_barang, harga, jumlah, link_pembelian, is_replacement, replaced_item_id, status_item) 
                VALUES ?
            `;
            const values = items.map(item => [
                procurementId,
                item.nama_barang,
                item.harga,
                item.jumlah,
                item.link_pembelian,
                item.is_replacement ? 1 : 0,
                item.is_replacement ? item.replaced_item_id : null,
                'pending'
            ]);
            
            db.query(itemQuery, [values], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ success: false, error: err.message });
                    });
                }
                
                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ success: false, error: err.message });
                        });
                    }
                    res.json({ success: true, message: 'Procurement draft created with items', id: procurementId });
                });
            });
        });
    });
});

// PUT UPDATE PROCUREMENT
app.put('/api/procurements/:id', (req, res) => {
    const { id } = req.params;
    const { tahun_anggaran, items } = req.body;
    
    db.query('SELECT status FROM procurements WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Procurement not found' });
        }
        if (results[0].status === 'locked') {
            return res.status(400).json({ success: false, message: 'Cannot edit a locked draft' });
        }
        
        db.beginTransaction((err) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            
            db.query('UPDATE procurements SET tahun_anggaran = ? WHERE id = ?', [tahun_anggaran, id], (err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ success: false, error: err.message });
                    });
                }
                
                db.query('DELETE FROM procurement_items WHERE procurement_id = ?', [id], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ success: false, error: err.message });
                        });
                    }
                    
                    if (!items || items.length === 0) {
                        return db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ success: false, error: err.message });
                                });
                            }
                            res.json({ success: true, message: 'Procurement updated' });
                        });
                    }
                    
                    const itemQuery = `
                        INSERT INTO procurement_items 
                        (procurement_id, nama_barang, harga, jumlah, link_pembelian, is_replacement, replaced_item_id, status_item) 
                        VALUES ?
                    `;
                    const values = items.map(item => [
                        id,
                        item.nama_barang,
                        item.harga,
                        item.jumlah,
                        item.link_pembelian,
                        item.is_replacement ? 1 : 0,
                        item.is_replacement ? item.replaced_item_id : null,
                        'pending'
                    ]);
                    
                    db.query(itemQuery, [values], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ success: false, error: err.message });
                            });
                        }
                        
                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ success: false, error: err.message });
                                });
                            }
                            res.json({ success: true, message: 'Procurement updated with items' });
                        });
                    });
                });
            });
        });
    });
});

// PUT LOCK PROCUREMENT
app.put('/api/procurements/:id/lock', (req, res) => {
    const { id } = req.params;
    db.query("UPDATE procurements SET status = 'locked' WHERE id = ?", [id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, message: 'Procurement locked successfully' });
    });
});

// DELETE PROCUREMENT (only drafts)
app.delete('/api/procurements/:id', (req, res) => {
    const { id } = req.params;
    
    db.query('SELECT status FROM procurements WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Procurement not found' });
        }
        if (results[0].status !== 'draft') {
            return res.status(400).json({ success: false, message: 'Only draft procurements can be deleted' });
        }
        
        // Delete related items first to bypass foreign key constraint restrictions
        db.query('DELETE FROM procurement_items WHERE procurement_id = ?', [id], (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, error: err.message });
            }
            
            db.query('DELETE FROM procurements WHERE id = ?', [id], (err, result) => {
                if (err) {
                    return res.status(500).json({ success: false, error: err.message });
                }
                res.json({ success: true, message: 'Procurement draft deleted successfully' });
            });
        });
    });
});



// APPROVE PROCUREMENT
app.put('/api/procurements/:id/approve', (req, res) => {

    const { id } = req.params;

    db.query(
        "UPDATE procurements SET approval_status = 'approved' WHERE id = ?",
        [id],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'Draft berhasil disetujui'
            });

        }
    );

});

// REJECT PROCUREMENT
app.put('/api/procurements/:id/reject', (req, res) => {

    const { id } = req.params;

    db.query(
        "UPDATE procurements SET approval_status = 'rejected' WHERE id = ?",
        [id],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'Draft berhasil ditolak'
            });

        }
    );

});

// FINALIZE PROCUREMENT
app.put('/api/procurements/:id/finalize', (req, res) => {

    const { id } = req.params;

    db.query(
        "UPDATE procurements SET approval_status = 'finalized' WHERE id = ?",
        [id],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'Draft berhasil difinalisasi'
            });

        }
    );

});

// ==========================================
// STAF ADMIN API ENDPOINTS
// ==========================================

// RECEIVE PROCUREMENT ITEM
app.put('/api/procurement-items/:id/receive', (req, res) => {
    const { id } = req.params;
    const { tanggal_diterima } = req.body;
    db.query(
        "UPDATE procurement_items SET status_item = 'received', tanggal_diterima = ? WHERE id = ?",
        [tanggal_diterima, id],
        (err, result) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, message: 'Barang berhasil ditandai sebagai diterima' });
        }
    );
});

// GET ITEM BY ID
app.get('/api/items/:id', (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM items WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'Barang tidak ditemukan' });
        res.json({ success: true, data: results[0] });
    });
});

// CREATE NEW ITEM
app.post('/api/items', (req, res) => {
    const { room_id, uuid_qr, nama_barang, jenis, stok, status, foto_qr } = req.body;
    db.query(
        "INSERT INTO items (room_id, uuid_qr, nama_barang, jenis, stok, status, foto_qr) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [room_id, uuid_qr, nama_barang, jenis, stok, status, foto_qr],
        (err, result) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.status(201).json({ success: true, message: 'Barang berhasil didaftarkan ke inventaris', insertId: result.insertId });
        }
    );
});

// UPDATE EXISTING ITEM
app.put('/api/items/:id', (req, res) => {
    const { id } = req.params;
    const { room_id, uuid_qr, nama_barang, jenis, stok, status, foto_qr } = req.body;
    db.query(
        "UPDATE items SET room_id = ?, uuid_qr = ?, nama_barang = ?, jenis = ?, stok = ?, status = ?, foto_qr = ? WHERE id = ?",
        [room_id, uuid_qr, nama_barang, jenis, stok, status, foto_qr, id],
        (err, result) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, message: 'Barang inventaris berhasil diupdate' });
        }
    );
});

// DELETE ITEM
app.delete('/api/items/:id', (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM items WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: 'Barang inventaris berhasil dihapus' });
    });
});

// LINK PROCUREMENT ITEM TO REGISTERED ITEM ID
app.put('/api/procurement-items/:id/link-item', (req, res) => {
    const { id } = req.params;
    const { registered_item_id } = req.body;
    db.query(
        "UPDATE procurement_items SET registered_item_id = ? WHERE id = ?",
        [registered_item_id, id],
        (err, result) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, message: 'Item linked to registered_item_id' });
        }
    );
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});