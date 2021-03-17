const router = require('express').Router();
const cliente = require('../modules/cliente')

router.get('/consulta_saldo', cliente.consultaSaldo)
router.post('/realizar_transferencia_bancarias', cliente.realizar_transferencia_bancarias)
router.get('/consulta_indicadores_economicos', cliente.consulta_indicadores_economicos)

module.exports = router;
