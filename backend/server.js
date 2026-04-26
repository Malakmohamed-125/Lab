const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// PostgreSQL connection (Supabase)
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

db.connect()
    .then(client => {
        console.log('Connected to Supabase!');
        client.release();
    })
    .catch(err => console.error('DB Error:', err));

const getLastStudentID = async () => {
    const result = await db.query('SELECT MAX(id) AS "lastID" FROM student');
    return result.rows[0].lastID || 0;
};

const getLastteacherID = async () => {
    const result = await db.query('SELECT MAX(id) AS "lastID" FROM teacher');
    return result.rows[0].lastID || 0;
};

app.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM student');
        return res.json({ message: 'From Backend!!!', studentData: result.rows });
    } catch (error) {
        return res.status(500).json({ error: 'Error fetching student data' });
    }
});

app.get('/student', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM student ORDER BY id');
        return res.json(result.rows);
    } catch (error) {
        return res.status(500).json({ error: 'Error fetching students' });
    }
});

app.get('/teacher', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM teacher ORDER BY id');
        return res.json(result.rows);
    } catch (error) {
        return res.status(500).json({ error: 'Error fetching teachers' });
    }
});

app.post('/addstudent', async (req, res) => {
    try {
        const lastID = await getLastStudentID();
        const nextID = Number(lastID) + 1;
        const { name, rollNo, class: studentClass } = req.body;
        await db.query(
            'INSERT INTO student (id, name, roll_number, class) VALUES ($1,$2,$3,$4)',
            [nextID, name, rollNo, studentClass]
        );
        return res.json({ message: 'Data inserted successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Error inserting data' });
    }
});

app.post('/addteacher', async (req, res) => {
    try {
        const lastID = await getLastteacherID();
        const nextID = Number(lastID) + 1;
        const { name, subject, class: teacherClass } = req.body;
        await db.query(
            'INSERT INTO teacher (id, name, subject, class) VALUES ($1,$2,$3,$4)',
            [nextID, name, subject, teacherClass]
        );
        return res.json({ message: 'Data inserted successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Error inserting data' });
    }
});

app.delete('/student/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM student WHERE id = $1', [req.params.id]);
        const result = await db.query('SELECT id FROM student ORDER BY id');
        for (let i = 0; i < result.rows.length; i++) {
            await db.query('UPDATE student SET id=$1 WHERE id=$2', [i+1, result.rows[i].id]);
        }
        return res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Error deleting student' });
    }
});

app.delete('/teacher/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM teacher WHERE id = $1', [req.params.id]);
        const result = await db.query('SELECT id FROM teacher ORDER BY id');
        for (let i = 0; i < result.rows.length; i++) {
            await db.query('UPDATE teacher SET id=$1 WHERE id=$2', [i+1, result.rows[i].id]);
        }
        return res.json({ message: 'Teacher deleted successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Error deleting teacher' });
    }
});

const PORT = process.env.PORT || 3500;
app.listen(PORT, () => console.log(`Listening on Port ${PORT}`));
