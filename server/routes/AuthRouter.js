const { SignUp } = require('./controllers/AuthController');
const router = require('express').Router();

router.post('/signup', SignUp);
module.exports = router;