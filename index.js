'use strict'

const express = require('express')
const http = require('http')
const cors = require('cors')
const oracledb = require('oracledb')

const callbacks = require('./callbacks')
const asyncsSolutions = require('./async_test')

const axios = require('axios')

const builder = require('xmlbuilder')
const { XMLParser, XMLValidator } = require("fast-xml-parser")

const xmlOptions = {
    ignoreAttributes: false
}
const xmlParser = new XMLParser(xmlOptions)

const server = express()
const port = 3000

const httpServer = http.createServer(server)
httpServer.listen(port, () => {
    console.log('Express started on port %s', port)
    // job([100, 200, 300])
})


server.use(express.json())
server.use(cors({
    origin: '*',
}));

var comicsIds = []
var root = builder.create('responce')

async function connectToKPFU() {
    let connection
    try {
        connection = await oracledb.getConnection( {
            user          : "ENTRANT$DB",
            password      : "entrant",
            connectString : "10.160.180.5:1521/trinity"
        })

        const dictionaries = await connection.execute(`SELECT * FROM SS_DICTIONARYTYPECLS`)
		
		// console.log(dictionaries.rows)

        dictionaries.rows.forEach ( dictionary => {
            console.log(dictionary)
            let id = dictionary[0]
            console.log(id)
        })

        const profiles = await connection.execute(`SELECT * FROM PROFIL`)

        profiles.rows.forEach ( profile => {
            console.log(profile)
            let id = profile[0]
            console.log(id)
        })
    } catch (err) {
        console.log(err)
    } finally {
        try {
            await connection.close()
          } catch (err) {
            console.error(err)
          }
    }
}

connectToKPFU()

/*
<response>
    <xkcd year=”” month=”” day=”” img=”” rub_to_usd=””></xkcd>
</response>
 */
server.post('/currencies', (req, res, next) => {

    const ids = req.body.ids
    job(ids, res)

    // if (!Array.isArray(ids)) return next(error(404, 'Ids param should be an array'))

    // if (ids.length == 0) return next(error(404, 'Ids param is empty'))

    // console.log('Ids: ', ids)
    // comicsIds = ids

    // callbacks.start(ids, (xml) => {
    //     if (xml)
    //         res.send(xml)
    //     else {
    //         console.log(callbacks.message)
    //         res.status(404).send(callbacks.message)
    //     }
    // })

    // asyncsSolutions.loadCurrencies(ids, res)
})

server.get((error, req, res, next) => {
    res.status(error.status | 500)
    res.send({ error: err.message })
})

server.get((req, res) => {
    res.status(404)
    res.send({ error: "Sorry, can't find that" })
})

var message = 'Something went wrong'
function job(ids, res) {
    if (!Array.isArray(ids)) return next(error(404, 'Ids param should be an array'))

    if (ids.length == 0) return next(error(404, 'Ids param is empty'))

    console.log('Ids: ', ids)
    comicsIds = ids

    var index = 0
    test(index, (xml) => {
        console.log("All values received")
        if (res != null) {
            if (xml == null) res.send(message)
            else res.send(xml)
        }
    })
}

var test = (index, completion) => {
    const id = comicsIds[index]
    const url = `https://xkcd.com/${id}/info.0.json`

    axios.get(url)
        .then((responce) => {
            const year = responce.data.year
            const month = responce.data.month
            const day = responce.data.day
            let img = responce.img
            if (!img) img = ""

            console.log(`Date from XKCD, year: ${year}, month: ${month}, day: ${day}`)

            const dayString = ('00' + day).slice(-2)
            const monthString = ('00' + month).slice(-2)
            const date = `${dayString}/${monthString}/${year}`
            const cbrUrl = `http://www.cbr.ru/scripts/XML_dynamic.asp?date_req1=${date}&date_req2=${date}&VAL_NM_RQ=R01235`
            console.log(cbrUrl)

            axios.get(cbrUrl)
                .then((responce) => {
                    const validate = XMLValidator.validate(responce.data)
                    if (validate != true) {
                        message = 'XML from CBR is not valid - ' + validate.err
                        console.log(message)
                        if (index + 1 < comicsIds.length) {
                            test(index + 1, completion)
                        }
                        else {
                            const xml = root.end({ pretty: true})
                            completion(xml)
                        }
                    } else {
                        const xml = xmlParser.parse(responce.data)

                        if (xml.ValCurs) {
                            const record = xml.ValCurs.Record
                            if (record) {
                                if (record.Value) {
                                    var item = root.ele('xkcd')
                                    item.att('year', year)
                                    item.att('month', month)
                                    item.att('day', day)
                                    item.att('img', img)
                                    item.att('rub_to_usd', record.Value)
                                    console.log("Exchange rate for USD/USD: " + record.Value)
                                }
                                else {
                                    message = 'Cannot find Value element'
                                }
                            } else {
                                message = 'Cannot find Record element'
                            }
                        } else {
                            message = 'Cannot find ValCurs element'
                        }
                    }

                    if (index + 1 < comicsIds.length) {
                        test(index + 1, completion)
                    }
                    else {
                        const xml = root.end({ pretty: true})
                        completion(xml)
                    }
                })
                .catch((e) => {
                    message = e.message
                    completion(null)
                }) 
        })
        .catch((e) => {
            message = e.message
            completion(null)
        }) 
}

