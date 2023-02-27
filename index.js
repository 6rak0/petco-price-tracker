import dotenv from 'dotenv';
import cron from 'node-cron';
import {load} from 'cheerio';
import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import Pocketbase from 'pocketbase'

dotenv.config();
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {polling: true});
const chatId = process.env.CHAT_ID;
const pb = new Pocketbase(process.env.POCKETBASE_URL)

const getItems = async () => {
    const items = await pb.collection('petco_items').getFullList({
        sort: '-created',
    }); 
    return items
}

const addItem = async (url) => {
    try {
        await pb.collection('petco_items').create({url})
        console.log('✅ item added')
    } catch (error) {
        console.error(error)
    }
}

const removeItem = async (url) => {
    const items = await getItems()
    items.forEach(async item => {
        if (url === item.url){
            try {
                await pb.collection('petco_items').delete(item.id)
                console.log('💣 item removed')
            } catch (error) {
                console.error(error)
            }
        }
    })
}

// add
bot.onText(/\/add https?:\/\/(?:www\.)?petco\.com\.mx(?:\/.*)/,async (msg, match) => {
    const chatId = msg.chat.id;
    const url = match[0].split(' ')[1]
    try {
        await addItem(url)
        bot.sendMessage(chatId, `✅ el producto se agregó de manera correcta`)
    } catch (error) {
        console.error(error)
        bot.sendMessage(chatId, `❌ el producto no se agregó debido a esto: ${error}`)
    }
});

// delete
bot.onText(/\/del https?:\/\/(?:www\.)?petco\.com\.mx(?:\/.*)/,async (msg, match) => {
    const chatId = msg.chat.id;
    const url = match[0].split(' ')[1]
    try {
        await removeItem(url)
        bot.sendMessage(chatId, `✅ el producto se borró de manera correcta`)
    } catch (error) {
        console.error(error)
        bot.sendMessage(chatId, `❌ el producto no se borró debido a esto: ${error}`)
    }
});

const getPetcoData = async (url) => {
    try {
        const response = await axios(url);
        const html = response.data;
        const $ = load(html);
        const product = $('span#name-category').text();
        const price = $('.discountedPrice').text();
        //const img = `https://petco.com.mx${$('#imagePreviewContainerData a').attr('href')}`
        return {product, price};
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const sendMessage = async (id, message) => {
    try {
        //await bot.sendPhoto(id, url)
        await bot.sendMessage(id, message);
    } catch (error) {
        console.error(error);
    }
};

const notification = async (url) => {
    const {product, price} = await getPetcoData(url);
    await sendMessage(chatId, `${product} está en ${price}`);
};

cron.schedule('0 9 * * *',async () => {
    const products = await getItems()
    products.forEach(product => {
        notification(product);
    });
});
