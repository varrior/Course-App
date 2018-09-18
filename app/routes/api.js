let User            = require('../models/user');
let Admin           = require('../models/admin');
let AboutUs         = require('../models/aboutUs');
let Product         = require('../models/products');
let Blog            = require('../models/blog');
let Cart            = require('../models/cart');
let Order           = require('../models/orders');
let CompanyOrder    = require('../models/companyOrder');
let jwt             = require('jsonwebtoken') 
let secret          = 'yourSecret';
let adminSecret     = 'yourAdminPassword';
let nodemailer      = require('nodemailer');
let objectid        = require('mongodb').ObjectID;
let path            = require('path'); 
let request         = require('request');
let crypto          = require('crypto');

module.exports = function(router,upload) {
    //Nodemailer sends email to users
    var client = nodemailer.createTransport({ 
        service: 'yourService',
        auth: { 
            user: 'yourEmail',
            pass: 'yourPassword'
        },
        tls: {rejectUnauthorized: false}
    });

    function tokenAuth(req, res, next){
        let token = req.body.token || req.body.query || req.headers['x-access-token']
        if(token){
            jwt.verify(token, secret, function(err,decoded){
                if(err){
                    res.json({ authenticated: false, message:'Invalid token'})
                } else {
                    req.decoded = decoded;
                    next()
                }
            })
        } else {
            res.json({success:false, message:'No token provided'});
        }
    }
    //Authorization in PayU payment
    /*You have to sign up in payu for developers and get your credentials and id. Read docs for more info. If you want to test payment in sandbox remember that your ip should be seen visible outside*/
    function PaymentPayU(callback){
        request({
            method: 'POST',
            url: 'url for authorization',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: "your credentials and user id"
        },  function (error, response, body) {
                callback(null, JSON.parse(body).access_token);
          }
        )
    }
    //Get details from token username, email
    router.post('/me', tokenAuth, function(req,res){
        res.send(req.decoded)
    });
    //Renew session if token expired
    router.get('/renewToken/username', tokenAuth, function(req, res){
        User.findOne({ username: req.decoded.username }).select('username email').exec(function(err,user){
            if(err) {
                res.json({ success: false, message: err })
            }
            if(!user) {
                res.json({ success:false, message: 'Username not found'});
            } else {
                var newToken = jwt.sign({username: user.username, email: user.email }, secret, {expiresIn: '24h' });
                res.json({ success:true, token: newToken });
            }
        })
    });
    /**************************************BLOG ROUTES********************************************/
    //Get all articles from database and sort them by date
    router.get('/blog/articles/:page/:method', function(req,res) {
        let currentPage = req.params.page;
        let pageSize = 2;
        Blog.find({}, function(err, articles) {
            if(err) {
                res.json({ success: false, message: 'Error occured during loading articles' })
            } 
            if(!articles) {
                res.json({ success:false, message: 'Articles no found'});
            } else {
                let restArticles;
                let headerArticles = articles.sort((a, b) => (new Date(b.date) - new Date(a.date))).slice(0,3);
                let totalPage = articles.length/pageSize;
                let allArticles = articles.sort((a, b) => (new Date(b.date) - new Date(a.date))).slice(3)
                if(req.params.method === 'sortDown') {
                    restArticles =  articles.sort((a, b) => (new Date(b.date) - new Date(a.date))).slice(3).sort((c, d) => (new Date(c.date) - new Date(d.date))).slice((currentPage-1)*pageSize,(currentPage-1)*pageSize+pageSize);
                } else {
                    restArticles = articles.sort((a, b) => (new Date(b.date) - new Date(a.date))).slice(3).slice((currentPage-1)*pageSize,(currentPage-1)*pageSize+pageSize);
                }
                res.json({ success: true, articles: restArticles, headerArticles: headerArticles, totalPage: totalPage, allArticles: articles })
            }
        })
    });
    //Get single article and rest articles with similar tags
    router.get('/blog/article/:id/:page', function(req,res) {
        let pageSize = 2;
        let currentPage = req.params.page;
        Blog.find({}, function(err, articles) {
            if(err){
                res.json({ success: false, message: 'Error occured during loading articles' })
            } 
            if(!articles){
                res.json({ success: false, message: 'Articles no found' })
            } else {
                let thisArticle = articles.filter(item => item._id == req.params.id);
                let restArticles = articles.filter(item => item.tags.some(tag => (thisArticle[0].tags.includes(tag) && item._id != req.params.id))).slice((currentPage-1)*pageSize,(currentPage-1)*pageSize+pageSize);
                let totalPage = articles.length/pageSize;
                res.json({ success: true, article: thisArticle[0], rest: restArticles, totalPage: totalPage }) 
            }
            
        })
    });
    //Comment article by authenticated users
    router.post('/blog/article/comment', tokenAuth, function(req, res) { 
        if(req.body.valid && req.body.body.length){
            Blog.findOne({ _id: req.body.id }, function(err, article){
                if(err) {
                    res.json({ success: false, message: err })
                } else {
                    if(!article){
                        res.json({ success: false, message: 'Article no found' })
                    } else {
                        User.findOne({ username: req.decoded.username }, function(err, user){
                            if(err){
                                res.json({ success: false, message: err })
                            } else if(!user) {
                                res.json({ success: false, message: 'User no found' })
                            } else {
                                let thisComment = {
                                    body: req.body.body,
                                    author: user.username,
                                    date: new Date(),   
                                    number: article.comments.length + 1
                                }
                                article.comments.push(thisComment);
                                article.save(function(err, comment){
                                    if(err){
                                        res.json({ success: false, message: 'Error occured during save comment' });
                                    } else {
                                        res.json({ success: true, message: 'Comment has been added!', comment: comment.comments[comment.comments.length-1], id: req.body.id })
                                    }
                                })                                
                            }
                        })
                    }
                }
            })
        } else {
            res.json({ success: false, message: 'Invalid comment' })
        }
    });
    //Reply to user comment
    router.post('/blog/article/comment/reply', tokenAuth, function(req, res) {  
        if(req.body.valid && req.body.body.length){
            Blog.findOne({ _id: req.body.id }, function(err, article){
                if(err) {
                    res.json({ success: false, message: err })
                } else {
                    if(!article){
                        res.json({ success: false, message: 'Article no found' })
                    } else {
                        User.findOne({ username: req.decoded.username }, function(err, user){
                            if(err){
                                res.json({ success: false, message: err })
                            } else if(!user) {
                                res.json({ success: false, message: 'User no found' })
                            } else {
                                let thisReply = {
                                    body: req.body.body,
                                    author: user.username,
                                    date: new Date(),   
                                }
                                article.comments.id(req.body.commentId).reply.push(thisReply);
                                article.save(function(err, comment){
                                    if(err){
                                        res.json({ success: false, message: 'Error occured during save reply' });
                                    } else {
                                        res.json({ success: true, message: 'Reply has been added!', reply: comment.comments.id(req.body.commentId).reply[comment.comments.id(req.body.commentId).reply.length - 1] })
                                    }
                                })                                
                            }
                        })                        
                    }
                }
            })
        } else {
            res.json({ success: false, message: 'Invalid reply' })
        }
    });
    /**************************************USER REGISTER AND LOGIN********************************************/
    //Create user account
    router.post('/users', function(req, res){
        var user = new User();
        user.username = req.body.username;
        user.password = req.body.password;
        user.email    = req.body.email;
        user.name     = req.body.name;
        user.temporarytoken = jwt.sign({ username: user.username, email: user.email }, secret, { expiresIn: '24h'});

        if(req.body.username === null || req.body.username === '' || req.body.password === null || req.body.password === '' || req.body.email === null || req.body.email === '' || req.body.name === null || req.body.name === ''){
            res.json({success: false, message:'Make sure that your name, username, password and email have been provided'})
        } else {
            user.save(function(err){
                if(err){
                    if(err.errors != null) {
                        if(err.errors.name){
                            res.json({success:false, message: err.errors.name.message});  
                        } else if(err.errors.email){
                            res.json({success:false, message:err.errors.email.message})
                        } else if(err.errors.username){
                            res.json({success:false, message:err.errors.username.message})
                        } else if(err.errors.password){
                            res.json({success:false, message:err.errors.password.message})
                        } else {
                            res.json({success: false, message: err})
                        }                      
                    } else if (err) {
                        if(err.code == 11000) {
                            if(err.errmsg[61] == 'u'){
                                res.json({success: false, message: "This username is already taken"})
                            } else if(err.errmsg[61] == "e") {
                                res.json({success: false, message: "This email adress is already taken"})
                            }
                        } else {
                            res.json({success: false, message:err})
                        }
                    }             
                } else {
                    var email = {
                        from: 'xzy',
                        to: user.email,
						subject: 'Activation link',
						text: 'Hello ' + user.name + ', thank you for registering at localhost.com. Please click on the following link to complete your activation: http://localhost:8080/activate/' + user.temporarytoken,
						html: 'Hello<strong> ' + user.name + '</strong>,<br><br>Thank you for registering at localhost.com. Please click on the link below to complete your activation:<br><br><a href="http://localhost:8080/activate/' + user.temporarytoken + '">http://localhost:8080/activate/</a>'
                    };
                    client.sendMail(email, function(err, info){
                        if(err) {
                            res.json({ success: false, message: err })
                        } else {
                            res.json({ success: true, message:'The registration was correct. Check your email to activate your account...' });
                        }
                    });
                }
            })
        }
    });
    //Activate account
    router.put('/activate/:token', function(req,res){
        let token = req.params.token
        User.findOne({temporarytoken: token}, function(err, user){
            if(err) {
                res.json({ success: false, message: 'Error during activate user' })
            }
            jwt.verify(token, secret, function(err, decoded){
                if(err){
                    res.json({success:false, message:'The activation link is no longer active.'});
                } else if(!user) {
                    res.json({success:false, message:'The activation link is no longer active.'})
                } else {
                    user.temporarytoken = false;
                    user.active = true;
                    user.save(function(err){
                        if(err){
                            res.json({ success: false, message: err })
                        } else {
                            var email = {
								from: 'xyz',
								to: user.email,
								subject: 'Account active!',
								text: 'Hello again ' + user.name + ' ,your account has been activated!',
								html: 'Hello again <strong> ' + user.name + '</strong>,<br><br>your account has been activated!'
                            };
                            
                            client.sendMail(email, function(err,info){
                                if(err) {
                                    res.json({ success: false, message: err })
                                }
                            });
                            res.json({success:true, message:'Your account has been activated!'});
                        }
                    });
                }
            })
        })
    });
    //Check credentials 
    router.post('/resend', function(req,res){
        User.findOne({username: req.body.username}).select('username password active').exec(function(err,user){
            if(err){
                res.json({ succes: false, message: err })
            }
            if(!user){
                res.json({success:false, message:'User no found'});
            } else if(user){
                if(req.body.password){
                    let validPassword = user.comparePassword(req.body.password); 
                    if(!validPassword){
                        res.json({success:false, message:'Incorrect password'})
                    } else if(user.active) {
                        res.json({success:false, message:'The account has already been activated'});
                    } else {
                        res.json({success:true, user:user})
                    }
                } else {
                    res.json({success: false, message:'Password is not provided'});
                }                
            }            
        })        
    });
    //Resend activation link
    router.put('/resend', function(req,res){
        User.findOne({username:req.body.username}).select('username email temporarytoken').exec(function(err,user){
            if(err) {
                res.json({ succes: false, message: err })
            }
            user.temporarytoken = jwt.sign({username: user.username, email:user.email}, secret, {expiresIn: '24h'});
            user.save(function(){
				var email = {
					from: 'xyz',
					to: user.email,
					subject: 'Activation Link Request',
					text: 'Hello ' + user.name + ', You recently requested a new account activation link. Please click on the following link to complete your activation: http://localhost:8080/activate/' + user.temporarytoken,
					html: 'Hello<strong> ' + user.name + '</strong>,<br><br>You recently requested a new account activation link. Please click on the link below to complete your activation:<br><br><a href="http://localhost:8080/activate/' + user.temporarytoken + '">http://localhost:8080/activate/</a>'
				};         
                client.sendMail(email, function(err, info){
                    if(err) {
                        res.json({ success: false, message: err })
                    }
                });
                res.json({success:true, message:'Activation link has been sent on: ' + user.email + '!'})    
            });
        });
    });
    //Remind username
    router.get('/resetusername/:email', function(req, res){
        User.findOne({email: req.params.email }).select('email name username').exec(function(err, user){
            if(err){
                res.json({ success:false, message: err })
            } else {
                if (!user) {
                    res.json({ success: false, message: 'Provided email address was not found'})
                } else {
 					var email = {
						from: 'xyz',
						to: user.email,
						subject: 'Username Request',
						text: 'Hello ' + user.name + ', You recently requested your username. Please save it in your files: ' + user.username,
						html: 'Hello<strong> ' + user.name + '</strong>,<br><br>You recently requested your username. Please save it in your files: ' + user.username
					};

                    client.sendMail(email, function(err, info){
                        if(err) {
                            res.json({ success: false, message: err })
                        }
                    });  
                    res.json({ success: true, message: 'Username has been sent on your email address' })                      
                }
            }
        })
    });
    //Reset password
    router.put('/resetpassword', function(req, res){
        User.findOne({ username: req.body.username }).select('username active email resettoken name').exec(function(err, user){
            if(err){
                res.json({ success:false, message: err })
            }
            if(!user) {
                res.json({ success: false, message: 'User no found'});
            } else if(!user.active) {
                res.json({ success: false, message: 'Account has not been activated' });
            } else {
                user.resettoken = jwt.sign({ username:user.username, email:user.email }, secret, { expiresIn: '24h' });
                user.save(function(err){
                    if(err) {
                        res.json({ success:false, message: err })
                    } else {
                        var email = {
                            from: 'xyz',
                            to: user.email,
                            subject: 'Reset Password Request',
							text: 'Hello ' + user.name + ', You recently request a password reset link. Please click on the link below to reset your password:<br><br><a href="http://localhost:8080/reset/' + user.resettoken,
							html: 'Hello<strong> ' + user.name + '</strong>,<br><br>You recently request a password reset link. Please click on the link below to reset your password:<br><br><a href="http://localhost:8080/reset/' + user.resettoken + '">http://localhost:8080/reset/</a>'
                        };
                        client.sendMail(email, function(err, info){
                            if(err) {
                                res.json({ success: false, message: err })
                            }
                        });
                        res.json({ success: true, message: 'A link to delete the password has been sent to the email address'});   
                    }
                })
            }
        })
    });
    //Confirm changing password
    router.get('/resetpassword/:token', function(req,res){
        User.findOne({ resettoken: req.params.token }).select().exec(function(err,user){
            if(err) {
                res.json({ success:false, message: err })
            }
            var token = req.params.token;
            jwt.verify(token, secret, function(err, decoded){
                if(err) {
                    res.json({ success: false, message: 'Password link has expired' });
                } else {
                    if(!user) {
                        res.json({ success: false, message: 'Password link has expired' });
                    } else {
                        res.json({ success: true, user: user });
                    }
                }
            })
        })
    });
    //Save new password
    router.put('/savepassword', function(req, res){
        User.findOne({ username: req.body.username }).select('username email name password resettoken').exec(function(err, user){
            if(err) {
                res.json({ success:false, message: err })
            }
            if(req.body.password === null || req.body.password === ''){
                res.json({ success: false, message: 'Password was not provided' });
            } else {
                user.password = req.body.password;
                user.resettoken = false;

                user.save(function(err){
                    if(err) {
                        res.json({ success: false, message: err})
                    } else {
                        var email = {
                            from: 'xyz',
                            to: user.email,
							subject: 'Localhost Reset Password',
							text: 'Hello ' + user.name + ', This e-mail is to notify you that your password was recently reset at localhost.com',
							html: 'Hello<strong> ' + user.name + '</strong>,<br><br>This e-mail is to notify you that your password was recently reset at localhost.com'
                        }; 
                        client.sendMail(email, function(err, info){
                            if(err) {
                                res.json({ success: false, message: err })
                            }
                        });
                        res.json({ success: true, message: 'Password has been changed!' });                       
                    }
                });
            }
        });
    });

    router.post('/checkusername', function(req,res){
        User.findOne({ username: req.body.username }).select('username').exec(function(err,user){
            if(err) {
                res.json({ success:false, message: err })
            }
            if(user) {
                res.json({ success: false, message: 'This username is already taken' })
            } else {
                res.json({ success:true, message: 'Correct username' })
            }
        })
    });
    
    router.post('/checkemail', function(req,res){
        User.findOne({ email:req.body.email }).select('email').exec(function(err,user){
            if(err) {
                res.json({ success:false, message: err })
            }
            if(user){
                res.json({ success: false, message: 'This email address is already taken'});
            } else {
                res.json({ success: true, message:'Correct email address' })
            }
        })        
    });
    //User authentication
    router.post('/authenticate', function(req, res){
        User.findOne({ username: req.body.username }).select('email username password permission active').exec(function(err, user){
            if(err) {
                res.json({ success:false, message: err })
            }
            if(!user){
                res.json({success:false, message:'User no found'})
            } else if (user){ 
                if(!req.body.password){
                    res.json({success:false, message:'Password was not provided'});                    
                } else {  
                    var validPassword = user.comparePassword(req.body.password);
                    if(!validPassword){                  
                        res.json({success:false, message:'Incorrect password'})
                    } else if (!user.active){
                        res.json({success: false, message:'The account has not been activated yet. Check the email address and confirm the activation link.', expired: true});
                    } else {
                        var token = jwt.sign({username: user.username, email: user.email}, secret, {expiresIn: '24h'})
                        res.json({success:true, message:'You have logged in correctly!', token: token, permission: user.permission })
                    }
                }
            }
        })
    });
    //Get user permission
    router.get('/permission', tokenAuth, function(req, res){
        User.findOne({ username: req.decoded.username }, function(err, user) {
            if(err){
                res.json({ success: false, messge: err })
            }
            if(!user) {
                res.json({ success: false, message: 'Username not found'});
            } else {
                res.json({ success: true, permission: user.permission });
            }
        });
    });
    /**************************************OTHER********************************************/
    //Send message to admin
    router.post('/contact', function(req, res){
        let message = {};
        message.username = req.body.username;
        message.email = req.body.email;
        message.contentMessage = req.body.contentMessage;

        if(req.body.username === null || req.body.username === '' || req.body.email === null || req.body.email === '' || req.body.contentMessage=== null || req.body.contentMessage === ''){
            res.json({success: false, message:'Make sure that you have filled in the contact form correctly'})
        } else {
            var email = {
                    from: 'xyz', 
                    to: 'Admin email address',
                    subject: 'Message from the user: ' + message.username,
                    html: '<p style="margin:0"><strong>Username: ' + message.username + '</strong></p>' + '<br>' + '<p style="margin:0"><strong>Email address: ' + message.email + '<strong></p>' + '<br>' + '<p style="margin:0; text-decoration:underline"><strong>Message content: </strong></p>' + '<br>' + '<p style="margin:0">' + message.contentMessage + '</p>', 
                };
            client.sendMail(email, function(err, info){
                if(err) {
                    res.json({ success: false, message: err })
                }
            });
            res.json({ success:true, message:'Thank you for message, we will try to send back as soon as possible' });
        }
    });  

    /**************************************COURSES PLATFORM ROUTES********************************************/
    //Get all courses from database
    router.get('/courses', function(req,res) {
        Product.find({}, function(err, products) {
            if(err) {
                res.json({ success: false, message: 'Error occured during loading products' })
            }
            if(!products) {
                res.json({ success:false, message: 'Products no found'});
            } else {
                res.json({ success:true, products: products })
            }
        })
    });
    //Get content of the "About Us" page
    router.get('/aboutme', function(req,res){
        AboutUs.find({}, function(err, about){
            let type, des;
            if(err){
                res.json({ success: false, message: err })
            } else {
                res.json({ success: true, about: about[0] })
            } 
        })       
    })
    //Get single course
    router.get('/courses/details/:id', function(req, res) {
        let details = req.params.id;
        if(objectid.isValid(details)){
            Product.findOne({_id: details}, function(err, product) {
                if(err) {
                    res.json({ success: false, message: err })
                }
                if(!product) {
                    res.json({ success: false, message: 'Course no found' });
                } else {
                    res.json({ success: true, product: product });  
                }
            }) 
        } else {
            res.json({ success: false }); 
        }
    }); 
    //My purchased courses
    router.get('/myCourses', tokenAuth, function(req, res){
        User.findOne({ username: req.decoded.username }, function(err, user){
            if(err){
                res.json({ success: false, message: err })
            } else {
                let courses = [];
                if(user && user.active === true){
                    user.courses.forEach(function(course){
                        if(course.status === 'COMPLETED'){
                            courses.push(course.courseId)
                        }
                    })
                    let flattenCourses = [].concat.apply([], courses)
                    res.json({ success: true, courses: flattenCourses, user: user.username})
                } else {
                    res.json({ success: false, message: 'User no found' })
                }
            }
        })
    });
    //Get detail purchased course
    router.get('/myCourses/:username/:id', tokenAuth, function(req, res) {
        User.findOne({ username: req.decoded.username }, function(err, user){
            if(err){
                res.json({ success: false, message: err})
            } else {
                Product.findOne({ _id: req.params.id }, function(err, product){
                    if(err) {
                        res.json({ success: false, message: err })
                    } else {
                        let coursesId = [];
                        user.courses.forEach(function(item){
                            coursesId.push(item.courseId)
                        })
                        let flattenId = [].concat.apply([], coursesId);
                        let paramsCourse = flattenId.some(function(element){
                            return element === req.params.id
                        })
                        if(user.username === req.params.username && paramsCourse){
                            res.json({ success: true, product: product })
                        } else {
                            res.json({ success: false })
                        }
                    }

                })
            }
        })
    }); 
    //Get history orders
    router.get('/orders/myOrders', tokenAuth, function(req, res) {
        User.findOne({ username: req.decoded.username }, function(err, user){
            if(err){
                res.json({ success: false, message: err})
            } else if (!user) {
                res.json({ succes: false, message: 'User no found' })
            } else {
                res.json({ success: true, orders: user.courses })
            }
        })
    }); 
    //Order new course
    //Store user orders in session storage
    router.post('/sendOrders', tokenAuth, function(req, res){
        if((req.session.cart && req.session.order) || (req.session.cart && req.session.companyOrder)){
            User.findOne({ username: req.decoded.username }, function(err, user){
                PaymentPayU(function(err, body){
                    if(err){
                        res.json({ success: false, message: err })
                    } else {
                        let product = [];
                        let productCourse = [];
                        for(var i in req.session.cart.items){
                            product.push({ name : req.session.cart.items[i].item.title, unitPrice : JSON.stringify(req.session.cart.items[i].item.newPrice*100), quantity: JSON.stringify(req.session.cart.items[i].qty)});
                            productCourse.push(req.session.cart.items[i].item._id)
                        }
                        request({
                            method: 'POST',
                            url: 'orders url',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + body
                            },
                            body: JSON.stringify({
                                "notifyUrl": "http://.../api/notify/" + user._id,
                                "customerIp": req.connection.remoteAddress,
                                "merchantPosId": "yourMerchantPosID",
                                "description": "Description your app",
                                "currencyCode": "PLN",
                                "continueUrl": "http://.../continue",
                                "totalAmount": JSON.stringify(req.session.cart.totalPrice*100), 
                                "buyer": {
                                    "email": req.body.PayAdressEmail,
                                    "firstName": req.body.PayNamePerson,
                                    "lastName": req.body.PayLastName,
                                    "language": "en"
                                },
                                "settings":{
                                    "invoiceDisabled":"true"
                                },
                                "products": product
                            })
                        }, function(error, response, body){
                            let orderId = JSON.parse(body).orderId;
                                if(JSON.parse(body).status.statusCode === 'SUCCESS'){
                                    user.courses.push({
                                        orderId: orderId,
                                        courseId: productCourse,
                                        status: 'PENDING'
                                    });
                                    user.save(function(err){
                                        if(err){
                                            res.json({ success: false, message: err })
                                        } else {
                                            res.status(200).send({ success: true, body: JSON.parse(body), message: 'Redirecting...' })
                                        }
                                    })
                                }
                            });
                        }
                    })
            })
        } else {
            res.json({ success: false, message: 'You have no any course' })
        }
    })   
    //Notify from PayU about order state 
    router.post('/notify/:id', function(req, res){
        let splitHeader = req.headers["openpayu-signature"].split(';');
        let splitSig = splitHeader[1].split('=');
        let bodyNotify = JSON.stringify(req.body);
        let second_key = 'second key from your account';
        let cryptoHash = crypto.createHash('md5').update(bodyNotify + second_key).digest('hex');
        if(req.body.order.status === 'COMPLETED' && splitSig[1] === cryptoHash){
            User.findOneAndUpdate({ _id: req.params.id , "courses.orderId": req.body.order.orderId }, { $set: {
                'courses.$.status': req.body.order.status,
                'courses.$.date': new Date(),
                'courses.$.totalAmount': parseInt(req.body.order.totalAmount)/100,
                'courses.$.products': req.body.order.products
            } }, { new: true, upsert: true }, function(err, user){
                    res.json({ success: true, message: 'Thank you for your trust and purchase the course' })
            });
        } else {
            res.sendStatus(302)
        }
    })
    //Post comment to course
    router.post('/comment', tokenAuth, function(req, res) {  
        if(!req.body.comment) {
            res.json({ success:false, message: 'Comment not provided' })
        } else {
            if(!req.body._id) {
                res.json({ success:false, message: 'Course no found' });
            } else {
                Product.findOne({ _id: req.body._id }, function(err, product){  
                    if(err) {
                        res.json({ success:false, message: err })
                    } else {
                        if(!product){
                            res.json({ success:false, message: 'Course no found'})
                        } else { 
                            User.findOne({ username: req.decoded.username }, function(err, user){   
                                if(err){
                                    res.json({ success:false, message: err })
                                } else if (!user) { 
                                    res.json({ success: false, message: 'User no found'});
                                } else {
                                    product.comments.push({
                                        body: req.body.comment,
                                        author: user.username,
                                        date: new Date(),   
                                        number: product.comments.length + 1,
                                    });
                                    product.save(function(err, comment){
                                        if(err){
                                            res.json({ success: false, message: err });
                                        } else {
                                            res.json({ success: true, message: 'Comment has been added!', comment: comment.comments[comment.comments.length-1], id: req.body._id })
                                        }
                                    })                 
                                }
                            }) 
                        }
                    } 
                })
            }
        }
    });
    router.post('/comment/reply', tokenAuth, function(req, res) {  
        if(!req.body.reply){
            res.json({ success: false, message: 'Comment reply no provided' })
        } else {
            User.findOne({ username: req.decoded.username }, function(err, user){ 
                if(err) {
                    res.json({ success:false, message: err })
                }
                if(!user){
                    res.json({ success: false, message: 'User no found' })
                } else {
                    Product.findOne({ _id: req.body._id }, function(err, product){
                        if(err) {
                            res.json({ success:false, message: err })
                        }
                        if(!product){
                            res.json({ success: false, message: 'Course no found' })
                        } else {
                            product.comments.id(req.body.commentId).reply.push({
                                body: req.body.reply,
                                author: user.username,
                                date: new Date()
                            });
                            product.save(function(err, comment){
                                if(err){
                                    res.json({ success: false, message: err })
                                } else {
                                    res.json({ success: true, message: 'Your opinion has been added!', reply: comment.comments.id(req.body.commentId).reply[comment.comments.id(req.body.commentId).reply.length - 1] })
                                }
                            })
                        }
                    })
                }
            })
        }
    });
    //Add course to shopping cart
    router.get('/addToCart/:id', tokenAuth, function(req, res){
        let cartProduct = req.params.id;
        let cart = new Cart(req.session.cart ? req.session.cart : {});

        User.findOne({ username: req.decoded.username }, function(err, mainUser){
            if(err) {
                res.json({ success: false, message: err })
            }
            if(!mainUser){
                res.json({ success: false, message: 'You must be logged in to buy a course'})
            } else {
                if(objectid.isValid(cartProduct)){
                    Product.findOne({ _id : req.params.id }, function(err, product){ 
                        if(err) {
                            res.json({ success: false, message: err })
                        }
                        if(!product){
                            res.json({success:false, message: 'Course no found'});
                        } else {
                            cart.add(product, product.id);
                            req.session.cart = cart;
                            res.json({ success:true, product: product, cart:cart });
                        }
                    })
                } else {
                    res.json({ success: false, message: 'Something wrong' }) 
                }
            }
        })
    });
    //Remove course from shopping cart
    router.get('/removeFromCart/:id', tokenAuth, function(req, res, next){
        let cartProduct = req.params.id;
        let cart = new Cart(req.session.cart ? req.session.cart : {})
        User.findOne({ username: req.decoded.username },function(err, mainUser){
            if(err) {
                res.json({ success: false, message: err })
            }
            if (!mainUser){
                res.json({ success: false, message: 'User no found'})
            } else {
                cart.reduceByOne(cartProduct);
                req.session.cart = cart;
                if(cart.totalQty == undefined){                         
                    req.session.destroy();
                }
                res.json({ success: true, cart: cart});
            }
        })
    });
    //Get shopping cart from session
    router.get('/cart', tokenAuth, function(req, res){
        let session = res.locals.session.cart
        if(!req.session.cart){
           res.json({success: false, message: 'Shopping cart is empty'}) 
        } else {
            let cart = new Cart(req.session.cart);
            res.json({success: true, session: session, product: cart.generateArray()})
        }       
    });

    router.get('/payments', tokenAuth, function(req,res){
        if(req.session.cart){
            res.json({ success: true, session: req.session })
        } else { 
            res.json({ success: false })
        }
    })
    //Make order as private person
    router.post('/orders', tokenAuth, function(req, res){
        if(!req.session.order){
            let order = new Order(req.session.order ? req.session.order : {}); 
            order.username      = req.decoded.username; 
            order.name          = req.body.receiptName;
            order.street        = req.body.receiptStreet;
            order.homeNumber    = req.body.receiptHomeNumber;
            order.postCode      = req.body.receiptPostCode;
            order.city          = req.body.receiptCity;
            order.country       = req.body.receiptCountry;
            order.date          = new Date();        
            User.findOne({ username: req.decoded.username }, function(err, mainUser){
                if(err) {
                    res.json({ success: false, message: err })
                }
                if(!mainUser) {
                    res.json({ success: false, message: 'User no found' })
                } else {
                    if(req.decoded.username === null || req.decoded.username === '' || req.decoded.username === undefined) {
                        res.json({ success: false, message: 'You must be logged in to make a payment' })
                    } else if (req.body.receiptName === null || req.body.receiptName === '' || req.body.receiptStreet === null || req.body.receiptStreet === '' || req.body.receiptHomeNumber === null || req.body.receiptHomeNumber === '' || req.body.receiptPostCode === null || req.body.receiptPostCode === '' || req.body.receiptCity === null || req.body.receiptCity === '' || req.body.receiptCountry === null || req.body.receiptCountry === '') {
                        res.json({ success: false, message: 'Make sure you have filled in all the fields correctly' })
                    } else {
                        order.save(function(err){
                            if(err){
                                if(err.errors != null) {
                                    if(err.errors.name){
                                        res.json({ success:false, message: err.errors.name.message })
                                    } else if(err.errors.street){
                                        res.json({ success: false, message: err.errors.street.message })
                                    } else if(err.errors.homeNumber){
                                        res.json({ success: false, message: err.errors.homeNumber.message })
                                    } else if(err.errors.postCode) {
                                        res.json({ success: false, message: err.errors.postCode.message })
                                    } else if(err.errors.city){
                                        res.json({ success: false, message: err.errors.city.message })
                                    } else if(err.errors.country){
                                        res.json({ success: false, message: err.errors.country.message })
                                    } else {
                                        res.json({ success: false, message: err })
                                    }
                                } else if(err) {
                                    if(err.code == 11000) {
                                        res.json({ success:false, message: 'You have already added data to the bill' })
                                    }
                                } else {
                                    res.json({ success: false, message: err })
                                }
                            } else {
                                req.session.order = order;
                                req.session.companyOrder = undefined;
                                res.json({ success: true, message: 'The account details have been filled out correctly', order: order })
                            }
                        })
                    }
                }
            })
        } else {
            Order.findOneAndUpdate({ _id: req.session.order._id }, { $set:{ 
                name: req.body.receiptName, 
                street: req.body.receiptStreet,
                homeNumber: req.body.receiptHomeNumber,
                postCode: req.body.receiptPostCode,
                city: req.body.receiptCity,
                country: req.body.receiptCountry,
                date: new Date()
            } }, { overwrite: true }, function(err, mainUser){
                if(err) {
                    res.json({ success: false, message: err })
                } else {
                    res.json({ success: true, message: 'Your details have been changed' })
                }
            })
            req.session.order.city = req.body.receiptCity;
            req.session.order.postCode = req.body.receiptPostCode;
            req.session.order.homeNumber = req.body.receiptHomeNumber;
            req.session.order.street = req.body.receiptStreet;
            req.session.order.name = req.body.receiptName; 
            req.session.order.country = req.body.receiptCountry; 
        }
    });
    //Make order as company
    router.post('/CompanyOrder', tokenAuth, function(req, res){
        if(!req.session.companyOrder){
            let companyOrder = new CompanyOrder(req.session.companyOrder ? req.session.companyOrder : {});           
            companyOrder.username      = req.decoded.username; 
            companyOrder.CompanyName   = req.body.companyName;
            companyOrder.NIP           = req.body.NIPNumber;
            companyOrder.CompanyStreet = req.body.companyStreet;
            companyOrder.homeNumber    = req.body.companyHomeNumber;
            companyOrder.postCode      = req.body.companyPostcode;
            companyOrder.city          = req.body.companyCity;
            companyOrder.country       = req.body.companyCountry;
            companyOrder.date          = new Date()
            User.findOne({ username: req.decoded.username }, function(err, mainUser){
                if(err) {
                    res.json({ success: false, message: err })
                }
                if(!mainUser) {
                    res.json({ success: false, message: 'User no found' })
                } else {
                    if(req.decoded.username === null || req.decoded.username === '' || req.decoded.username === undefined) {
                        res.json({ success: false, message: 'You must be logged in to make a payment' })
                    } else if (req.body.companyName === null || req.body.companyName === '' || req.body.NIPNumber === null || req.body.NIPNumber === '' || req.body.companyStreet === null || req.body.companyStreet === '' || req.body.companyHomeNumber === null || req.body.companyHomeNumber === '' || req.body.companyPostcode === null || req.body.companyPostcode === '' || req.body.companyCity === null || req.body.companyCity === '' || req.body.companyCountry === null || req.body.companyCountry === '') {
                        res.json({ success: false, message: 'Make sure you have filled in all the fields correctly' })
                    } else {
                        companyOrder.save(function(err){
                            if(err){ 
                                if(err.errors != null) {
                                    if(err.errors.name){
                                        res.json({ success:false, message: err.errors.name.message })
                                    } else if(err.errors.street){
                                        res.json({ success: false, message: err.errors.street.message })
                                    } else if(err.errors.homeNumber){
                                        res.json({ success: false, message: err.errors.homeNumber.message })
                                    } else if(err.errors.postCode) {
                                        res.json({ success: false, message: err.errors.postCode.message })
                                    } else if(err.errors.city){
                                        res.json({ success: false, message: err.errors.city.message })
                                    } else if(err.errors.country){
                                        res.json({ success: false, message: err.errors.country.message })
                                    } else {
                                        res.json({ success: false, message: err })
                                    }
                                } else if(err) {
                                    if(err.code == 11000) {
                                        res.json({ success:false, message: 'You have already added data to the bill' })
                                    }
                                } else {
                                    res.json({ success: false, message: err })
                                }
                            } else {
                                req.session.companyOrder = companyOrder;
                                req.session.order = undefined;
                                res.json({ success: true, message: 'The account details have been filled out correctly', companyOrder: companyOrder })
                            }
                        })
                    }
                }
            })
        } else {
            CompanyOrder.findOneAndUpdate({ _id: req.session.companyOrder._id }, {$set:{ 
                CompanyName:    req.body.companyName,
                NIP:            req.body.NIPNumber,
                CompanyStreet:  req.body.companyStreet,
                homeNumber:     req.body.companyHomeNumber,
                postCode:       req.body.companyPostcode,
                city:           req.body.companyCity,
                country:        req.body.companyCountry,
                date:           new Date()
            } }, { overwrite: true }, function(err){
                if(err) {
                    res.json({ success: false, message: err })
                } else {
                    res.json({ success: true, message: 'Your details have been changed' })
                }

            })
            req.session.companyOrder.CompanyName = req.body.companyName;
            req.session.companyOrder.CompanyStreet = req.body.companyStreet;
            req.session.companyOrder.NIP = req.body.NIPNumber;
            req.session.companyOrder.city = req.body.companyCity;
            req.session.companyOrder.country = req.body.companyCoutry;
            req.session.companyOrder.homeNumber = req.body.companyHomeNumber;
            req.session.companyOrder.postCode = req.body.companyPostcode;
        }
    });

    /**************************************EDIT USER ACCOUNT********************************************/
    //Get user data
    router.get('/profile/editAccount', tokenAuth,  function(req,res){
        User.findOne({ username: req.decoded.username }, function(err, user){
            if(err) {
                res.json({ success: false, message: err })
            }
            if(!user){
                res.json({ success: false, message: 'User no found' })
            } else {
                res.json({ success: true, user: user })
            }
        }) 
    });
    //Edit user data
    router.put('/profile/editAccount/editProfile', tokenAuth, function(req, res){
        let changeUsername = req.body.changeUsername;
        let changeEmail = req.body.changeEmail;
        let changeName = req.body.changeName;
        let changeBirthday = req.body.changeBirthday;
        User.findOne({ username: req.decoded.username }, function(err, user){
            if(err) {
                res.json({ success: false, message: err })
            }
            if(!user){
                res.json({ success: false, message: 'User no found' })
            } else {
                if((req.body.changeUsername == user.username && req.body.changeUsername !== req.decoded.username) || (req.body.changeEmail == user.email && req.body.changeEmail !== req.decoded.email)) {
                    res.json({ success: false, message: 'Username or email is already taken' })
                } else {
                    user.username = changeUsername;
                    user.email = changeEmail;
                    user.name = changeName;
                    user.birthday = changeBirthday;
                    user.save(function(err){
                        if(err) {
                            if(err.errors != null) {
                                if(err.errors.name){
                                    res.json({ success:false, message: err.errors });  
                                } else if(err.errors.email){
                                    res.json({ success:false, message:err.errors })
                                } else if(err.errors.username){
                                    res.json({ success:false, message:err.errors })
                                } else if(err.errors.password){
                                    res.json({ success:false, message:err.errors.password.message })
                                } else {
                                    res.json({success: false, message: err})
                                }                      
                            } else if (err) {
                                if(err.code == 11000) {
                                    if(err.errmsg[61] == 'u'){
                                        res.json({success: false, message: "This username is already taken"})
                                    } else if(err.errmsg[61] == "e") {
                                        res.json({success: false, message: "This email address is already taken"})
                                    }
                                } else {
                                    res.json({ success: false, message:err })
                                }
                            } 
                        } else {
                            var token = jwt.sign({ username: user.username, email: user.email }, secret, { expiresIn: '24h' })
                            res.json({ success: true,  message: 'Your details have been changed' , token: token, user: user })
                        }
                    })
                }
            }
        })
    });
    //Check new username on blur input
    router.post('/profile/checkusername', tokenAuth, function(req,res){
        User.findOne({ username: req.body.changeUsername }).select('username').exec(function(err,user){
            if(err) {
                res.json({ success: false, message: err })
            }
            if(req.body.changeUsername == req.decoded.username) {
                res.json({ success:true, message: 'Username is correct' })
            } else if(!user) {
                res.json({ success:true, message: 'Username is correct' })
            } else {
                res.json({ success: false, message: 'This username is already taken' })
            }
        })
    }); 
    //Check email address on blur input
    router.post('/profile/checkemail', tokenAuth, function(req, res){
        User.findOne({ email: req.body.changeEmail }).select('email').exec(function(err,email){
            if(err) {
                res.json({ success: false, message: err })
            }
            if(req.body.changeEmail == req.decoded.email) {
                res.json({ success:true, message: 'Email address is correct' })
            } else if(!email) {
                res.json({ success:true, message: 'Email address is correct' })
            } else {
                res.json({ success: false, message: 'This email address is already taken' })
            }
        })
    });
    //Check current password on blur input
    router.post('/profile/checkpassword', tokenAuth, function(req, res){
        User.findOne({ username: req.decoded.username }).select('username password').exec(function(err, user){
            if(err) {
                res.json({ success: false, message: err })
            }
            if(!user){
                res.json({ success: false, message: 'User no found' })
            } else {
                if(!req.body.currentPass) {
                    res.json({ success: false, message: 'Incorrect password' })
                } else {
                    var validPassword = user.comparePassword(req.body.currentPass);
                    if(!validPassword){
                        res.json({ success: false, message: 'Incorrect password' })
                    } else {
                        res.json({ success: true, message: 'Correct password' })
                    }
                }
            }
        })
    });
    //Compare passwords on blur input
    router.post('/profile/comparepassword', tokenAuth, function(req, res){
        User.findOne({ username: req.decoded.username }).select('username password').exec(function(err, user){
            if(err) {
                res.json({ success: false, message: err })
            }
            if(!user){
                res.json({ success: false, message: 'User no found' })
            } else if (!req.body.currentPass) {
                res.json({ success: false, message: 'Incorrect current password' })
            } else  {
                if(user.comparePassword(req.body.newPass)) {
                    res.json({ success: false, message: 'New password must be different from the previous one' })
                } else {
                    res.json({ success: true })
                }
            }
        })
    });
    router.put('/profile/savenewpassword', tokenAuth, function(req, res){
        User.findOne({ username: req.decoded.username }).select('username password').exec(function(err, user){
            if(err) {
                res.json({ success: false, message: err })
            }
            if(req.body.newPass === null || req.body.newPass === '' || req.body.newPass === undefined) {
                res.json({ success: false, message: 'Pasword not provided' })
            } else if (req.body.newPass !== req.body.confirmPass) {
                res.json({ success: false, message: 'Passwords do not match' })
            } else {
                var checkPassword = user.comparePassword(req.body.currentPass)
                if(checkPassword){
                    if(user.comparePassword(req.body.newPass)) {
                        res.json({ success: false, message: 'New password must be different from the previous one' })
                    } else {
                        user.password = req.body.newPass;
                        user.save(function(err){
                            if(err) {
                                res.json({ success: false, message: err })
                            } else {
                                res.json({ success: true, message: 'Password has been changed!' })
                            }
                        })
                    }
                } else {
                    res.json({ success: false, message: 'Current password is invalid' })
                }
            }
        })
    })  
    
