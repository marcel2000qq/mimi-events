const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5500', 'https://mimi-events.vercel.app'], // Permite cereri de pe localhost și Vercel
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

app.get('/api/check/:date', async (req, res) => {
    try {
        const date = req.params.date;
        const count = await Reservation.countDocuments({ date });
        res.json({ count });
    } catch (error) {
        console.error('Eroare la verificarea datei:', error);
        res.status(500).json({ error: 'Eroare server' });
    }
});

app.get('/api/check/range', async (req, res) => {
    const { start, end } = req.query;
    try {
        const result = await Reservation.aggregate([
            {
                $match: {
                    date: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: '$date',
                    count: { $sum: 1 }
                }
            }
        ]);
        console.log('Rezultat agregare:', result);
        const data = result.map(item => ({ date: item._id, count: item.count || 0 }));
        const allDates = getDatesInRange(new Date(start), new Date(end));
        const fullData = allDates.map(date => {
            const found = data.find(item => item.date === date);
            return found || { date, count: 0 };
        });
        res.json(fullData);
    } catch (error) {
        console.error('Eroare la preluarea intervalului:', error);
        res.status(500).json({ error: 'Eroare la preluarea datelor' });
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

app.post('/api/reserve', async (req, res) => {
    try {
        const { date, name, email, phone, eventType, details } = req.body;
        const count = await Reservation.countDocuments({ date });
        if (count >= 4) {
            res.status(400).json({ message: 'Ziua este complet rezervată!' });
        } else {
            await Reservation.create({ date, name, email, phone, eventType, details });
            res.json({ message: 'Rezervare făcută!' });
        }
    } catch (error) {
        console.error('Eroare la rezervare:', error);
        res.status(500).json({ error: 'Eroare server' });
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});