import dotenv from 'dotenv';
import Pocketbase from 'pocketbase'

dotenv.config();

const pb = new Pocketbase(process.env.POCKETBASE_URL)

const getItems = async (collection) => {
    const records = await pb.collection(collection).getFullList({
        sort: '-created',
    }); 
    return records
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
    const items = await getItems('petco_items')
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

export {getItems, addItem, removeItem}