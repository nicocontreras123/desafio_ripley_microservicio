const router = require('express').Router();
const cliente = require('./cliente')


router.use('/cliente', cliente)


module.exports = router;
