// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// base de datos sqlite en archivo db.sqlite (se creará automáticamente)
const dbFile = path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbFile, (err) => {
  if(err) console.error('Error abriendo BD:', err);
  else console.log('Base de datos abierta en', dbFile);
});

// crear tabla responses si no existe
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      q1 TEXT, q2 TEXT, q3 TEXT, q4 TEXT, q5 TEXT,
      q6 TEXT, q7 TEXT, q8 TEXT, q9 TEXT, q10 TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// --- CRUD ---

// Create
app.post('/responses', (req, res) => {
  const r = req.body || {};
  const q6 = Array.isArray(r.q6) ? JSON.stringify(r.q6) : JSON.stringify([]);
  const params = [
    r.q1 || null, r.q2 || null, r.q3 || null, r.q4 || null, r.q5 || null,
    q6, r.q7 || null, r.q8 || null, r.q9 || null, r.q10 || null
  ];
  const sql = `INSERT INTO responses (q1,q2,q3,q4,q5,q6,q7,q8,q9,q10) VALUES (?,?,?,?,?,?,?,?,?,?)`;
  db.run(sql, params, function(err){
    if(err) return res.status(500).json({error: err.message});
    res.json({ id: this.lastID });
  });
});

// Read all
app.get('/responses', (req, res) => {
  db.all('SELECT * FROM responses ORDER BY created_at DESC', [], (err, rows) => {
    if(err) return res.status(500).json({error: err.message});
    rows = rows.map(r => ({ ...r, q6: JSON.parse(r.q6 || '[]') }));
    res.json(rows);
  });
});

// Read one
app.get('/responses/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM responses WHERE id = ?', [id], (err, row) => {
    if(err) return res.status(500).json({error: err.message});
    if(!row) return res.status(404).json({error: 'No encontrado'});
    row.q6 = JSON.parse(row.q6 || '[]');
    res.json(row);
  });
});

// Update
app.put('/responses/:id', (req, res) => {
  const id = req.params.id;
  const r = req.body || {};
  const q6 = Array.isArray(r.q6) ? JSON.stringify(r.q6) : JSON.stringify([]);
  const params = [
    r.q1 || null, r.q2 || null, r.q3 || null, r.q4 || null, r.q5 || null,
    q6, r.q7 || null, r.q8 || null, r.q9 || null, r.q10 || null,
    id
  ];
  const sql = `UPDATE responses SET q1=?,q2=?,q3=?,q4=?,q5=?,q6=?,q7=?,q8=?,q9=?,q10=? WHERE id = ?`;
  db.run(sql, params, function(err){
    if(err) return res.status(500).json({error: err.message});
    res.json({changes: this.changes});
  });
});

// Delete
app.delete('/responses/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM responses WHERE id = ?', [id], function(err){
    if(err) return res.status(500).json({error: err.message});
    res.json({deleted: this.changes});
  });
});

// Servir archivos estáticos desde ./public
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
