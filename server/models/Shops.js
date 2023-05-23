const mongoose = require('mongoose');

const ShopSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    },
    slogan: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    hats: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref:'Hat'
    }]
})
const ShopModel = mongoose.model('Shop', ShopSchema);
module.exports = ShopModel;