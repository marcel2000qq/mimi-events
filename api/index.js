const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const serverless = require('serverless-http');

const app = express();
app.use(express.json());
app.use(cors({
    origin: 'https://mimi-events.vercel.app', // Actualizat cu noul URL
    methods: ['GET', 'POST'],
    credentials: true
}));

async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }

}

connectToMongoDB();


const reservationSchema = new mongoose.Schema({
  date: { type: String, required: true },
  name: { type: String, default: 'Fără nume' },
  email: { type: String },
  phone: { type: String, required: true },
  eventType: { type: String, default: 'Fără tip' },
  details: { type: String, default: 'Fără detalii' },
  createdAt: { type: Date, default: Date.now },
});

const Reservation = mongoose.model('Reservation', reservationSchema);

app.get('/check/:date', async (req, res) => {
    try {
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
