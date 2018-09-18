let express = require('express');                               
let app = express(); 
let port = process.env.PORT || 8080;
let morgan = require('morgan');
let session = require('express-session');
let path = require('path');
let multer = require('multer');
let mongoose = require('mongoose');
let bodyParser = require('body-parser');
let router = express.Router(); 
let http = require('http').Server(app);
let io = require('socket.io')(http);
let MongoStore = require('connect-mongo')(session);
let socket = require('./app/routes/sockets')(io);
//Upload file to uploads directory
let storage = multer.diskStorage({                      
    destination: function(req, file, cb) {
        cb(null, './public/uploads/');
    },
    filename: function(req, file, cb) {
        if (!file.originalname.match(/\.(png|jpeg|jpg)$/)) {
            var err = new Error();
            err.code = 'filetype';
            return cb(err); 
        } else {
            cb(null, file.originalname);
        }
    }
});
let upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 }
}).array('myfile');
let appRoutes = require('./app/routes/api')(router,upload);

app.use(morgan('dev'));
//Create body middleware (req.body)
app.use(bodyParser.json({limit: '50mb'}));                          
app.use(bodyParser.urlencoded({limit: '50mb', extended: true }));
app.use(session({
    secret:'yourSecret', 
    resave: false, 
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection : mongoose.connection }),
    cookie: { maxAge: 180*60*1000 }
}));
//Add static files like e.g. css files
app.use(express.static(__dirname + '/public'));
app.use(function(req,res,next){
    res.locals.session = req.session
    next() 
})
//Add /api prefix to all routes
app.use('/api', appRoutes);
//Connect to mongodb database
mongoose.connect('mongodb://dbuser>:<dbpassword>@ds259742.mlab.com:59742/blogapp', { uri_decode_auth: true }, function(err){
    if(err){
        console.log('MongoDB not connected' + err)
    } else {
        console.log('Scuccessfully connected to MongoDB database');
    }
});
app.get('*', function(req, res){
    res.locals.session
    res.sendFile(path.join(__dirname + '/public/app/views/index.html'))
});  
http.listen(port, function(){ 
    console.log('Running the server on port ' + port)
});