const fetch = require("node-fetch");
const DB = require('../database/database.json')
const nodemailer = require("nodemailer")
const moment = require('moment')
async function consultaSaldo (req, res){

    let respuesta = {
        error: null,
        datos: null
    }

    if(req.query.rut){
        let rut = req.query.rut;
        if(rut){
            let cliente = DB.clientes.find(element => element.rut === rut)
            if(cliente){
                let cuentas = DB.cuentas_bancarias.filter((element) => {
                    return element.rut_cliente === rut;
                }).map((e) => {
                    return e
                })
                if(cuentas.length > 0){
                    let saldo_total = 0
                    let obj_res = {}
                    obj_res.nombres = cliente.nombres
                    obj_res.apellidos = cliente.apellidos
                    obj_res.cuentas = []
                    cuentas.forEach(c => {
                        var obj_cuenta = {}
                        obj_cuenta.numero = c.nro_cuenta
                        obj_cuenta.saldo = c.saldo
                        obj_res.cuentas.push(obj_cuenta)
                        saldo_total += c.saldo
                    })
                    obj_res.saldo_total = saldo_total
                    respuesta.datos = obj_res
                }else{
                    respuesta.error = 'El rut indicado no tiene cuentas registradas'
                }
            }else{
                respuesta.error = 'El rut indicado no figura como cliente'
            }
        }else{
            respuesta.error = 'No hay rut indicado'
        }
    }else{
        respuesta.error = 'No hay rut indicado'
    }

    res.jsonp(respuesta)
}


async function realizar_transferencia_bancarias (req, res){
    let respuesta = {
        error: null,
        trasferencia_realizada: false,
        detalle: ''
    }
    function currencyFormat(num) {
        return '$' + num.toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
     }
    let body = req.body
    if(body){
        let nro_cuenta_origen = body.origen
        let nro_cuenta_destinatario = body.destinatario
        let monto = parseInt(body.monto)
        let correo_electronico = body.correo_electronico
        if(monto > 0){
            let cuenta_cliente_origen = DB.cuentas_bancarias.find(element => element.nro_cuenta === nro_cuenta_origen)
            let cliente =  DB.clientes.find(element => element.rut === cuenta_cliente_origen.rut_cliente)
            if(cuenta_cliente_origen){
                if(nro_cuenta_origen !== nro_cuenta_destinatario){
                    let cuenta_cliente_destino = DB.cuentas_bancarias.find(element => element.nro_cuenta === nro_cuenta_destinatario)
                    if(cuenta_cliente_destino){
                        if(cuenta_cliente_origen.saldo >= monto ){
                            respuesta.trasferencia_realizada = true
                            respuesta.detalle = `Se ha transferido ${currencyFormat(monto)} desde la cuenta nro ${nro_cuenta_origen} hacia la cuenta nro ${nro_cuenta_destinatario}`
                            
                            //Correo electronico 
                            if(correo_electronico !== ''){
                                const transporter = nodemailer.createTransport({
                                    host: "smtp.gmail.com",
                                    port: 465,
                                    secure: true,
                                    auth: {
                                      user: 'n.contrerasorellana@gmail.com',
                                      pass: 'ojjfougxjaorqkop', 
                                    },
                                  });
    
                                  const uid_message = await transporter.sendMail({
                                      from:'Banco Ripley <n.contrerasorellana@gmail.com>',
                                      to:correo_electronico,
                                      subject:'Comprobante de transferencia',
                                      html: `<div style="background-color:gray">
                                                <table style="width:560px;background-color:white">
                                                    <tr>
                                                        <td align="center" style="font-family: Helvetica,Arial,sans-serif;
                                                        font-weight: bold;
                                                        font-size: 13px;
                                                        color: #8c4091;" ><strong>Transferencia Realizada</strong></td>
                                                    </tr>
                                                    <tr>
                                                        <table width="100%"; align="left;display: table;">
                                                            <tr>
                                                                <td     font-family: Helvetica,Arial,sans-serif;
                                                                color: #767573;
                                                                font-weight: bold;
                                                                font-size: 13px;>Estimado ${cliente.nombres} (a): </td>
                                                            </tr>
                                                            <tr>
                                                                <td font-family: Helvetica,Arial,sans-serif;
                                                                color: #767573;
                                                                font-weight: bold;
                                                                font-size: 13px;>Te enviamos el detalle de esta operación: </td>
                                                            </tr>
                                                            <tr>
                                                                <td>Numero de cuenta Origen: </td>
                                                            </tr>
                                                            <tr>
                                                                <td>${nro_cuenta_origen}</td>
                                                            </tr>
                                                            <tr>
                                                                <td>Numero de cuenta Destino: </td>
                                                            </tr>
                                                            <tr>
                                                                <td>${nro_cuenta_destinatario}</td>
                                                            </tr>
                                                            <tr>
                                                                <td>Monto Transferido: </td>
                                                            </tr>
                                                            <tr>
                                                                <td>${currencyFormat(monto)}</td>
                                                            </tr>
                                                        </table>
                                                    </tr>
                                                  <tr>
                                                    <td>Saludos!</td>
                                                  </tr>
                                                </table>
                                            </div>`
                                  })

                                  console.log('correo_electronico ', uid_message.messageId)
                            }
                        }else{
                            respuesta.error = 'Saldo insuficiente'

                        }
                    }else{
                        respuesta.error = 'No se encontró la cuenta de destino indicada'
                    }
                }else{
                    respuesta.error = 'No se puede realizar una transferencia a la misma cuenta'
                }
            }else{
                respuesta.error = 'No se encontró la cuenta de origen indicada'
            }
        }else{
            respuesta.error = 'No se puede transferir un saldo menor o igual a 0'
        }
    }else{
        respuesta.error = 'No hay datos indicados'
    }
    res.jsonp(respuesta)
}