/***********************************ADMIN DASHBOARD ROUTES*****************************************/
    //Token to admin dashboard
    function tokenAdminAuth(req, res, next){
        let token = req.body.token || req.body.query || req.headers['authorization']
        if(token){
            jwt.verify(token.replace('Bearer ',''), adminSecret, function(err,decoded){
                if(err){
                    res.json({ adminAuthenticated: false, message:'Invalid token'})
                } else {
                    req.admin = decoded;
                    next()
                }
            })
        } else {
            res.json({success:false, message:'No token provided'});
        }
    }
    //Upload files e.g. photos to article or course header
    router.post('/dashboard/admin/upload', function(req, res) {
        upload(req, res, function(err) {
            if (err) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    res.json({ success: false, message: 'File is too large. Max 10MB' });
                } else if (err.code === 'filetype') {
                    res.json({ success: false, message: 'Invalid file type. Must be .png' });
                } else {
                    res.json({ success: false, message: 'Can not load the file' });
                }
            } else {
                if (!req.files) {
                    res.json({ success: false, message: 'No file selected' });
                } else {
                    res.json({ success: true, message: 'File loaded!' });
                }
            }
        });
    });
    //Create admin account
    router.post('/dashboard/admin', tokenAuth, function(req, res){
        User.findOne({ username: req.decoded.username }).select('username email permission name').exec(function(err, user){
            if(err){
                res.json({ success: false, message: err })
            }
            if(user.permission !== 'admin'){
                res.json({ success: false, message: 'You are not an admin'})
            } else if(req.body.secretAdmin == null || req.body.secretAdmin == '' || req.body.secretAdmin == undefined){
                res.json({ success: false, message: 'No password provided' })
            } else if(req.body.secretAdmin !== req.body.confirmSecretAdmin){
                res.json({ success: false, message: 'The passwords do not match' })
            } else {
                let admin = new Admin();
                admin.email = user.email;
                admin.username = user.username;
                admin.name = user.name;
                if(user.permission == 'admin'){
                    admin.permission = 'AuthAdmin';
                } else {
                    admin.permission = user.permission;
                }
                admin.temporaryAdminToken = jwt.sign({ username: user.username, email: user.email }, adminSecret, { expiresIn: '24h' });
                admin.secret = req.body.secretAdmin;
                admin.save(function(err){
                    if(err) {
                        if(err.code == 11000) {
                            res.json({ success: false, message:'You already have a password'})
                        } else {
                            res.json({success: false, message:err})
                        }
                    } else {
                        let emailToAdmin = {
                            from: 'xyz',
                            to: 'admin email',
                            subject: 'Activation link',
                            text: 'Hello ' + admin.name + ',this is your activation link to admin account: http://localhost:8080/dashboard/admin/activate/' + admin.temporaryAdminToken,
                            html: 'Hello<strong> ' + admin.name + '</strong>,<br><br>this is your activation link to admin account:<br><br><a href="http://localhost:8080/dashboard/admin/activate/' + admin.temporaryAdminToken + '">http://localhost:8080/dashboard/admin/activate/</a>'
                        };
                        client.sendMail(emailToAdmin, function(err, info){
                            if(err){
                                res.json({ success: false, message: err })
                            } else {
                                res.json({ success: true, message: 'Password added correctly, check your email'})
                            }
                        });
                    }
                })
            }
        })
    });
    //Activate admin account
    router.put('/dashboard/admin/activate/:token', tokenAuth, function(req,res){
        Admin.findOne({temporaryAdminToken: req.params.token}, function(err, user){
            if(err) {
                res.json({ success: false, message: err })
            }
            let token = req.params.token;
            jwt.verify(token, adminSecret , function(err, decoded){
                if(err){
                    res.json({success:false, message:'The activation link is no longer active.'});
                } else if(!user) {
                    res.json({success:false, message:'The activation link is no longer active.'})
                } else {
                    user.temporaryAdminToken = false;
                    user.activeAdmin = true;
                    user.save(function(err){
                        if(err){
                            res.json({ success: false, message: err })
                        } else {
                            res.json({success:true, message:'Account active!'});
                        }
                    });
                }
            })
        })
    });
    router.post('/dashboard/admin/resend', tokenAuth, function(req,res){
        Admin.findOne({ username: req.body.username }).select('permission activeAdmin').exec(function(err,user){
            if(err) {
                res.json({ success: false, message: err })
            }
            if(!user){
                res.json({success:false, message:'User no found'});
            } else if(user){
                if(req.body.username == '' || req.body.username == null || req.body.username == undefined || req.body.secretAdmin == '' || req.body.secretAdmin == null || req.body.secretAdmin == undefined) {
                    res.json({ success: false, message: 'Make sure that you have filled in the form correctly '})
                } else {
                    let validSecret = user.compareSecret(req.body.secretAdmin);
                    if(validSecret){
                        if(user.permission == 'AuthAdmin'){
                            if(user.activeAdmin) {
                                res.json({success:false, message:'Account has already been activated'});
                            } else {
                                res.json({success:true, user:user})
                            }
                        } else {
                            res.json({ success: false, message: 'What are you doing here!?'})
                        }
                    } else {
                        res.json({success: false, message:'Invalid password'});
                    }  
                } 
            }            
        })        
    });
    router.put('/dashboard/admin/resend', tokenAuth, function(req,res){
        Admin.findOne({ username:req.body.username }).select('username name email temporaryAdminToken').exec(function(err,user){
            if(err) {
                res.json({ success: false, message: err })
            }
            user.temporaryAdminToken = jwt.sign({ username: user.username, email:user.email }, adminSecret, { expiresIn: '24h' });
            user.save(function(err){
                if(err){
                    res.json({ success: false, message: err })
                } else {
                    let emailToAdmin = {
                        from: 'xyz',
                        to: 'admin email',
                        subject: 'Activation Link',
                        text: 'Hello ' + user.name + ',this is your activation link to admin account: http://localhost:8080/dashboard/admin/activate/' + user.temporaryAdminToken,
                        html: 'Hello<strong> ' + user.name + '</strong>,<br><br>this is your activation link to admin account:<br><br><a href="http://localhost:8080/dashboard/admin/activate/' + user.temporaryAdminToken + '">http://localhost:8080/dashboard/admin/activate/</a>'
                    };
                    client.sendMail(emailToAdmin, function(err, info){
                        if(err) {
                            res.json({ success: false, message: err })
                        }
                    });
                    res.json({success:true, message:'Activation link has been sent to email address'})
                }
            });
        });
    });
    //Authenticate admin account
    router.post('/dashboard/admin/authenticate', tokenAuth, function(req, res){
        Admin.findOne({ username: req.body.admin }).select('email username secret permission activeAdmin').exec(function(err, user){
            if(err) {
                res.json({ success: false, message: err })
            }
            if(!user){
                res.json({ succes: false, message: 'User no found' })
            } else {
                if(user.permission == 'AuthAdmin') {
                    let validSecret = user.compareSecret(req.body.secret);
                    if(!validSecret){
                        res.json({ success: false, message: 'Invalid password' })
                    } else if(!user.activeAdmin){
                        res.json({ success: false, message: 'The account has not been activated', expired: true })
                    } else {
                        let token = jwt.sign({ username: user.username, email: user.email }, adminSecret, { expiresIn: '24h' })
                        res.json({ success: true, message: 'Logged in correctly!', token: token, permission: user.permission })
                    }
                } else {
                    res.json({ success: false, message: 'You are not an admin!!!' })
                }
            }
        })
    });
    router.post('/admin/me', tokenAdminAuth, function(req,res){
        res.send(req.admin)
    });
    //Edit admin account
    router.get('/dashboard/admin/profile/edit', tokenAdminAuth,  function(req,res){
        Admin.findOne({ username: req.admin.username }, function(err, admin){
            if(err) {
                res.json({ success: false, message: err })
            }
            if(!admin){
                res.json({ success: false, message: 'Admin no found' })
            } else {
                res.json({ success: true, admin: admin })
            }
        }) 
    });
    //Check whether admin username exist
    router.post('/dashboard/admin/profile/checkusername', tokenAdminAuth, function(req,res){
        Admin.findOne({ username: req.body.changeUsername }).select('username').exec(function(err,user){
            if(err) {
                res.json({ success: false, message: err })
            } else {
                User.find({}).select('username permission').exec(function(err, username){
                    if(err) {
                        res.json({ success: false, message: err })
                    } else {
                        let userUsername = username.find(function(nick){
                            return (nick.username === req.body.changeUsername && nick.permission !== 'admin')
                        })
                        if(req.body.changeUsername === req.admin.username) {
                            res.json({ success:true, message: 'Username correct' })
                        } else if(!user && !userUsername) {
                            res.json({ success:true, message: 'Username correct' })
                        } else {
                            res.json({ success: false, message: 'This username is already taken' })
                        }    
                    }
                })                
            }
        })
    }); 
    //Check whether admin email exist
    router.post('/dashboard/admin/profile/checkemail', tokenAdminAuth, function(req,res){
        Admin.findOne({ email: req.body.changeEmail }).select('email').exec(function(err,user){
            if(err) {
                res.json({ success: false, message: err })
            } else {
               User.find({}).select('email permission').exec(function(err, emails){
                    if(err) {
                        res.json({ success: false, message: err })
                    } else {
                        let userEmail = emails.find(function(email){
                            return (email.email === req.body.changeEmail && email.permission !== 'admin')
                        })
                        if(req.body.changeEmail === req.admin.email) {
                            res.json({ success:true, message: 'Email address correct' })
                        } else if(!user && !userEmail) {
                            res.json({ success:true, message: 'Email address correct' })
                        }  else {
                            res.json({ success: false, message: 'This email address is already taken' })
                        }   
                    }
                    
                }) 
            }
        });
    }); 
    //Save changes in admin account
    router.put('/dashboard/admin/profile/save', tokenAdminAuth, function(req, res){
        let changeUsername = req.body.changeUsername;
        let changeEmail = req.body.changeEmail;
        let changeName = req.body.changeName;
        let changeBirthday = req.body.changeBirthday;
        Admin.find({}).select('username email').exec(function(err, admin){ 
            if(err){
                res.json({ success: false, message: err })
            } else {
                let adminEmail = admin.find(function(email){
                    return email.email === req.body.changeEmail
                })
                let adminUsername = admin.find(function(nick){
                    return nick.username === req.body.changeUsername
                })
                User.find({}).select('username email permission').exec(function(err, user){
                    if(err){
                        res.json({ success: false, message: err })
                    } else {
                        let userEmail = user.find(function(email){
                            return (email.email === req.body.changeEmail && email.permission !== 'admin')
                        })
                        let userUsername = user.find(function(nick){
                            return (nick.username === req.body.changeUsername && nick.permission !== 'admin')
                        })
                        if(((adminEmail || userEmail) && changeEmail !== req.admin.email) || ((adminUsername || userUsername) && changeUsername !== req.admin.username)){
                            res.json({ success: false, message: 'Username or email address is already taken' })
                        } else {
                            Admin.findOne({ username: req.admin.username }, function(err, edit){
                                if(err){
                                    res.json({ success: false, message: err })
                                } else {
                                    edit.username = changeUsername;
                                    edit.email = changeEmail;
                                    edit.name = changeName;
                                    edit.save(function(err){
                                        if(err) {
                                            if(err.errors != null) {
                                                if(err.errors.name){
                                                    res.json({ success:false, message: err.errors });  
                                                } else if(err.errors.email){
                                                    res.json({ success:false, message:err.errors })
                                                } else if(err.errors.username){
                                                    res.json({ success:false, message:err.errors })
                                                } else if(err.errors.password){
                                                    res.json({ success:false, message:err.errors.password.message })
                                                } else {
                                                    res.json({success: false, message: err})
                                                }                      
                                            } else if (err) {
                                                if(err.code == 11000) {
                                                    if(err.errmsg[61] == 'u'){
                                                        res.json({success: false, message: "This username is already taken"})
                                                    } else if(err.errmsg[61] == "e") {
                                                        res.json({success: false, message: "This email address is already taken"})
                                                    }
                                                } else {
                                                    res.json({ success: false, message:err })
                                                }
                                            } 
                                        } else {
                                            let token = jwt.sign({ username: edit.username, email: edit.email }, adminSecret, { expiresIn: '24h' })
                                            res.json({ success: true,  message: 'Your details has been changed' , token: token, admin: edit })
                                        }
                                    })
                                }
                            }) 
                        }                        
                    }
                })    
            }
        })
    });
    //Check current password
    router.post('/dashboard/admin/profile/checkpassword', tokenAdminAuth, function(req, res){
        Admin.findOne({ username: req.admin.username }).select('username email secret').exec(function(err, user){
            if(err) {
                res.json({ success: false, message: err })
            }
            if(!user){
                res.json({ success: false, message: 'User no found' })
            } else {
                if(!req.body.currentPass) {
                    res.json({ success: false, message: 'Invalid password' })
                } else {
                    var validPassword = user.compareSecret(req.body.currentPass);
                    if(!validPassword){
                        res.json({ success: false, message: 'Invalid password' })
                    } else {
                        res.json({ success: true, message: 'Password correct!' })
                    }
                }
            }
        })
    });
    //Compare passwords
    router.post('/dashboard/admin/profile/comparepassword', tokenAdminAuth, function(req, res){
        Admin.findOne({ username: req.admin.username }).select('secret').exec(function(err, user){
            if(err) {
                res.json({ success: false, message: err })
            }
            if(!user){
                res.json({ success: false, message: 'User no found' })
            } else if (!req.body.newPass) {
                res.json({ success: false, message: 'Inavlid password' })
            } else  {
                if(user.compareSecret(req.body.newPass)) {
                    res.json({ success: false, message: 'The new password must be different from the previous one' })
                } else {
                    res.json({ success: true })
                }
            }
        })
    });
    //Save new password
    router.put('/dashboard/admin/profile/savenewpassword', tokenAdminAuth, function(req, res){
        Admin.findOne({ username: req.admin.username }).select('email username secret').exec(function(err, user){
            if (err) {
                res.json({ success: false, message: err })
            }
            if(req.body.newPass === null || req.body.newPass === '' || req.body.newPass === undefined) {
                res.json({ success: false, message: 'No password provided' })
            } else if (req.body.newPass !== req.body.confirmPass) {
                res.json({ success: false, message: 'Passwords do not match' })
            } else {
                let checkPassword = user.compareSecret(req.body.currentPass)
                if(checkPassword){
                    if(user.compareSecret(req.body.newPass)) {
                        res.json({ success: false, message: 'The new password must be different from the previous one' })
                    } else {
                        user.secret = req.body.newPass;
                        user.save(function(err){
                            if(err) {
                                res.json({ success: false, message: err })
                            } else {
                                res.json({ success: true, message: 'Password has been changed!' })
                            }
                        })
                    }
                } else {
                    res.json({ success: false, message: 'Current password is invalid' })
                }
            }
        })
    })
    //Renew token
    router.get('/admin/renewToken/username', tokenAdminAuth, function(req, res){
        Admin.findOne({ username: req.admin.username }).select('username email').exec(function(err,user){
            if(err) {
                res.json({ success: false, message: err })
            }
            if(!user) {
                res.json({ success:false, message: 'User no found'});
            } else {
                let newAdminToken = jwt.sign({username: user.username, email: user.email }, adminSecret, { expiresIn: '24h' });
                res.json({ success:true, token: newAdminToken });
            }
        })
    });
    //Get admin permission
    router.get('/admin/permission', tokenAdminAuth, function(req, res){
        Admin.findOne({ username: req.admin.username }, function(err, user) {
            if(err) {
                res.json({ success: false, message: err })
            }
            if(!user) {
                res.json({ success: false, message: 'User no found'});
            } else {  
                res.json({ success: true, permission: user.permission });
            }
        });
    });
    //Get all users and manage them
    router.get('/dashboard/admin/management', tokenAdminAuth, function(req, res) {
        User.find({}, function(err, users) {
            if(err){
                res.json({ success: false, message: err })
            } else {
                Admin.findOne({ username: req.admin.username }, function(err, admin) {
                    if(err) {
                        res.json({ success: false, message: err })
                    };
                    if(!admin) {
                        res.json({ success: false, message: 'Admin no found' });
                    } else {
                        if(admin.permission === 'AuthAdmin') {
                            if(!users){
                                res.json({ success: false, message: 'Users no found'});
                            } else {
                                let allUsers = users.filter(function(item){
                                    return item.username !== req.admin.username
                                })
                                res.json({ success: true, users: allUsers, permission: admin.permission });
                            }
                        } else {
                            res.json({ success: false, message: "You don't have the right permission" });
                        }
                    }
                }); 
            }
        });
    });
    //Get user detail 
    router.get('/dashboard/admin/users/edit/:id', tokenAdminAuth, function(req, res) {
        let editUser = req.params.id;
        Admin.findOne({ username: req.admin.username }, function(err, admin) {
            if(err) {
                res.json({ success: false, message: err })
            };
            if(!admin) {
                res.json({ success: false, message: 'Admin no found'});
            } else {
                if(admin.permission === 'AuthAdmin') {
                    User.findOne({ _id: editUser }, function(err,user) {
                        if(err) {
                            res.json({ success: false, message: err })
                        };
                        if(!user) {
                            res.json({ success: false, message: 'User no found' });
                        } else {
                            res.json({ success: true, user: user, permission: admin.permission });
                        }
                    })
                } else {
                    res.json({ success: false, message: "You don't have the right permission" });
                }
            }
        });
    });
    //Save changes user details
    router.put('/dashboard/admin/users/edit', tokenAdminAuth, function(req, res){
        let editUser = req.body._id;
        if(req.body.name) var newName = req.body.name;
        if(req.body.username) var newUsername = req.body.username;
        if(req.body.email) var newEmail = req.body.email;
        if(req.body.permission) var newPermission = req.body.permission;
        Admin.findOne({ username: req.admin.username }, function(err, admin) {
            if(err) {
                res.json({ success: false, message: err })
            };
            if(!admin) {
                res.json({ success: false, message: 'Admin no found'});
            } else {
                if(newName){
                    if(admin.permission ==='AuthAdmin') {
                        User.findOne({ _id: editUser }, function(err, user) {
                            if(err) {
                                res.json({ success: false, message: err })
                            };
                            if(!user) {
                                res.json({ success: false, message: 'User no found' });
                            } else {
                                user.name = newName;
                                user.save(function(){
                                    res.json({ success: true, message: 'Name has been changed!', permission: admin.permission });
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: "You don't have the right permission"})
                    }
                }
                if(newUsername) {
                    if(admin.permission === 'AuthAdmin') {
                        User.findOne({ _id:editUser }, function(err, user){
                            if(err) {
                                res.json({ success: false, message: err })
                            };
                            if(!user) {
                                res.json({ success: false, message: 'User no found' });
                            } else {
                                user.username = newUsername;
                                user.save(function(err){
                                    res.json({ success: true, message: 'Username has been changed!', permission: admin.permission });
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: "You don't have the right permission" });
                    }
                }
                if(newEmail) {
                    if(admin.permission === 'AuthAdmin') {
                        User.findOne({ _id: editUser }, function(err, user) {
                            if(err) {
                                res.json({ success: false, message: err })
                            };
                            if(!user){
                                res.json({ success: false, message: 'User no found' });
                            } else {
                                user.email = newEmail;
                                user.save(function(err){
                                    res.json({ success: true, message: 'Email address has been changed', permission: admin.permission });
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: "You don't have the right permission" });
                    }
                }
                if(newPermission) {
                    if(admin.permission === 'AuthAdmin'){
                        User.findOne({ _id: editUser}, function(err,user){
                            if(err) {
                                res.json({ success: false, message: err })
                            };
                            if(!user) {
                                res.json({ success: false, message: 'User no found' });
                            } else {
                                if(newPermission === 'user' || 'admin'){
                                    user.permission = newPermission;
                                    user.save(function(err) {
                                        res.json({ success: true, message: 'User permission has been changed', permission: admin.permission });
                                    });                                
                                } else {
                                    res.json({ succes: false, message: 'Incorrect permission' })
                                }
                            }
                        });
                    } else {
                        res.json({ success: false, message: "You don't have the right permission"})
                    }
                }
            }
        })
    })
    //Get content of "About us" page
    router.get('/dashboard/admin/aboutme/edit', tokenAdminAuth, function(req,res){
        AboutUs.find({}, function(err, about){
            if(err){
                res.json({ success: false, message: err })
            } else {
                res.json({ success: true, about: about[0] })
            } 
        })      
    })
    //Edit content of "About us" page
    router.put('/dashboard/admin/aboutme/edit', tokenAdminAuth, function(req,res){
        AboutUs.find({}, function(err, about){
            let type, des;
            if(err){
                res.json({ success: false, message: err })
            } else {
                if(about.length === 0 || about === undefined || about === null){
                    let aboutUs = new AboutUs();
                    if(req.body.description){
                        aboutUs.author = req.body.description;
                        type = 'description';
                        des = 'Author description has been added';
                    } else {
                        aboutUs.blog = req.body.blog;
                        type = 'blog';
                        des = 'Blog description has been added'
                    }
                    aboutUs.save(function(err, item){
                        if(err){
                            res.json({ success: false, message: err, type: type  })
                        } else {
                            res.json({ success: true, message: des , type: type, about: item })
                        }
                    })
                } else {
                    if(req.body.description){
                        about[0].author ? des = 'Author description has been updated' : des = 'Author description has been added';
                        about[0].author = req.body.description;
                        type = 'description';
                    } else {
                        about[0].blog ? des = 'Blog description has been updated' : des = 'Blog description has been added';
                        about[0].blog = req.body.blog;
                        type = 'blog';
                    }
                    about[0].save(function(err, item){
                        if(err){
                            res.json({ success: false, message: err, type: type })
                        } else {
                            res.json({ success: true, message: des , type: type, about: item })
                        }
                    })
                }                
            }
        })
    })
    //Remove user account
    router.delete('/dashboard/admin/users/:username', tokenAdminAuth, function(req, res){
        let deletedUser = req.params.username;
        Admin.findOne({ username: req.admin.username }, function(err, admin) {
            if(err) {
                res.json({ success: false, message: err })
            };
            if(!admin) {
                res.json({ success: false, message: 'Admin no found' });
            } else {
                if(admin.permission !== 'AuthAdmin') {
                    res.json({ success: false, message: "You don't have the right permission" })
                } else {
                    User.findOneAndRemove({ username: deletedUser }, function(err, user){
                        if(err) {
                            res.json({ success: false, message: err })
                        }
                        res.json({ success: true, message: 'The user has been removed!' });
                    });
                }
            }
        });
    });
    //Edit course
    router.get('/dashboard/admin/editProduct/:id',tokenAdminAuth, function(req, res) {
        let editProduct = req.params.id;
        Admin.findOne({ username: req.admin.username }, function(err, admin) {
            if(err) {
                res.json({ success: false, message: err })
            }
            if(!admin) {
                res.json({ success: false, message: 'Admin no found'});
            } else {
                if(admin.permission === 'AuthAdmin') {
                    Product.findOne({ _id: editProduct }, function(err, product) { 
                        if(err) {
                            res.json({ success: false, message: err })
                        }
                        if(!product) {
                            res.json({ success: false, message: 'Course no found' });
                        } else {
                            res.json({ success: true, product: product });
                        }
                    })
                } else {
                    res.json({ success: false, message: "You don't have the right permission" });
                }
            }
        });
    });
    //Save changes in course
    router.put('/dashboard/admin/editProduct', tokenAdminAuth,function(req, res){
        var editProduct = req.body._id;
        if(req.body.title)          var newTitle = req.body.title;
        if(req.body.subTitle)       var newSubtitle = req.body.subTitle;
        if(req.body.oldPrice)       var newOldPrice = req.body.oldPrice;
        if(req.body.description)    var newDescription = req.body.description;
        if(req.body.newPrice)       var newNewPrice = req.body.newPrice;
        if(req.body.addDescription) var addDescription = req.body.addDescription;
        if(req.body.level)          var newLevel = req.body.level;
        if(req.body.body)           var newBody = req.body.body;
        if(req.body.imagePath)      var newImage = req.body.imagePath;
        if(req.body.introText)      var newIntroText = req.body.introText;
        if(req.body.authorName)     var authorName = req.body.authorName;
        if(req.body.authorEdu)      var authorEdu = req.body.authorEdu;
        if(req.body.authorDes)      var authorDes = req.body.authorDes;
        Admin.findOne({ username: req.admin.username }, function(err, admin) {
            if(err) {
                res.json({ success: false, message: err })
            };
            if(!admin) {
                res.json({ success: false, message: 'Admin no found'});
            } else {
                if(newImage){
                    if(admin.permission === 'AuthAdmin') {
                        Product.findOne({ _id: editProduct }, function(err, product){
                            if(err) {
                                res.json({ success: false, message: err })
                            };
                            if(!product){
                                res.json({ success: false, message: 'Course no found' })
                            } else {
                                product.imagePath = newImage;
                                product.save(function(){
                                    res.json({ success: true, message: 'The picture of the course has been changed', image: product.imagePath });
                                })
                            }
                            
                        })
                    } else {
                        res.json({ success: false, message: "You don't have the right permission" })
                    }
                }   
                if(authorName){
                    if(admin.permission === 'AuthAdmin') {
                        Product.findOne({ _id: editProduct }, function(err, product){
                            if(err) {
                                res.json({ success: false, message: err })
                            };
                            if(!product){
                                res.json({ success: false, message: 'Course no found' })
                            } else {
                                product.author.name = authorName;
                                product.save(function(){
                                    res.json({ success: true, message: "The author's name has been changed", authorName: product.author.name });
                                })
                            }
                            
                        })
                    } else {
                        res.json({ success: false, message: "You don't have the right permission" })
                    }
                }
                if(authorEdu){
                    if(admin.permission === 'AuthAdmin') {
                        Product.findOne({ _id: editProduct }, function(err, product){
                            if(err) {
                                res.json({ success: false, message: err })
                            };
                            if(!product){
                                res.json({ success: false, message: 'Course no found' })
                            } else {
                                product.author.education = authorEdu;
                                product.save(function(){
                                    res.json({ success: true, message: "The author's education has been changed", authorEdu: product.author.education });
                                })
                            }
                            
                        })
                    } else {
                        res.json({ success: false, message: "You don't have the right permission" })
                    }
                }
                if(authorDes){
                    if(admin.permission === 'AuthAdmin') {
                        Product.findOne({ _id: editProduct }, function(err, product){
                            if(err) {
                                res.json({ success: false, message: err })
                            };
                            if(!product){
                                res.json({ success: false, message: 'Course no found' })
                            } else {
                                product.author.description = authorDes;
                                product.save(function(){
                                    res.json({ success: true, message: 'The description about author has been changed', authorDes: product.author.description });
                                })
                            }
                            
                        })
                    } else {
                        res.json({ success: false, message: "You don't have the right permission" })
                    }
                }
                if(newBody){
                    if(admin.permission === 'AuthAdmin') {
                        Product.findOne({ _id: editProduct }, function(err, product){
                            if(err) {
                                res.json({ success: false, message: err })
                            };
                            if(!product){
                                res.json({ success: false, message: 'Course no found' })
                            } else {
                                product.body = newBody;
                                product.save(function(){
                                    res.json({ success: true, message: 'The content of the course has been changed', body: product.body });
                                })
                            }
                            
                        })
                    } else {
                        res.json({ success: false, message: "You don't have the right permission" })
                    }
                }
                if(newTitle){
                    if(admin.permission ==='AuthAdmin') {
                        Product.findOne({ _id: editProduct }, function(err, product) {
                            if(err) {
                                res.json({ success: false, message: err })
                            };
                            if(!product) {
                                res.json({ success: false, message: 'Course no found' });
                            } else {
                                product.title = newTitle;
                                product.save(function(){
                                    res.json({ success: true, message: 'The title of the subject has been changed!', title: product.title });
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: "You don't have the right permission"})
                    }
                }
                if(newSubtitle){
                    if(admin.permission === 'AuthAdmin') {
                        Product.findOne({ _id: editProduct }, function(err, product){
                            if(err) {
                                res.json({ success: false, message: err })
                            };
                            if(!product){
                                res.json({ success: false, message: 'Course no found' });
                            } else {
                                product.subTitle = newSubtitle;
                                product.save(function(){
                                    res.json({ success: true, message: 'The title of the subject has been changed!', subtitle: product.subTitle })
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: "You don't have the right permission"})
                    }
                }
                if(newOldPrice){
                    if(admin.permission === 'AuthAdmin') {
                        Product.findOne({ _id: editProduct }, function(err, product){
                            if(err) {
                                res.json({ success: false, message: err })
                            };
                            if(!product){
                                res.json({ success: false, message: 'Course no found' });
                            } else {
                                product.oldPrice = newOldPrice;
                                product.save(function(){
                                    res.json({ success: true, message: 'Old price has been changed!', oldPrice: product.oldPrice})
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: "You don't have the right permission" })
                    }
                }
                if(newNewPrice){
                    if(admin.permission === 'AuthAdmin') {
                        Product.findOne({ _id: editProduct }, function(err, product){
                            if(err) {
                                res.json({ success: false, message: err })
                            };
                            if(!product){
                                res.json({ success: false, message: 'Course no found' });
                            } else {
                                product.newPrice = newNewPrice;
                                product.save(function(){
                                    res.json({ success: true, message: 'New price has been changed!', newPrice: product.newPrice })
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: "You don't have the right permission" })
                    }
                }
                if(newDescription){
                    if(admin.permission === 'AuthAdmin') {
                        Product.findOne({ _id: editProduct }, function(err, product){
                            if(err) {
                                res.json({ success: false, message: err })
                            };
                            if(!product){
                                res.json({ success: false, message: 'Course no found' });
                            } else {
                                product.description = newDescription;
                                product.save(function(){
                                    res.json({ success: true, message: 'Description of the course has been changed!', description: product.description })
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: "You don't have the right permission" })
                    }
                }
                if(addDescription){
                    if(admin.permission === 'AuthAdmin') {
                        let options = { new: true };
                        Product.findOneAndUpdate({ _id: editProduct }, { $push: { description: req.body.addDescription }}, options, function(err, product){
                            if(err) {
                                res.json({ success: false, message: err })
                            };
                            if(!product){
                                res.json({ success: false, message: 'Course no found' });
                            } else {
                                product.save(function(){
                                    res.json({ success: true, message: 'Description of the course has been added!', description: product.description})
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: "You don't have the right permission" })
                    }
                }
                if(newLevel) {
                    if(admin.permission === 'AuthAdmin'){
                        Product.findOne({ _id: editProduct }, function(err,product){
                            if(err) {
                                res.json({ success: false, message: err })
                            };
                            if(!product) {
                                res.json({ success: false, message: 'Course no found' });
                            } else {
                                product.level = newLevel;
                                product.save(function() {
                                    res.json({ success: true, message: 'The level of the course has been changed', level: product.level });
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: "You don't have the right permission" })
                    }
                } 
                if(newIntroText){
                    if(admin.permission === 'AuthAdmin') {
                        Product.findOne({ _id: editProduct }, function(err, product){
                            if(err) {
                                res.json({ success: false, message: err })
                            };
                            if(!product){
                                res.json({ success: false, message: 'Course no found' })
                            } else {
                                product.introText = newIntroText;
                                product.save(function(){
                                    res.json({ success: true, message: 'Introduction to the course has ben changed', intro: product.introText });
                                })
                            }
                            
                        })
                    } else {
                        res.json({ success: false, message: "You don't have the right permission" })
                    }
                }            
            }
        })
    });
    //Remove course description
    router.put('/dashboard/admin/editProduct/description/remove/', tokenAdminAuth, function(req, res){
        let editProduct = req.body._id;
        let index = req.body.index 
        Admin.findOne({ username: req.admin.username }, function(err, admin) {
            if(err) {
                res.json({ success: false, message: err })
            };
            if(!admin) {
                res.json({ success: false, message: 'Admin no found'});
            } else {
                if(admin.permission === 'AuthAdmin') {     
                    Product.findOneAndUpdate({ _id: editProduct }, { $pull: { description: req.body.description }},{new: true}, function(err, product){
                        if(err) {
                            res.json({ success: false, message: err })
                        };
                        if(!product){
                            res.json({ success: false, message: 'Course no found' });
                        } else {
                            product.save(function(){
                                res.json({ success: true, message: 'Description has been removed!', product: product})
                            });
                        }
                    });
                } else {
                    res.json({ success: false, message: "You don't have the right permission" })
                }          
            }
        })
    });
    //Remove course
    router.delete('/dashboard/admin/course/delete/:id', tokenAdminAuth, function(req, res){
        let deletedVideo = req.params.id;
        Admin.findOne({ username: req.admin.username }, function(err, admin) {
            if(err) {
                res.json({ success: false, message: err })
            }
            if(!admin) {
                res.json({ success: false, message: 'Admin no found' });
            } else {
                if(admin.permission !== 'AuthAdmin') {
                    res.json({ success: false, message: "You don't have the right permission"})
                } else {
                    Product.findOneAndRemove({ _id: deletedVideo }, function(err, course){
                        if(err) {
                            res.json({ success: false, message: err })
                        }
                        if(!course){
                            res.json({ success: false, message: 'Course no found' })
                        } else {
                            res.json({ success: true, course: course._id, message: 'Course ' + course.title + ', '+course.subTitle +' has been removed' })
                        }
                    });
                }
            }
        });
    });   
    //Admin comment to the course
    router.post('/dashboard/admin/comment', tokenAdminAuth, function(req, res) { 
        if(!req.body.comment) {
            res.json({ success:false, message: 'No comment provided' })
        } else {
            if(!req.body._id) {
                res.json({ success:false, message: 'Course no found' });
            } else {
                Product.findOne({ _id: req.body._id }, function(err, product){  
                    if(err) {
                        res.json({ success:false, message: err })
                    } else {
                        if(!product){
                            res.json({ success:false, message: 'Course no found'})
                        } else { 
                            Admin.findOne({ username: req.admin.username }, function(err, user){   
                                if(err){
                                    res.json({ success:false, message: err })
                                } else if (user.permission === 'AuthAdmin') { 
                                    product.comments.push({
                                        body: req.body.comment,
                                        author: user.username,
                                        date: new Date(),   
                                        number: product.comments.length + 1,
                                    });
                                    product.save(function(){
                                        res.json({ success: true, message: 'Your opinion has been added!', user: user, product: product })
                                    })   
                                } else {
                                    res.json({ success: false, message: 'You can not add a comment'});
                                }
                            }) 
                        } 
                    } 
                })
            }
        }
    });
    //Admin reply to the comment
    router.post('/dashboard/admin/comment/reply', tokenAdminAuth, function(req, res) {  
        if(!req.body.replyComment){
            res.json({ success: false })
        } else {
            Admin.findOne({ username: req.admin.username }, function(err, user){ 
                if(err) {
                    res.json({ success:false, message: err })
                }
                if(!user){
                    res.json({ success: false, message: 'Admin no found' })
                } else {
                    if(user.permission === 'AuthAdmin'){
                        Product.findOne({ _id: req.body._id }, function(err, product){
                            if(err) {
                                res.json({ success:false, message: err })
                            }
                            if(!product){
                                res.json({ success: false, message: 'Course no found' })
                            } else {
                                product.comments.id(req.body.id).reply.push({
                                    body: req.body.replyComment,
                                    author: user.username,
                                    date: new Date()
                                });
                                product.save(function(){
                                    res.json({ success: true, message: 'Your opinion has been added', user: user, product: product })
                                })
                            }
                        })
                    } else {
                        res.json({ success: false, message: "You don't have the right permission" })
                    }
                }
            })
        }
    });
    //Remove user reply to the comment
    router.put('/dashboard/admin/comment/reply/remove/', tokenAdminAuth, function(req, res) {  
        let currentCourse = req.body._id;
        let deleteReply = req.body.reply._id;
        let commentId = req.body.commentId
        Admin.findOne({ username: req.admin.username }, function(err, admin) {
            if(err) {
                res.json({ success:false, message: err })
            }
            if(!admin) {
                res.json({ success: false, message: 'Admin no found'});
            } else {
                if(admin.permission === 'AuthAdmin') { 
                    let options = { new: true };
                    Product.findOneAndUpdate({ _id: currentCourse, "comments._id": commentId }, { $pull: { "comments.$.reply": { _id:deleteReply }}},{ upsert:false, new:true }, function(err, product){
                        if(err) {
                            res.json({ success:false, message: err })
                        }
                        if(!product){
                            res.json({ success: false, message: 'Course no found' });
                        } else {
                            product.save(function(){
                                res.json({ success: true, message: 'User comment has been removed!', product: product})
                            });
                        }
                    });
                } else {
                    res.json({ success: false, message: "You don't have the right permission" })
                }          
            }
        })
    });
    //Remove comment
    router.put('/dashboard/admin/comment/remove/', tokenAdminAuth, function(req, res){
        let currentCourse = req.body._id;
        let deleteComment = req.body.comment;
        let currentCommentId = req.body.comment._id;
        Admin.findOne({ username: req.admin.username }, function(err, admin) {
            if(err) {
                res.json({ success:false, message: err })
            }
            if(!admin) {
                res.json({ success: false, message: 'Admin no found'}); 
            } else {
                if(admin.permission === 'AuthAdmin') { 
                    Product.findOneAndUpdate({ _id: currentCourse }, { $pull: { comments: { _id:currentCommentId } }},{ new: true }, function(err, product){
                        if(err) {
                            res.json({ success:false, message: err })
                        }
                        if(!product){
                            res.json({ success: false, message: 'Course no found' });
                        } else {
                            for(var i = 0; i < product.comments.length; i++){
                                product.comments[i].number = i+1
                            }
                            product.save(function(){
                                res.json({ success: true, message: 'Comment has been removed!', product: product})
                            });
                        }
                    });
                } else {
                    res.json({ success: false, message: "You don't have the right permission" })
                }          
            }
        })
    });
    //Add article to the blog
    router.post('/dashboard/admin/blog/article', tokenAdminAuth, function(req, res){
        let blog = new Blog();
        blog.imagePath = req.body.articleBlogImg;
        blog.title = req.body.blogTitle;
        blog.description = [];
        blog.body = req.body.blogContent;
        blog.tags = req.body.tags;
        blog.author = req.body.author;
        blog.date = new Date();
        for(object in req.body.description){
            blog.description.push(req.body.description[object]);
        }
        Admin.findOne({ username: req.admin.username }, function(err, admin){
            if(err) {
                res.json({ success:false, message: err })
            }
            if(!admin){
                res.json({ success: false, message: 'Admin no found'})
            } else {
                if(admin.permission === 'AuthAdmin'){
                    if(req.body.author === null || req.body.author === '' || req.body.articleBlogImg === null || req.body.articleBlogImg === '' || req.body.blogTitle === null || req.body.blogTitle === '' || req.body.blogContent === null || req.body.blogContent === '' || !req.body.tags.length) {
                        res.json({ success: false, message: 'Make sure that you have filled all the fields correctly'})
                    } else {
                        blog.save(function(){
                            res.json({success: true, message: 'Article has been added!' })
                        }) 
                    }
                } else {
                    res.json({ success: false, message: "You don't have the right permission" })
                }
            }
        })
    })
    //Add new course
    router.post('/dashboard/admin/courses', tokenAdminAuth, function(req, res){
        let course = new Product();
        course.imagePath            = req.body.imagePath;
        course.title                = req.body.title;
        course.subTitle             = req.body.subTitle;
        course.description          = [];
        course.oldPrice             = req.body.oldPrice;
        course.newPrice             = req.body.newPrice;
        course.level                = req.body.level; 
        course.introText            = req.body.introText;
        course.body                 = req.body.detailCourse;
        course.author.name          = req.body.authorName;
        course.author.education     = req.body.authorEdu;
        course.author.description   = req.body.authorDescription;  
        course.date                 = new Date();

        for(object in req.body.description){
            course.description.push(req.body.description[object]);
        }
        Admin.findOne({ username: req.admin.username }, function(err, admin) {
            if(err) {
                res.json({ success:false, message: err })
            }
            if(!admin) {
                res.json({ success: false, message: 'Admin no found' });
            } else {
                if(admin.permission === 'AuthAdmin') {
                    if(req.body.title === null || req.body.title === '' || req.body.subTitle === null || req.body.subTitle === '' || req.body.description === null || req.body.description === '' || req.body.oldPrice === null || req.body.oldPrice === '' || req.body.newPrice === null || req.body.newPrice === '' || req.body.levelInput === null || req.body.levelInput === ''){
                        res.json({success: false, message:'Make sure that you have filled all the fields correctly'})
                    } else {
                        course.save(function(){
                            res.json({success:true, message:'Course has been added!', product: course});
                        })
                    }                    
                } else {
                    res.json({ success: false, message: "You don't have the right permission" }) 
                }
            }
            
        })
    }); 
    //Get all articles  
    router.get('/dashboard/admin/blog/articles', tokenAdminAuth, function(req,res) {
        Admin.findOne({ username: req.admin.username }, function(err, admin) {
            if(err) {
                res.json({ success:false, message: err })
            }
            if(!admin) {
                res.json({ success: false, message: 'Admin no found' });
            } else {
                if(admin.permission === 'AuthAdmin') {
                    Blog.find({}, function(err, articles) {
                        if(err) {
                            res.json({ success:false, message: err })
                        };
                        if(!articles) {
                            res.json({ success:false, message: 'No articles found'});
                        } else {
                            res.json({ success: true, articles: articles })
                        }
                    })
                } else {
                    res.json({ success: false, message: "You don't have the right permission" })
                }
            }
        })
    });
    //Get single article
    router.get('/dashboard/admin/blog/articles/:id', tokenAdminAuth, function(req,res) {
        let article = req.params.id;
        Admin.findOne({ username: req.admin.username }, function(err, admin) {
            if(err) {
                res.json({ success:false, message: err })
            } else {
                if(!admin) {
                    res.json({ success: false, message: 'Admin no found' });
                } else {
                    if(admin.permission === 'AuthAdmin') {
                        Blog.find({_id: article}, function(err, articles) {
                            if(err) {
                                res.json({ success:false, message: err })
                            } else {
                                if(!articles) {
                                    res.json({ success:false, message: 'No article found'});
                                } else {
                                    res.json({ success: true, articles: articles, id: admin._id })
                                }                                
                            }

                        })
                    } else {
                        res.json({ success: false, message: "You don't have the right permission" })
                    }
                }                
            }

        })
    });
    //Edit article by admin
    router.put('/dashboard/admin/blog/articles/edit', tokenAdminAuth, function(req, res){
        Admin.findOne({ username: req.admin.username }, function(err, admin){
            if(err) {
                res.json({ success:false, message: err })
            } else {
                if(!admin){
                    res.json({ success: false, message: 'Admin no found' })
                } else {
                    if(admin.permission === 'AuthAdmin') {
                        Blog.findById({ _id: req.body.id }, function(err, article){
                            if(err) {
                                res.json({ success:false, message: err })
                            } else {
                                if(req.body.author === null || req.body.author === '' || req.body.author === undefined || req.body.imagePath === null || req.body.imagePath === '' || req.body.imagePath === undefined || req.body.title === null || req.body.title === '' || req.body.title === undefined || req.body.body === null || req.body.body === '' || req.body.body === undefined || !req.body.tags.length) {
                                    res.json({ success: false, message: 'Make sure that you have filled all the fields correctly' })
                                } else {
                                    article.title      = req.body.title;
                                    article.body       = req.body.body;
                                    article.tags       = req.body.tags;
                                    article.author     = req.body.author;
                                    article.imagePath  = req.body.imagePath;
                                    article.date       = new Date();
                                    article.save(function(){
                                        res.json({ success: true, message: 'This article has been changed!', article: article })
                                    })
                                }                                
                            }
                        })
                    } else {
                        res.json({ success: false, message: "You don't have the right permission" })
                    }
                }                
            }

        })    
    })
    //Remove article from database
    router.delete('/dashboard/admin/blog/articles/delete/:id', tokenAdminAuth, function(req, res){
        let deletedArticle = req.params.id
        Admin.findOne({ username: req.admin.username }, function(err, admin) {
            if(err) {
                res.json({ success:false, message: err })
            } else {
                if(!admin) {
                    res.json({ success: false, message: 'Admin no found' });
                } else {
                    if(admin.permission !== 'AuthAdmin') {
                        res.json({ success: false, message: "You don't have the right permission" })
                    } else {
                        Blog.findOneAndRemove({ _id: deletedArticle }, function(err, articles){
                            if(err) {
                                res.json({ success:false, message: err })
                            } else {
                                res.json({ success: true, message: 'Article has been removed!' });                                
                            }
                        });
                    }
                }
            }
        });
    });   
    //Admin comment to article
    router.post('/dashboard/admin/blog/article/comment', tokenAdminAuth, function(req, res) { 
        if(!req.body.comment) {
            res.json({ success:false, message: 'No comment provided' })
        } else {
            if(!req.body._id) {
                res.json({ success:false, message: 'Article no found' });
            } else {
                Blog.findOne({ _id: req.body._id }, function(err, article){  
                    if(err) { 
                        res.json({ success:false, message: err })
                    } else {
                        if(!article){
                            res.json({ success:false, message: 'Article no found'}) 
                        } else { 
                            Admin.findOne({ username: req.admin.username }, function(err, admin){   
                                if(err){
                                    res.json({ success:false, message: err })
                                } else if (admin.permission === 'AuthAdmin') { 
                                    if(req.body.comment === '' || req.body.comment === null || req.body.comment === undefined || req.body.comment.length < 10) {
                                        res.json({ success: false, message: 'Invalid comment'})
                                    } else {
                                        let thisComment = {
                                            body: req.body.comment,
                                            author: admin.username,
                                            date: new Date(),   
                                            number: article.comments.length + 1
                                        }
                                        article.comments.push(thisComment);
                                        article.save(function(err, comment){
                                            if(err){
                                                res.json({ success: false, message: err });
                                            } else {
                                                res.json({ success: true, message: 'Comment has been added!', comment: comment.comments[comment.comments.length-1], id: req.body._id })
                                            }
                                        }) 
                                    }
                                } else {
                                    res.json({ success: false, message: "You don't have the right permission" });
                                }
                            }) 
                        } 
                    } 
                })
            }
        }
    });
    //Add comment to reply
    router.post('/dashboard/admin/blog/article/comment/reply', tokenAdminAuth, function(req, res) {  
        if(!req.body.reply) {
            res.json({ success: false, message: 'No comment provided' })
        } else {
            Admin.findOne({ username: req.admin.username }, function(err, admin){
                if(err) { 
                    res.json({ success:false, message: err })
                } else {
                    if(!admin){
                        res.json({ success: false, message: 'Admin no found' })
                    } else {
                        if(admin.permission === 'AuthAdmin') {
                            Blog.findOne({ _id: req.body._id }, function(err, article){
                                if(err) { 
                                    res.json({ success:false, message: err })
                                } else {
                                    if(!article){
                                        res.json({ success: false, message: 'Article no found' })
                                    } else {
                                        let thisReply = {
                                            body: req.body.reply,
                                            author: admin.username,
                                            date: new Date()
                                        }
                                        article.comments.id(req.body.commentId).reply.push({
                                            body: req.body.reply,
                                            author: admin.username,
                                            date: new Date()
                                        });
                                        article.save(function(err, comment){
                                            if(err){
                                                res.json({ success: false, message: err })
                                            } else {
                                                res.json({ success: true, message: 'Your opinion has been added', reply: comment.comments.id(req.body.commentId).reply[comment.comments.id(req.body.commentId).reply.length - 1] })
                                            }
                                        })
                                    }                                    
                                }
                            })
                        } else {
                            res.json({ success: false,  message: "You don't have the right permission" })
                        }
                    }
                }
            })
        }
    });
    //Delete comment from article
    router.put('/dashboard/admin/blog/article/comment/delete', tokenAdminAuth, function(req, res){
        let currentCourse = req.body.id;
        let deleteComment = req.body.comment;
        let commentId = req.body.commentId;
        Admin.findOne({ username: req.admin.username }, function(err, admin) {
            if(err) { 
                res.json({ success:false, message: err })
            } else {
                if(!admin) {
                    res.json({ success: false, message: 'Admin no found'}); 
                } else {
                    if(admin.permission === 'AuthAdmin') { 
                        Blog.findOneAndUpdate({ _id: currentCourse }, { $pull: { comments: { _id: commentId } }},{ new: true }, function(err, article){
                            if(err) { 
                                res.json({ success:false, message: err })
                            } else {
                                if(!article){
                                    res.json({ success: false, message: 'Article no found' });
                                } else {
                                    for(var i = 0; i < article.comments.length; i++){
                                        article.comments[i].number = i+1
                                    }
                                    article.save(function(err){
                                        res.json({ success: true, message: 'Comment has been removed!', article: article })
                                    });
                                }                                
                            }
                        });
                    } else {
                        res.json({ success: false, message: "You don't have the right permission" })
                    }          
                }                
            }
        })
    });
    //Remove reply to the comment
    router.put('/dashboard/admin/blog/article/comment/reply/delete', tokenAdminAuth, function(req, res) {  
        let currentCourse = req.body.id;
        let deleteReply = req.body.replyId;
        let commentId = req.body.commentId
        Admin.findOne({ username: req.admin.username }, function(err, admin) {
            if(err) { 
                res.json({ success:false, message: err })
            } else {
                if(!admin) {
                    res.json({ success: false, message: 'Admin no found'});
                } else {
                    if(admin.permission === 'AuthAdmin') { 
                        Blog.findOneAndUpdate({ _id: currentCourse, "comments._id": commentId }, { $pull: { "comments.$.reply": { _id: deleteReply }}},{ upsert:false, new:true }, function(err, article){
                            if(err) { 
                                res.json({ success:false, message: err })
                            } else {
                                if(!article){
                                    res.json({ success: false, message: 'Article no found' });
                                } else {
                                    article.save(function(err, commentReply){
                                        if(err){
                                            res.json({ success:false, message: err })
                                        } else {
                                            res.json({ success: true, message: 'Comment has been removed!', article: commentReply.comments.id(commentId).reply })
                                        }
                                    });
                                }                                
                            }
                        });
                    } else {
                        res.json({ success: false, message: "You don't have the right permission" })
                    }          
                }
            }
        })
    });
    //Vote for a comment
    router.put('/dashboard/admin/blog/article/comment/vote', tokenAdminAuth, function(req, res) {  
        let currentCourse = req.body.id;
        let commentId = req.body.commentId;
        Admin.findOne({ username: req.admin.username }, function(err, admin) {
            if(err) { 
                res.json({ success:false, message: err })
            } else {
                if(!admin) {
                    res.json({ success: false, message: 'Admin no found'}); 
                } else {
                    if(admin.permission === 'AuthAdmin') { 
                        Blog.findOneAndUpdate({ _id: currentCourse },{ upsert: false, new: true }, function(err, article){
                            if(err) { 
                                res.json({ success:false, message: err })
                            } else {
                                let userRating = article.comments.id(commentId).ratings.users;
                                let result = userRating.filter(function(element){
                                    return element.id == admin._id
                                })
                                if(!article){
                                    res.json({ success: false, message: 'Article no found' });
                                } else {
                                    if(!userRating.length || !result.length){
                                        if(req.body.vote === 'like'){
                                            article.comments.id(commentId).ratings.like++
                                        } else if(req.body.vote === 'dislike'){
                                            article.comments.id(commentId).ratings.dislike++
                                        }
                                        userRating.push({
                                            id: admin._id,
                                            vote: req.body.vote
                                        })
                                        article.save(function(err, comment){
                                            if(err){
                                                res.json({ success: false, message: err })
                                            } else {
                                                res.json({ success: true, message: 'Your vote has beedn added!', vote: comment.comments.id(commentId).ratings })
                                            }
                                        })
                                    } else {                   
                                        if(result[0].vote === req.body.vote){
                                            res.json({ success: false, message: 'You can not vote the same' });
                                        } else if(result[0].vote !== req.body.vote){
                                            if(req.body.vote === 'like'){
                                                article.comments.id(commentId).ratings.like++
                                                if(article.comments.id(commentId).ratings.dislike > 0){
                                                    article.comments.id(commentId).ratings.dislike--
                                                } else {
                                                    article.comments.id(commentId).ratings.dislike = 0
                                                }
                                                
                                            } else if(req.body.vote === 'dislike'){
                                                article.comments.id(commentId).ratings.dislike++
                                                if(article.comments.id(commentId).ratings.like > 0){
                                                    article.comments.id(commentId).ratings.like--
                                                } else {
                                                    article.comments.id(commentId).ratings.like = 0
                                                }
                                            }
                                            userRating.forEach(function(i,j){
                                                if(i.id == admin._id) {
                                                    userRating.splice(j,1);
                                                    userRating.push({
                                                        id: admin._id,
                                                        vote: req.body.vote
                                                    });     
                                                }                          
                                            });
                                            article.save(function(err, comment){
                                                if(err){
                                                    res.json({ success: false, message: err })
                                                } else {
                                                    res.json({ success: true, message: 'Your vote has been changed!', vote: comment.comments.id(commentId).ratings})
                                                }
                                            })
                                        }
                                    }
                                }                                
                            }                

                        });
                    } else {
                        res.json({ success: false, message: "You don't have the right permission" })
                    }          
                }                
            }
        })
    });
    //Vote for a reply of comment
    router.put('/dashboard/admin/blog/article/comment/reply/vote', tokenAdminAuth, function(req, res) {
        let currentCourse = req.body.id;
        let commentId = req.body.commentId;
        let replyId = req.body.replyId;
        Admin.findOne({ username: req.admin.username }, function(err, admin) {
            if(err) {
                res.json({ success: false, message: err })
            } else {
                if(!admin) {
                    res.json({ success: false, message: 'Admin no found'}); 
                } else {
                    if(admin.permission === 'AuthAdmin') { 
                        Blog.findOneAndUpdate({ _id: currentCourse },{ upsert: false, new: true }, function(err, article){
                            let userRating = article.comments.id(commentId).reply.id(replyId).ratings.users;
                            let result = userRating.filter(function(element){
                                return element.id == admin._id
                            })
                            if(err) {
                                res.json({ success: false, message: err })
                            } else {
                                if(!article){
                                    res.json({ success: false, message: 'Article no found' });
                                } else {
                                    if(!userRating.length || !result.length){
                                        if(req.body.vote === 'like'){
                                            article.comments.id(commentId).reply.id(replyId).ratings.like++
                                        } else if(req.body.vote === 'dislike'){
                                            article.comments.id(commentId).reply.id(replyId).ratings.dislike++
                                        }
                                        userRating.push({
                                            id: admin._id,
                                            vote: req.body.vote
                                        })
                                        article.save(function(err, comment){
                                            if(err){
                                                res.json({ success: false, message: err })
                                            } else {
                                                res.json({ success: true, message: 'Your vote has beedn added!', vote: comment.comments.id(commentId).reply.id(replyId).ratings })
                                            }
                                        })
                                    } else {                            
                                        if(result[0].vote == req.body.vote){
                                            res.json({ success: false, message: 'You can not vote the same' });
                                        } else if(result[0].vote !== req.body.vote){
                                            if(req.body.vote === 'like'){
                                                article.comments.id(commentId).reply.id(replyId).ratings.like++
                                                if(article.comments.id(commentId).reply.id(replyId).ratings.dislike > 0){
                                                    article.comments.id(commentId).reply.id(replyId).ratings.dislike--
                                                } else {
                                                    article.comments.id(commentId).reply.id(replyId).ratings.dislike = 0
                                                }
                                                
                                            } else if(req.body.vote === 'dislike'){
                                                article.comments.id(commentId).reply.id(replyId).ratings.dislike++
                                                if(article.comments.id(commentId).reply.id(replyId).ratings.like > 0){
                                                    article.comments.id(commentId).reply.id(replyId).ratings.like--
                                                } else {
                                                    article.comments.id(commentId).reply.id(replyId).ratings.like = 0
                                                }
                                            }
                                            userRating.forEach(function(i,j){
                                                if(i.id == admin._id) {
                                                    userRating.splice(j,1);
                                                    userRating.push({
                                                        id: admin._id,
                                                        vote: req.body.vote
                                                    });     
                                                }                          
                                            });
                                            article.save(function(err, comment){
                                                if(err){
                                                    res.json({ success: false, message: err })
                                                } else {
                                                    res.json({ success: true, message: 'Your vote has been changed!', vote: comment.comments.id(commentId).reply.id(replyId).ratings})
                                                }
                                            })
                                        }
                                    }
                                }                                
                            }
                        });
                    } else {
                        res.json({ success: false, message: 'Your vote has been added!'})
                    }          
                }                
            }
        })
    });

    return router
}  
