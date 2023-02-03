require("dotenv").config();
const cron = require('node-cron')
const cheerio = require('cheerio')
const axios = require('axios')
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {polling: true});
const chatId = process.env.CHAT_ID;

async function getPetcoData(url) {
    try {
        const response = await axios(url)
        const html = response.data
        const $ = cheerio.load(html)
        const product = $('span#name-category').text()
        const price = $('.discountedPrice').text()
        return {product, price}
    } catch (error) {
        console.error(error)
        throw error
    }
}

const sendMessage = (id, message) => {
    bot.sendMessage(id, message)
    .catch(error => console.log(error));
};

async function notification() {
    const {product, price} = await getPetcoData('https://petco.com.mx/petco/en/PRODUCTOS/Perro/EveryYay-Cama-Circular-Ortop%C3%A9dica-con-Infusi%C3%B3n-de-Lavanda-Calmante-para-Perro%2C-Mediano/p/137751')
    sendMessage(chatId, `${product} está en ${price}`)
}

cron.schedule('0 9,21 * * *', () => {
    notification
})
