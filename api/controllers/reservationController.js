const Reservation = require('../models/Reservation');
const { getDatesInRange } = require('../utils/dateUtils');
const moment = require('moment');

console.log('reservationController loaded!');

exports.checkByDate = async (req, res) => {

    try {
        const count = await Reservation.countDocuments({ date: req.params.date });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Eroare server' });
    }
};

exports.checkByRange = async (req, res) => {

    console.log('--- checkByRange endpoint HIT ---');
    const { start, end } = req.query;
    console.log('Received range:', { start, end });

    const testDocs = await Reservation.find({ date: { $gte: start, $lte: end } });
    console.log('Matching docs:', testDocs);

    try {
        const bookings = await Reservation.aggregate([
            {
                $match: {
                    date: {
                        $gte: start,
                        $lte: end
                    }
                }
            },
            {
                $group: {
                    _id: "$date",
                    count: { $sum: 1 }
                }
            }
        ]);
        console.log('Bookings from aggregation:', bookings);

        const bookingsMap = Object.fromEntries(
            bookings.map(b => [b._id, b.count])
        );
        console.log('Bookings map:', bookingsMap);

        const allDates = getDatesInRange(start, end); // use strings directly
        console.log('All dates in range:', allDates);

        const result = allDates.map(date => ({
            date,
            count: bookingsMap[date] || 0
        }));
        console.log('Final result:', result);

        res.json(result);
    } catch (err) {
        console.error('Error in checkByRange:', err);
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
