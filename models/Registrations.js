const {Schema, model} = require('mongoose')

const schema = new Schema({
    email: {type: String, unique: true, required: true},
    password: {type: String, required: true},
    role: {type: String, defaultValue: "USER"},
},{versionKey: false})

module.exports = model('Registration', schema)







