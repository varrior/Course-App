let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let bcrypt = require('bcrypt-nodejs');
let titlize = require('mongoose-title-case');
let validate = require('mongoose-validator');

let passwordValidator = [
    validate({
        validator: 'matches',
        arguments: /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[A-Z])[0-9a-zA-Z].{7,34}$/,
        message: 'The password must contain at least one uppercase letter, one small letter, one number and must be at least 8 characters, but not more than 35 characters'
    }),
    validate({
        validator: 'isLength',
        arguments: [8,35],
        message: 'Password must have at least {ARGS[0]} characters, but no more than {ARGS[1]}'
    })
]
//Admin schema 
let AdminSchema = new Schema({
    username:{
        type: String,
        unique:true,
    },
    name:{
        type:String,
    },
    secret:{
        type: String,
        select: false,
        validate: passwordValidator,
    },
    email:{
        type: String,
        required: true,
        lowercase: true,
        unique: true,
    },
    activeAdmin:{
        type: Boolean,
        default: false,
    },
    temporaryAdminToken:{
        type: String,
    },
    resettoken:{
        type: String,
        required: false
    },
    permission:{
        type: String,
        required: true,
        default:'admin'
    }       
});
//Hash admin  password before save in database
AdminSchema.pre('save', function(next){

    let user = this;
    if(!user.isModified('secret')) return next();
    
    bcrypt.hash(user.secret, null, null, function(err, hash){
        if(err) return next(err);         
        user.secret = hash;
        next();
    })
});

AdminSchema.plugin(titlize, {
    paths: ['name']
})
//Check password e.g. in authentication
AdminSchema.methods.compareSecret = function(secret){
    return bcrypt.compareSync(secret, this.secret)
};

module.exports = mongoose.model('Admin', AdminSchema);