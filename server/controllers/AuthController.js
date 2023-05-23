const User = require('../models/Users');
const createToken = require('../utils/Token');
const bcrypt = require('bcrypt');


const SignUp = async (req, res) => {
    try{
        const {first_name, last_name, email, password} = req.body;
        const existingUser = await User.findOne({email});
        if (existingUser){
            return res.status(400).json({
                message: 'User already exists'
            });
        }
        else{
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.create({
                first_name,
                last_name,
                email,
                password: hashedPassword
            });
            const token = createToken(user._id);
            res.cookie('token', token, {
                withCredentials: true,
                httpOnly: false
            });
            res.status(201).json({
                message: 'User created',
                token,
                success: true,
                user
            });
        }
        next()
    }
    catch(err){
            res.status(500).json({
                message: err.message
            });
        }
}
module.exports = SignUp;