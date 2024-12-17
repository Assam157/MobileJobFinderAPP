// models/ApplicationModel.js

const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    job_name: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    applicationDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Application', ApplicationSchema);
