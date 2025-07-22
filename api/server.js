const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Conexiune la MongoDB
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

// Schema pentru rezervări
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

// Verifică disponibilitatea pe un interval
app.get('/api/check/range', async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate) || isNaN(endDate)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const dates = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const count = await Reservation.countDocuments({ date: dateStr });
      dates.push({ date: dateStr, count });
    }

    res.json(dates);
  } catch (error) {
    console.error('Error in /api/check/range:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verifică o dată specifică
app.get('/api/check/:date', async (req, res) => {
  try {
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const count = await Reservation.countDocuments({ date });
    res.json({ count });
  } catch (error) {
    console.error('Error in /api/check/:date:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Salvează rezervarea
app.post('/api/reserve', async (req, res) => {
  try {
    const { date, name, email, phone, eventType, details } = req.body;
    if (!date || !phone) {
      return res.status(400).json({ error: 'Date and phone are required' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    if (!/\+[0-9]{2}[0-9]{9}/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone format' });
    }

    const count = await Reservation.countDocuments({ date });
    if (count >= 4) {
      return res.status(400).json({ error: 'Date is fully booked' });
    }

    const reservation = new Reservation({
      date,
      name,
      email,
      phone,
      eventType,
      details,
    });
    await reservation.save();

    res.json({ message: 'Reservation successful' });
  } catch (error) {
    console.error('Error in /api/reserve:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});