const mongoose = require('mongoose');

const HatSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    colour: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop'
    },
    created: {
        type: Date,
        default: Date.now
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

})

const HatModel = mongoose.model('Hat', HatSchema);
module.exports = HatModel;