let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let bcrypt = require('bcrypt-nodejs');
let titlize = require('mongoose-title-case');
let validate = require('mongoose-validator'); 

let nameValidator = [
    validate({
        validator: 'matches',
        arguments: /^(([a-zA-Z,ą,ę,ó,ć,ż,ź,ł,ń,Ą,Ę,Ó,Ć,Ż,Ź,Ł,Ń]{3,30})+[ ]+([a-zA-Z,ą,ę,ó,ć,ż,ź,ł,ń,Ą,Ę,Ó,Ć,Ż,Ź,Ł,Ń]{3,30})+)+$/,
        message: 'Co najmniej 3 znaki, lecz nie więcej niż 30. Żadnych znaków specjalnych cyfr'
    }),
    validate({ 
        validator: 'isLength',
        arguments: [3,30],
        message: 'Co najmniej {ARGS[0]} znaków, lecz nie więcej niż {ARGS[1]}'
    })
];
let dateValidator = [
    validate({
        validator: 'matches',
        arguments: /^$|(0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])[- /.](19|20)\d\d$/,
        message: 'Prawidłowy format: DD.MM.RRRR'
    }),
];
let emailValidator = [
    validate({
        validator: 'matches',
        arguments: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
        message: 'Nieprawidłowy adres email'
    }),
    validate({
        validator: 'isLength',
        arguments: [3,25],
        message: 'Email powinien mieć co najmniej {ARGS[0]} znaków, lecz nie więcej niż {ARGS[1]}'
    })
];
let usernameValidator = [
    validate({
        validator: 'isLength',
        arguments: [3,30],
        message: 'Nazwa użytkownika musi mieć co najmniej {ARGS[0]} znaki, lecz nie więcej niż {ARGS[1]}'
    }),
    validate({
        validator: 'matches',
        arguments: /^[a-zA-Z0-9,ą,ę,ó,ć,ż,ź,ł,ń,Ą,Ę,Ó,Ć,Ż,Ź,Ł,Ń]+(([ ][a-zA-Z,ą,ę,ó,ć,ż,ź,ł,ń,Ą,Ę,Ó,Ć,Ż,Ź,Ł,Ń])?[a-zA-Z,ą,ę,ó,ć,ż,ź,ł,ń,Ą,Ę,Ó,Ć,Ż,Ź,Ł,Ń]*)*$/,
    })
];
let passwordValidator = [
    validate({
        validator: 'matches',
        arguments: /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[A-Z])[0-9a-zA-Z].{7,34}$/,
        message: 'Hasło musi zawierać co najmniej jedną dużą literę, jedną małą, jedną cyfrę oraz musi mieć długość co najmniej 8 znaków lecz nie więcej niż 35'
    }),
    validate({
        validator: 'isLength',
        arguments: [8,35],
        message: 'Hasło musi mieć co najmniej {ARGS[0]} znaków, lecz nie więcej {ARGS[1]}'
    })
]

let UserSchema = new Schema({
    
    username:{
        type: String,
        required: true,
        unique:true,
        validate: usernameValidator
    },
    name:{
        type:String,
        required:true,
        validate: nameValidator
    },
    password:{
        type: String,
        required: true,
        validate: passwordValidator,
        select: false,
    },
    email:{
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        validate: emailValidator
    },
    birthday:{
        type: String,
        validate: dateValidator
    },
    active:{
        type: Boolean,
        required: true,
        default: false,
    },
    temporarytoken:{
        type: String,
        required:true,
    },
    resettoken:{
        type: String,
        required: false
    },
    permission:{
        type: String,
        required: true,
        default: 'user'
    },
    courses: [{
        courseId: [{
            type: String
        }],
        status: {
            type: String
        },
        date: {
            type: Date
        },
        orderId: {
            type: String
        },
        totalAmount: {
            type: Number
        },
        products: [{
            name: {
                type: String
            },
            unitPrice: {
                type: Number
            },
            quantity: {
                type: Number
            }
        }]
    }]
});
//Hash user before save in database
UserSchema.pre('save', function(next){
    let user = this;
    
    if(!user.isModified('password')) return next();
    
    bcrypt.hash(user.password, null, null, function(err, hash){
        if(err) return next(err);         
        user.password = hash;
        next();
    })
    
});

UserSchema.plugin(titlize, {
    paths: ['name']
})
//Check password e.g. in authentication
UserSchema.methods.comparePassword = function(password){
    return bcrypt.compareSync(password, this.password)
};

module.exports = mongoose.model('User', UserSchema);