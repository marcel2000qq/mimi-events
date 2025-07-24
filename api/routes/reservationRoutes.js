const express = require('express');
const router = express.Router();
const controller = require('../controllers/reservationController');


router.get('/check/range', (req, res, next) => {
    console.log('ROUTE /check/range HIT');
    next();
}, controller.checkByRange);
router.post('/reserve', controller.reserve);
router.get('/check/:date', controller.checkByDate);

module.exports = router;
