let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let validate = require('mongoose-validator');
//Private person checkout
var PersonOrderSchema = new Schema({

    username:{
        type: String,
        required: true,
    },
    name:{
        type: String,
        required: true,
    },
    street:{
        type: String,
        required: true,
    },
    homeNumber:{
        type: String,
        required: true,
    },
    postCode:{
        type: String,
        required:true,
    },
    city:{
        type: String,
        required: true,
    },
    country:{
        type: String,
        required: true,
        default: 'Polska',
    },
    paymentId:{
        type: String,
    },
    date:{
        type: Date,
    }
})
module.exports = mongoose.model('PersonOrder', PersonOrderSchema);

