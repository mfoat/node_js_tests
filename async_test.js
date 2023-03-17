'use strict'

const axios = require('axios')

const builder = require('xmlbuilder')
const { XMLParser, XMLValidator } = require("fast-xml-parser")

module.exports = class asyncsSolutions {

    static msg = 'Something went wrong'

    static async loadCurrencies(ids, responce) {
        var root = builder.create('responce')
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i]
            const result = await asyncsSolutions.send(
                `https://xkcd.com/${id}/info.0.json`
            )
    
            if (!result) continue
    
            const xkcdData = asyncsSolutions.parseXKCD(result)
            const cbrUrl = asyncsSolutions.createQueryForCBR(xkcdData.year, xkcdData.month, xkcdData.day)
            const responce = await asyncsSolutions.send(
                cbrUrl
            )
            const value = asyncsSolutions.parseCBR(responce)
            console.log(`Usd to rub: ${value}`)
            if (value) {
                const item = root.ele('xkcd')
                item.att('year', xkcdData.year)
                item.att('month', xkcdData.month)
                item.att('day', xkcdData.day)
                item.att('img', xkcdData.img)
                item.att('rub_to_usd', value)
            } else {
                console.log(asyncsSolutions.msg)
            }
        }
        const xml = root.end({ pretty: true })
        if (xml) {
            console.log(xml)
            responce.send(xml)
        } else {
            console.log(asyncsSolutions.msg)
            responce.send(asyncsSolutions.msg)
        }
    }
    
    static parseXKCD(responce) {
        const year = responce.data.year
        const month = responce.data.month
        const day = responce.data.day
        let img = responce.img
        if (!img) img = ""
    
        console.log(`Date from XKCD, year: ${year}, month: ${month}, day: ${day}`)
    
        return {
            year: year,
            month: month,
            img: img,
            day: day
        }
    }
    
    static parseCBR(responce) {
        const validate = XMLValidator.validate(responce.data)
        if (validate != true) {
            msg = 'XML from CBR is not valid - ' + validate.err
            return null
        }
    
        const xmlOptions = {
            ignoreAttributes: false
        }
        const xmlParser = new XMLParser(xmlOptions)
        const xml = xmlParser.parse(responce.data)
        if (xml.ValCurs) {
            const record = xml.ValCurs.Record
            if (record) {
                if (record.Value) {
                    const value = record.Value
                    return value
                }
                else {
                    asyncsSolutions.msg = 'Cannot find Value element'
                }
            } else {
                asyncsSolutions.msg = 'Cannot find Record element'
            }
        } else {
            asyncsSolutions.msg = 'Cannot find ValCurs element'
        }
        console.log(`Completed: with error: ${asyncsSolutions.msg}`)
        return null
    }
    
    static createQueryForCBR(year, month, day) {
        const dayString = ('00' + day).slice(-2)
        const monthString = ('00' + month).slice(-2)
        const date = `${dayString}/${monthString}/${year}`
        return `http://www.cbr.ru/scripts/XML_dynamic.asp?date_req1=${date}&date_req2=${date}&VAL_NM_RQ=R01235`
    }
    
    static async send(
        url
    ) {
        console.log(`Request to url: ${url}`)
        return await axios({
            method: 'get',
            url: url,
            timeout: 60000
        })
        .catch((e) => {
            console.log(e)
            asyncsSolutions.msg = e.message
        })
    }
}

