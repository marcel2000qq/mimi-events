const Reservation = require('../models/Reservation');
const { getDatesInRange } = require('../utils/dateUtils');

exports.checkByDate = async (req, res) => {
    try {
        const count = await Reservation.countDocuments({ date: req.params.date });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Eroare server' });
    }
};

exports.checkByRange = async (req, res) => {
    const { start, end } = req.query;
    try {
        const bookings = await Reservation.aggregate([
            { $match: { date: { $gte: start, $lte: end } } },
            { $group: { _id: '$date', count: { $sum: 1 } } }
        ]);

        const data = bookings.map(b => ({ date: b._id, count: b.count }));
        const allDates = getDatesInRange(new Date(start), new Date(end));
        const result = allDates.map(date => data.find(d => d.date === date) || { date, count: 0 });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Eroare la preluarea datelor' });
    }
};

exports.reserve = async (req, res) => {
    const { date, name, email, phone, eventType, details } = req.body;
    try {
        const count = await Reservation.countDocuments({ date });
        if (count >= 4) {
            return res.status(400).json({ message: 'Ziua este complet rezervată!' });
        }
        await Reservation.create({ date, name, email, phone, eventType, details });
        res.json({ message: 'Rezervare făcută!' });
    } catch (err) {
        res.status(500).json({ error: 'Eroare server' });
    }
};
