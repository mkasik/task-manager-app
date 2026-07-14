const mongoose = require('mongoose');

// Guards against reconnecting on every call — important on Vercel, where a warm
// serverless function reuses the same Node process (and mongoose connection)
// across invocations, but each cold start still needs to connect from scratch.
async function connectDB() {
    if (mongoose.connection.readyState === 1) return mongoose.connection;

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connected: ${mongoose.connection.host}`);
        return mongoose.connection;
    } catch (err) {
        console.error(`MongoDB connection error: ${err.message}`);
        // A traditional long-running server can't do anything useful once its DB
        // connection fails at boot, so exit; a serverless function should instead
        // let the caller catch this and return a normal error response.
        if (!process.env.VERCEL) {
            process.exit(1);
        }
        throw err;
    }
}

module.exports = connectDB;
