let mognoose = require('mongoose');
let Schema = mognoose.Schema;

let AboutUsSchema = new Schema({
    author: {
        type: String
    },
    blog: {
        type: String
    }
});

module.exports = mognoose.model("AboutUs", AboutUsSchema);