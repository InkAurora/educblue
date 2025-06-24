const express = require('express');

const router = express.Router();
const { enroll } = require('../controllers/enroll');
const auth = require('../middleware/auth');

router.post('/', auth, enroll);

module.exports = router;
