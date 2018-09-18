let mongoose = require('mongoose');
let Schema = mongoose.Schema;
//New course schema
let productSchema = new Schema({
    imagePath: {
        type: String,
    },
    introText :{
        type: String
    },
    author: {
        name: {
            type: String
        },
        education: { 
            type: String
        },
        description: {
            type: String
        },
    },
    title: {
        type: String,
    },
    subTitle: {
        type: String,
    },
    date: {
        type: Date,
    },
    newPrice: {
        type: Number,
    },
    oldPrice: {
        type: Number,
    },
    level: {
        type: String,
    },
    description: [{
        type: String,
    }],
    videos: [{

    }],
    comments: [{
        number: {
            type: Number
        },
        body: {
            type: String,
            trim: true,
        },
        author: {
            type: String,
        },
        date: {
            type: Date,
        },
        reply: [{
            body: {
                type: String,
                trim: true,
            },
            author: {
                type: String,
            }, 
            date: {
                type: Date, 
            }
        }]
    }],
    body: {
        type: String,
    }
});

module.exports = mongoose.model('Product', productSchema);