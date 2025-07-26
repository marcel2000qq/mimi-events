const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const bookingsFile = path.join(__dirname, '../bookings.json');

// Obține toate rezervările
app.get('/api/bookings', async (req, res) => {
  try {
    const data = await fs.readFile(bookingsFile, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Eroare la citirea rezervărilor' });
  }
});

// Adaugă o rezervare nouă
app.post('/api/bookings', async (req, res) => {
  try {
    const bookings = JSON.parse(await fs.readFile(bookingsFile, 'utf8'));
    const newBooking = {
      id: Date.now(),
      ...req.body,
      confirmed: false
    };
    bookings.push(newBooking);
    await fs.writeFile(bookingsFile, JSON.stringify(bookings, null, 2));
    res.json({ message: 'Rezervare adăugată', booking: newBooking });
  } catch (err) {
    res.status(500).json({ error: 'Eroare la salvarea rezervării' });
  }
});

// Confirmă o rezervare
app.put('/api/bookings/:id/confirm', async (req, res) => {
  try {
    const bookings = JSON.parse(await fs.readFile(bookingsFile, 'utf8'));
    const booking = bookings.find(b => b.id === parseInt(req.params.id));
    if (booking) {
      booking.confirmed = true;
      await fs.writeFile(bookingsFile, JSON.stringify(bookings, null, 2));
      res.json({ message: 'Rezervare confirmată' });
    } else {
      res.status(404).json({ error: 'Rezervare negăsită' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Eroare la confirmarea rezervării' });
  }
});

// Schimbă data unei rezervări
app.put('/api/bookings/:id/date', async (req, res) => {
  try {
    const bookings = JSON.parse(await fs.readFile(bookingsFile, 'utf8'));
    const booking = bookings.find(b => b.id === parseInt(req.params.id));
    if (booking) {
      booking.date = req.body.date;
      await fs.writeFile(bookingsFile, JSON.stringify(bookings, null, 2));
      res.json({ message: 'Data actualizată' });
    } else {
      res.status(404).json({ error: 'Rezervare negăsită' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Eroare la actualizarea datei' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server started on port ' + PORT));