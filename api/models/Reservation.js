const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    date: { type: String, required: true },
    name: { type: String, default: 'Fără nume' },
    email: { type: String },
    phone: { type: String, required: true },
    eventType: { type: String, default: 'Fără tip' },
    details: { type: String, default: 'Fără detalii' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Reservation', reservationSchema);
