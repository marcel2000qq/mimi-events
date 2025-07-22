const express = require('express');
const storage = require('node-persist');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Inițializăm node-persist
async function initializeStorage() {
  try {
    await storage.init({ dir: './storage' });
    console.log('Storage initialized successfully');
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    process.exit(1); // Oprim serverul dacă inițializarea eșuează
  }
}

initializeStorage();

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
      const count = (await storage.getItem(dateStr)) || 0;
      dates.push({ date: dateStr, count });
    }

    res.json(dates);
  } catch (error) {
    console.error('Error in /api/check/range:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/check/:date', async (req, res) => {
  try {
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const count = (await storage.getItem(date)) || 0;
    res.json({ count });
  } catch (error) {
    console.error('Error in /api/check/:date:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

    const count = (await storage.getItem(date)) || 0;
    if (count >= 4) {
      return res.status(400).json({ error: 'Date is fully booked' });
    }

    await storage.setItem(date, count + 1);
    // Aici poți adăuga logica pentru salvarea detaliilor rezervării
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
