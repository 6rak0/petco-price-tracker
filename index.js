require("dotenv").config();
const cron = require('node-cron')
const cheerio = require('cheerio')
const axios = require('axios')
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {polling: true});
const chatId = process.env.CHAT_ID;

const products = [
    'https://petco.com.mx/petco/en/PRODUCTOS/Perro/EveryYay-Cama-Circular-Ortop%C3%A9dica-con-Infusi%C3%B3n-de-Lavanda-Calmante-para-Perro%2C-Mediano/p/137751',
    'https://petco.com.mx/petco/en/MARCAS/Kurgo/Kurgo-Correa-Quantum-Azul-Multiproposito-6-en-1-para-Perro%2C-1-8-m/p/114474'
]

// function wait(ms){
//     return new Promise(resolve => setTimeout(resolve, ms))
// }

async function getPetcoData(url) {
    try {
        const response = await axios(url)
        const html = response.data
        const $ = cheerio.load(html)
        const product = $('span#name-category').text()
        const price = $('.discountedPrice').text()
        //const img = `https://petco.com.mx${$('#imagePreviewContainerData a').attr('href')}`
        return {product, price}
    } catch (error) {
        console.error(error)
        throw error
    }
}

const sendMessage = async (id, message) => {
    try {
        //await bot.sendPhoto(id, url)
        await bot.sendMessage(id, message)
    } catch (error) {
        console.error(error)
    }
};

async function notification(url) {
    const {product, price} = await getPetcoData(url)
    await sendMessage(chatId, `${product} está en ${price}`)
}

// products.forEach(product => {
//     notification(product)
// })

cron.schedule('0 15 * * *', () => {
    products.forEach(product => {
        notification(product)
    })
})
