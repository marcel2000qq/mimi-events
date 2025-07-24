const express = require('express');
const router = express.Router();
const controller = require('../controllers/reservationController');

router.get('/check/:date', controller.checkByDate);
router.get('/check/range', controller.checkByRange);
router.post('/reserve', controller.reserve);

module.exports = router;
