const express = require('express')
const cors = require('cors')

const path = require('path')

const router = require('./routes/index')

const {json, urlencoded} = express;

const app = express()

const port = process.env.PORT || 8080;

app.use(json())
app.use(urlencoded({extended:false}))

const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200
}

app.use(cors(corsOptions));



app.use(router)

app.listen(port, () => {
    console.log(`Servidor levantado en puerto ${port}`)
})