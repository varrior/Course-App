let mongoose = require('mongoose');
let Schema = mongoose.Schema;
//Blog schema
let blogSchema = new Schema({
    imagePath: {
        type: String,
    },
    title: {
        type: String,
    },
    body: {
        type: String,
    },
    author: {
        type: String
    },
    date: {
        type: Date
    }, 
    tags: [{
        type: String
    }],
    description: [{
        type: String,
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
        ratings: {
            like: {
                type: Number,
                default: 0
            },
            dislike: {
                type: Number,
                default: 0
            },
            users: [{
                id: {
                    type: String
                },
                vote: {
                    type: String
                }
            }]
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
            ratings: {
                like: {
                    type: Number,
                    default: 0
                },
                dislike: {
                    type: Number,
                    default: 0
                },
                users: [{
                    id: {
                        type: String
                    },
                    vote: {
                        type: String
                    }
                }]
            },
            date: {
                type: Date, 
            }
        }]
    }],
});

module.exports = mongoose.model('Blog', blogSchema);