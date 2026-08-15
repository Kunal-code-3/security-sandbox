const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

async function initDb() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error('❌ MONGO_URI is not set in environment variables');
        return;
    }
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB database connected successfully');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        throw err;
    }
}

async function createUser(name, email, password) {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
        name,
        email,
        password_hash: passwordHash
    });

    const savedUser = await newUser.save();
    return savedUser._id.toString();
}

async function getUserByEmail(email) {
    const user = await User.findOne({ email }).lean();
    if (user) {
        user.id = user._id.toString(); // Map _id to id for backwards compatibility
    }
    return user;
}

async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

module.exports = {
    initDb,
    createUser,
    getUserByEmail,
    comparePassword
};
