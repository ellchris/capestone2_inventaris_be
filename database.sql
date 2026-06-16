-- Database schema for Capstone 2 Inventaris Backend
CREATE DATABASE IF NOT EXISTS inventaris;
USE inventaris;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

-- Seed Initial Users (Password: 12345678)
INSERT INTO users (nama, email, password, role) VALUES 
('Admin', 'admin@inventaris.com', '$2b$10$2ENjrWCj52pXA9pmuKZjvufoqU7ny8wHhT86dLHpDcZhERdCHo0tW', 'admin'),
('Kepala Lab', 'kalab@inventaris.com', '$2b$10$2ENjrWCj52pXA9pmuKZjvufoqU7ny8wHhT86dLHpDcZhERdCHo0tW', 'kepala_lab'),
('Ketua Prodi', 'kaprodi@inventaris.com', '$2b$10$2ENjrWCj52pXA9pmuKZjvufoqU7ny8wHhT86dLHpDcZhERdCHo0tW', 'ketua_prodi'),
('Staf Admin', 'staf_admin@inventaris.com', '$2b$10$2ENjrWCj52pXA9pmuKZjvufoqU7ny8wHhT86dLHpDcZhERdCHo0tW', 'staf_admin'),
('Staf Lab', 'staf_lab@inventaris.com', '$2b$10$2ENjrWCj52pXA9pmuKZjvufoqU7ny8wHhT86dLHpDcZhERdCHo0tW', 'staf_lab')
ON DUPLICATE KEY UPDATE id=id;

-- 2. Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_ruangan VARCHAR(255) NOT NULL,
    lokasi VARCHAR(255) NOT NULL
);

-- Seed Initial Rooms
INSERT INTO rooms (id, nama_ruangan, lokasi) VALUES
(1, 'Laboratorium Komputer 1', 'Gedung A Lantai 2'),
(2, 'Laboratorium Komputer 2', 'Gedung A Lantai 3'),
(3, 'Laboratorium Jaringan', 'Gedung B Lantai 1')
ON DUPLICATE KEY UPDATE id=id;

-- 3. Items Table
CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    uuid_qr VARCHAR(255) NOT NULL,
    nama_barang VARCHAR(255) NOT NULL,
    jenis VARCHAR(255) NOT NULL,
    stok INT NULL,
    status VARCHAR(50) NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Seed Initial Items
INSERT INTO items (id, room_id, uuid_qr, nama_barang, jenis, stok, status) VALUES 
(1, 1, 'ITEM-001', 'PC Lenovo ThinkCentre', 'inventaris', NULL, 'baik'),
(2, 1, 'ITEM-002', 'Monitor LG 24 Inch', 'inventaris', NULL, 'baik'),
(3, 1, 'ITEM-003', 'Keyboard Logitech K120', 'inventaris', NULL, 'baik'),
(4, 2, 'ITEM-004', 'Proyektor Epson', 'inventaris', NULL, 'rusak'),
(5, 3, 'ITEM-005', 'Router Mikrotik RB951', 'inventaris', NULL, 'baik')
ON DUPLICATE KEY UPDATE id=id;

-- 4. Procurements Table
CREATE TABLE IF NOT EXISTS procurements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tahun_anggaran VARCHAR(10) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    approval_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Procurement Items Table
CREATE TABLE IF NOT EXISTS procurement_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    procurement_id INT NOT NULL,
    nama_barang VARCHAR(255) NOT NULL,
    harga DECIMAL(15, 2) NOT NULL,
    jumlah INT NOT NULL,
    link_pembelian TEXT NULL,
    is_replacement TINYINT(1) DEFAULT 0,
    replaced_item_id INT NULL,
    status_item VARCHAR(50) DEFAULT 'pending',
    FOREIGN KEY (procurement_id) REFERENCES procurements(id) ON DELETE CASCADE,
    FOREIGN KEY (replaced_item_id) REFERENCES items(id) ON DELETE SET NULL
);
