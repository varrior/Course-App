let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let validate = require('mongoose-validator');
//Company checkout
let CompanyOrderSchema = new Schema({
    
    username:{
        type: String,
        required: true,
    },
    CompanyName:{
        type: String,
        required: true,
    },
    NIP:{
        type: String,
        required: true,
    },
    CompanyStreet:{
        type: String,
        required: true,
    },
    homeNumber:{
        type: String,
        required:true,
    },
    postCode:{
        type: String,
        required: true,
    },
    city:{
        type: String,
        required: true,
    },
    country:{
        type: String,
        required: true,
        default: 'Poland',
    },
    paymentId: {
        type: String,
    },
    date:{
        type: Date,
    }
})
module.exports = mongoose.model('CompanyOrder', CompanyOrderSchema);