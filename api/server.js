const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const serverless = require('serverless-http');

const app = express();
app.use(express.json());
app.use(cors({
    origin: ['https://mimi-events.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
}));

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectToMongo() {
    try {
        await client.connect();
        console.log("Conectat la MongoDB Atlas");
    } catch (error) {
        console.error("Eroare la conectare:", error);
        throw error;
    }
}

app.get('/check/:date', async (req, res) => {
    try {
        await client.connect();
        const date = req.params.date;
        const db = client.db('calendar_db');
        const reservations = db.collection('reservations');
        const count = await reservations.countDocuments({ date: date });
        res.json({ count });
    } catch (error) {
        console.error("Eroare la verificarea datei:", error);
        res.status(500).json({ error: "Eroare server" });
    }
});

app.get('/check/range', async (req, res) => {
    try {
        await client.connect();
        const { start, end } = req.query;
        const db = client.db('calendar_db');
        const reservations = db.collection('reservations');
        const pipeline = [
            {
                $match: {
                    date: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: "$date",
                    count: { $sum: 1 }
                }
            }
        ];
        const result = await reservations.aggregate(pipeline).toArray();
        console.log('Rezultat agregare:', result);
        const data = result.map(item => ({ date: item._id, count: item.count || 0 }));
        const allDates = getDatesInRange(new Date(start), new Date(end));
        const fullData = allDates.map(date => {
            const found = data.find(item => item.date === date);
            return found || { date, count: 0 };
        });
        res.json(fullData);
    } catch (error) {
        console.error("Eroare la preluarea intervalului:", error);
        res.status(500).json({ error: "Eroare la preluarea datelor" });
    }
});

function getDatesInRange(start, end) {
    const dates = [];
    let currentDate = new Date(start);
    const endDate = new Date(end);
    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

app.post('/reserve', async (req, res) => {
    try {
        await client.connect();
        const { date, name, email, phone, eventType, details } = req.body;
        const db = client.db('calendar_db');
        const reservations = db.collection('reservations');
        const count = await reservations.countDocuments({ date: date });
        if (count >= 4) {
            res.status(400).json({ message: 'Ziua este complet rezervată!' });
        } else {
            await reservations.insertOne({ date, name, email, phone, eventType, details, timestamp: new Date() });
            res.json({ message: 'Rezervare făcută!' });
        }
    } catch (error) {
        console.error("Eroare la rezervare:", error);
        res.status(500).json({ error: "Eroare server" });
    }
});

module.exports = serverless(app);
