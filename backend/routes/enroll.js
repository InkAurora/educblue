const express = require('express');

const router = express.Router();
const { enroll, enrollFree } = require('../controllers/enroll');
const auth = require('../middleware/auth');

router.post('/', auth, enroll);
router.post('/free', auth, enrollFree);

module.exports = router;