async function consulta_indicadores_economicos(req, res){
    let respuesta = {
        error: null,
        datos: []
    }
    await fetch('https://mindicador.cl/api')
    .then(response => response.json())
    .then(response => {
        respuesta.datos = []
        if(response.uf){
            var obj = {}
            obj.id = 1,
            obj.codigo =  response.uf.codigo
            obj.nombre = response.uf.nombre
            obj.unidad = response.uf.unidad_medida
            obj.fecha = moment(response.uf.fecha).format('DD-MM-YYYY HH:mm:ss')
            obj.valor = response.uf.valor
            respuesta.datos.push(obj)
        }
        if(response.ivp){
            var obj = {}
            obj.id = 2,
            obj.codigo = response.ivp.codigo
            obj.nombre = response.ivp.nombre
            obj.unidad = response.ivp.unidad_medida
            obj.fecha = moment(response.ivp.fecha).format('DD-MM-YYYY HH:mm:ss')
            obj.valor = response.ivp.valor
            respuesta.datos.push(obj)
        }
        if(response.dolar){
            var obj = {}
            obj.id = 3,
            obj.codigo =  response.dolar.codigo
            obj.nombre = response.dolar.nombre
            obj.unidad = response.dolar.unidad_medida
            obj.fecha = moment(response.dolar.fecha).format('DD-MM-YYYY HH:mm:ss')
            obj.valor = response.dolar.valor
            respuesta.datos.push(obj)
        }
        if(response.dolar_intercambio){
            var obj = {}
            obj.id = 4,
            obj.codigo =  response.dolar_intercambio.codigo
            obj.nombre = response.dolar_intercambio.nombre
            obj.unidad = response.dolar_intercambio.unidad_medida
            obj.fecha = moment(response.dolar_intercambio.fecha).format('DD-MM-YYYY HH:mm:ss')
            obj.valor = response.dolar_intercambio.valor
            respuesta.datos.push(obj)
        }
        if(response.euro){
            var obj = {}
            obj.id = 5,
            obj.codigo =  response.euro.codigo
            obj.nombre = response.euro.nombre
            obj.unidad = response.euro.unidad_medida
            obj.fecha = moment(response.euro.fecha).format('DD-MM-YYYY HH:mm:ss')
            obj.valor = response.euro.valor
            respuesta.datos.push(obj)
        }
        if(response.ipc){
            var obj = {}
            obj.id = 6,
            obj.codigo =  response.ipc.codigo
            obj.nombre = response.ipc.nombre
            obj.unidad = response.ipc.unidad_medida
            obj.fecha = moment(response.ipc.fecha).format('DD-MM-YYYY HH:mm:ss')
            obj.valor = response.ipc.valor
            respuesta.datos.push(obj)
        }
        if(response.utm){
            var obj = {}
            obj.id = 7,
            obj.codigo =  response.utm.codigo
            obj.nombre = response.utm.nombre
            obj.unidad = response.utm.unidad_medida
            obj.fecha = moment(response.utm.fecha).format('DD-MM-YYYY HH:mm:ss')
            obj.valor = response.utm.valor
            respuesta.datos.push(obj)
        }
    }).catch(err => {
        respuesta.error = err
    })
    res.jsonp(respuesta)
}

exports.consultaSaldo = consultaSaldo
exports.realizar_transferencia_bancarias = realizar_transferencia_bancarias
exports.consulta_indicadores_economicos = consulta_indicadores_economicos

