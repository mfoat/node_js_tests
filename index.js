'use strict'

const express = require('express')
const http = require('http')
const cors = require('cors')

const callbacks = require('./callbacks')
const asyncsSolutions = require('./async_test')

const server = express()
const port = 3000

const httpServer = http.createServer(server)
httpServer.listen(port)
console.log('Express started on port %s', port)

server.use(express.json())
server.use(cors({
	origin: '*',
}));

/*
<response>
	<xkcd year=”” month=”” day=”” img=”” rub_to_usd=””></xkcd>
</response>
 */
server.post('/currencies', (req, res, next) => {

    const ids = req.body.ids

    if (!Array.isArray(ids)) return next(error(404, 'Ids param should be an array'))
    
    if (ids.length == 0) return next(error(404, 'Ids param is empty'))

    console.log('Ids: ', ids)
    
    // callbacks.start(ids, (xml) => {
    //     if (xml)
    //         res.send(xml)
    //     else {
    //         console.log(callbacks.message)
    //         res.status(404).send(callbacks.message)
    //     }
    // })

    asyncsSolutions.loadCurrencies(ids, res)
})

server.get((error, req, res, next) => {
    res.status(error.status | 500)
    res.send({ error: err.message })
})

server.get((req, res) => {
    res.status(404)
    res.send({ error: "Sorry, can't find that" })
})

