'use strict'

const axios = require('axios')

const builder = require('xmlbuilder')
const { XMLParser, XMLValidator} = require("fast-xml-parser")

const xmlOptions = {
    ignoreAttributes : false
}
const xmlParser = new XMLParser(xmlOptions)

module.exports = class callbacks {

    static message = 'Somethin went wrong'

    static start = (ids, completion) => {
        callbacks.loadCurrencies(ids, (xml) => {
            if (xml) {
                completion(xml)
            } else {
                callbacks.message = 'XML if empty'
                completion(null)
            }
        })
    }

    static loadCurrencies = (ids, completion) => {

        var values = []
        var answersCount = 0
    
        var root = builder.create('responce')
        ids.forEach( id => {
            callbacks.requestToXkcd(id, function(value) {
                answersCount = answersCount + 1
                if (value) {
                    values.push(value)
                    var item = root.ele('xkcd')
                        item.att('year', value.year)
                        item.att('month', value.month)
                        item.att('day', value.day)
                        item.att('img', value.img)
                        item.att('rub_to_usd', value.value)
                }
                if (answersCount == ids.length) {
                    if (values.length == 0) {
                        callbacks.message = "No valid currencies"
                        completion(null)
                    }
                    else {
                        const xml = root.end({ pretty: true})
                        completion(xml)
                    }
                } 
            })
        })
    }
    
    // Example: https://xkcd.com/info.0.json
    static requestToXkcd= (id, completion) => {
        axios
            .get(`https://xkcd.com/${id}/info.0.json`, {
                responceType: "json"
            })
            .then((responce) => {
                const year = responce.data.year
                const month = responce.data.month
                const day = responce.data.day
                let img = responce.img
                if (!img) img = ""
    
                console.log(`Date from XKCD, year: ${year}, month: ${month}, day: ${day}`)
    
                callbacks.requestToCB(year, month, day, (value) => {
                    if (value) {
                        console.log(`Usd to rub: ${value}`)
    
                        const json = {
                            "year": year,
                            "month": month,
                            "day": day,
                            "img": img,
                            "value": value
                        }
                        return completion(json)
                    } else {
                        console.log(callbacks.message)
                        return completion(null)
                    }
                })
            })
            .catch((e) => {
                callbacks.errorHanlder(e)
                callbacks.message = "Error connecting to XKCD"
                return completion(null)
            })
    }
    
    // Example: http://www.cbr.ru/scripts/XML_dynamic.asp?date_req1=02/03/2001&date_req2=14/03/2001&VAL_NM_RQ=R01235
    // R01235 - кодировка для обозначения USD
    static requestToCB = (year, month, day, completion) => {
        const dayString = ('00'+day).slice(-2)
        const monthString = ('00'+month).slice(-2)
        const date = `${dayString}/${monthString}/${year}`
    
        let msg = ''
    
        axios
            .get(`http://www.cbr.ru/scripts/XML_dynamic.asp`, {
                params: {
                    date_req1: date,
                    date_req2: date,
                    VAL_NM_RQ: "R01235"
                }
            })
            .then((responce) => {
                const validate = XMLValidator.validate(responce.data)
                if (validate != true) {
                    msg = 'XML from CBR is not valid - ' + validate.err
                    return completion(null)
                }
                const xml = xmlParser.parse(responce.data)
    
                if (xml.ValCurs) {
                    const record = xml.ValCurs.Record
                    if (record) {
                        if (record.Value) return completion(record.Value)
                        else callbacks.message = 'Cannot find Value element'
                    } else {
                        callbacks.message = 'Cannot find Record element'
                    }
                } else {
                    callbacks.message = 'Cannot find ValCurs element'
                }
                return completion(null)
            })
            .catch((e) => {
                callbacks.errorHanlder(e)
                callbacks.message = "Error connecting to CBR"
                return completion(null)
            })
    }
    
    static errorHanlder = (e) => {
        if (e.response) {
            // Request made and server responded
            console.log(e.response.data)
            console.log(e.response.status)
            console.log(e.response.headers)
          } else if (e.request) {
            // The request was made but no response was received
            console.log(e.request)
          } else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error', e.message)
          }
        // handle error
        console.log(e)
    }
}