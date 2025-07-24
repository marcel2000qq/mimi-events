require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const reservationRoutes = require('./routes/reservationRoutes');

const app = express();
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());

mongoose.set('strictQuery', false);

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true, useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB error:', err.message);
        process.exit(1);
    });

app.use('/api', reservationRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
