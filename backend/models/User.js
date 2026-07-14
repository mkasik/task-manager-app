const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AVATAR_COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#0ea5e9', '#ec4899', '#84cc16'];

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, minlength: 6 },
        avatarColor: { type: String, default: () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] },
    },
    { timestamps: true }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
    return { id: this._id, name: this.name, email: this.email, avatarColor: this.avatarColor };
};

module.exports = mongoose.model('User', userSchema);
