const axios = require('axios')

function get() {
    axios({
        method: 'post',
        url: 'https://pamyat-naroda.ru/heroes/?adv_search=y&first_name=&middle_name=&date_birth_from=&static_hash=ff941e1032d95787f26b2069fed434ccb3573f3600cdbc1aa8742bd494516397v14&group=all&types=pamyat_commander:nagrady_nagrad_doc:nagrady_uchet_kartoteka:nagrady_ubilein_kartoteka:pdv_kart_in:pdv_kart_in_inostranec:pamyat_voenkomat:potery_vpp:pamyat_zsp_parts:kld_ran:kld_bolezn:kld_polit:kld_upk:kld_vmf:kld_partizan:potery_doneseniya_o_poteryah:potery_gospitali:potery_utochenie_poter:potery_spiski_zahoroneniy:potery_voennoplen:potery_iskluchenie_iz_spiskov:potery_kartoteki:potery_rvk_extra:potery_isp_extra:same_doroga&page=2&grouppersons=1&place_birth=%D1%8E%D0%BB%D1%82%D1%8B'
    }).then((responce) => {
        
        console.log(responce.data)

    }).catch((error) => {
        errorHanlder(error)
    })
}

function errorHanlder(error) {
    if (error.response) {
        // Request made and server responded
        console.log(error.response.data)
        console.log("Status: " + error.response.status)
        // console.log(error.response.headers)
    } else if (error.request) {
        // The request was made but no response was received
        console.log(error.request)
    } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message)
    }
    // handle error
    console.log(error)
}

get()