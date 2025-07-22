const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const serverless = require('serverless-http'); // Add this for Vercel

const app = express();
app.use(express.json());
app.use(cors({
    origin: 'https://2-0-beryl.vercel.app', // Allow your frontend domain
    methods: ['GET', 'POST'],
    credentials: true
}));

const uri = "mongodb+srv://myUser:MySecurePassword123@reservations.zjc2epf.mongodb.net/calendar_db?retryWrites=true&w=majority&appName=reservations";
const client = new MongoClient(uri);

async function connectToMongo() {
    try {
        await client.connect();
        console.log("Connected to MongoDB Atlas");
    } catch (error) {
        console.error("Connection error:", error);
    }
}

connectToMongo();

app.get('/check/:date', async (req, res) => {
    const date = req.params.date;
    const db = client.db('calendar_db');
    const reservations = db.collection('reservations');
    const count = await reservations.countDocuments({ date: date });
    res.json({ count });
});

app.get('/check/range', async (req, res) => {
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
    try {
        const result = await reservations.aggregate(pipeline).toArray();
        console.log('Aggregation result:', result);
        const data = result.map(item => ({ date: item._id, count: item.count || 0 }));
        const allDates = getDatesInRange(new Date(start), new Date(end));
        const fullData = allDates.map(date => {
            const found = data.find(item => item.date === date);
            return found || { date, count: 0 };
        });
        res.json(fullData);
    } catch (error) {
        console.error("Error fetching range data:", error);
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
});

// Export for Vercel serverless
module.exports = serverless(app);