const mongoose = require('mongoose');
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
            type: String,
            required: true
    },
    created_at: {
            type: Date,
            default: Date.now
    },
    my_shops: [{type: mongoose.Schema.Types.ObjectId, ref:'Shop'}]
})

// UserSchema.pre('save', async function () {
//     this.password = await bcrypt.hash(this.password, 10)
// })

const UserModel = mongoose.model('User', UserSchema)
module.exports = UserModel