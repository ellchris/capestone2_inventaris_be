const mysql = require('mysql2');

const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'inventaris'
});

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    
    console.log('Connected to Database!');
    
    const items = [
        [1, 'ITEM-001', 'PC Lenovo ThinkCentre', 'inventaris', null, 'baik'],
        [1, 'ITEM-002', 'Monitor LG 24 Inch', 'inventaris', null, 'baik'],
        [1, 'ITEM-003', 'Keyboard Logitech K120', 'inventaris', null, 'baik'],
        [2, 'ITEM-004', 'Proyektor Epson', 'inventaris', null, 'rusak'],
        [3, 'ITEM-005', 'Router Mikrotik RB951', 'inventaris', null, 'baik']
    ];
    
    // Clear existing items first to avoid duplicate errors if run multiple times
    db.query('DELETE FROM items', (err) => {
        if (err) {
            console.error('Clear failed:', err);
            db.end();
            return;
        }
        
        const query = 'INSERT INTO items (room_id, uuid_qr, nama_barang, jenis, stok, status) VALUES ?';
        db.query(query, [items], (err, result) => {
            if (err) {
                console.error('Insert failed:', err);
            } else {
                console.log('Successfully inserted mock items!');
            }
            db.end();
        });
    });
});
