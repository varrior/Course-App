export default angular.module('navController', ['userServices', 'angularMoment', 'btford.socket-io', 'angular.filter']) 
 
.controller('seeMoreCtrl', ['$scope', '$stateParams', 'User', '$location', '$window', '$timeout', 'Auth', function($scope, $stateParams, User, $location, $window, $timeout, Auth) { 

    let socket = io.connect(); 
    let app = this;
    app.comments = []; 
    //Get course details
    User.readMoreCourse($stateParams.id).then(function(data){
        if(data.data.success){
            app.image = data.data.product.imagePath;
            app.authorName = data.data.product.author.name;
            app.authorEdu = data.data.product.author.education;
            app.authorDescription = data.data.product.author.description;
            app.introText = data.data.product.introText;
            app.title= data.data.product.title;
            app.subTitle = data.data.product.subTitle;
            app.oldPrice = data.data.product.oldPrice;
            app.newPrice = data.data.product.newPrice;
            app.id = data.data.product._id; 
            app.comments = data.data.product.comments;
            app.body = data.data.product.body;
        } else {
            $window.location.assign('/404');
        }
        socket.emit('connect user', app.id);
    });       
    //Add comment to the course
    app.AddComment = function(comment, valid, id){
        app.errCommentMsg = false;
        app.disableComment = true;
        app.loadingComment = true;
        if(valid){
            let userComment = {};
            userComment.comment = comment
            userComment._id = app.id;
            app.disableComment = false;
            app.loadingComment = false;
            User.postComment(userComment).then(function(data){
                if(data.data.success) {
                    app.commentMsg = data.data.message;
                    $timeout(function(){
                        app.comment = '';
                        app.AddCommentForm.$setPristine();
                        app.commentMsg = false;
                    },2000);
                    socket.emit('new comment', data.data.id, data.data.comment);
                } else {
                    app.errCommentMsg = data.data.message;
                    $timeout(function(){
                        app.errCommentMsg = false;
                        app.disableComment = false;
                        app.loadingComment = false;
                    }, 2000)
                }
            })
        } else {
            app.errCommentMsg = 'Add comment content'
            app.disableComment = false;
            app.loadingComment = false;
            $timeout(function(){
                app.errCommentMsg = false;
                app.AddCommentForm.$setPristine();
            }, 2000)
        }
    }
    //Add reply to the comment
    app.userReply = function(comment, reply, form){
        app.addedReply = comment._id;
        app.errReply = false;
        app.disableReply = true;
        app.loadingReply = true;
        if(form.$valid){
            let replyComment = {};
            replyComment._id          = app.id;
            replyComment.commentId    = comment._id;
            replyComment.reply        = reply;
            app.disableReply          = false;
            app.loadingReply          = false;
            User.replyUserComment(replyComment).then(function(data){
                if(data.data.success){
                    app.replyMsg = data.data.message;
                    $timeout(function(){
                        form.$setPristine()
                        app.commentReply[comment.number] = '';
                        app.replyMsg = false;
                    },2000);
                    socket.emit('reply', app.id, data.data.reply, comment.number);
                } else {
                    app.errReply = data.data.message;
                    $timeout(function(){
                        app.errReply = false;
                    },2000)
                }
            })
        } else {
            app.errReply = 'Add comment content';
            app.disableReply = false;
            app.loadingReply = false;
            $timeout(function(){
                app.errReply = false;
            },2000)
        }
    }
    //Client sockets
    socket.on('updateComment', function(data){
        app.comments = data.comment;  
    });         
    socket.on('newComment', function(data){
        app.comments.push(data.comment);  
    });
    socket.on('reply', function(data){
        app.comments[data.commentNumber - 1].reply.push(data.reply)
    });    
    socket.on('updateReply', function(data){
        app.comments = data.reply;  
    });
    $scope.$on('$locationChangeStart', function(event){
        socket.disconnect(true);
    });
    socket.on('updateCourse', function(data){
        switch(data.name) {
            case 'description':
                app.description = data.record
            break
            case 'title':
                app.title = data.record
            break
            case 'subTitle':
                app.subTitle = data.record
            break
            case 'oldPrice':
                app.oldPrice = data.record
            break
            case 'newPrice':
                app.newPrice = data.record
            break
            case 'level':
                app.level = data.record
            break
            case 'body':
                app.body = data.record
            break
            case 'imagePath':
                app.image = data.record
            break
            case 'introText':
                app.introText = data.record
            break
            case 'authorName':
                app.authorName = data.record
            break
            case 'authorEducation':
                app.authorEdu = data.record
            break
            case 'authorDescription':
                app.authorDescription = data.record
            break
        }
    });
}])
.controller('navCtrl', ['$scope','User', function($scope, User){ 

    let socket = io.connect();
    let app = this;
    app.sorted = true;
    app.selectSort = 'Sort';
    app.currentPage = 1; 
    app.itemsPerPage = 8;
    app.loadingPage = true;
    //Get all acourses
    User.getProducts().then(function(data){
        //Get random course to header
        app.sortedProducts = data.data.products.sort(function(){
            return 0.5 - Math.random() 
        }).slice(0,1);
        app.productsPag = data.data.products.sort((a,b) => (new Date(b.date) - new Date(a.date)));
        app.loadingPage = false; 
        app.productsPag.forEach(function(item){
            return socket.emit('connect user', item._id);
        })
    });
    //Sort by title
    app.sortByCourse = function(propertyName){
        User.getProducts().then(function(data){
            app.productsPag = data.data.products.filter(title => title.title == propertyName )
        });
        app.propertyLevel = undefined;
        app.propertyName = propertyName;
    }
    //Sort by level
    app.sortByLevel = function(event, propertyLevel){
        app.propertyName = undefined;
        if(app.propertyLevel == event.target.className){
            User.getProducts().then(function(data){
                app.productsPag = data.data.products.sort((a,b) => (new Date(a.date) - new Date(b.date)));
            });
            app.propertyLevel = undefined;
        } else {
            app.propertyLevel = propertyLevel;
            User.getProducts().then(function(data){
                app.productsPag = data.data.products.filter(course => course.level == propertyLevel )
            });
        }
        
    }
    //Sort by following conditions
    app.applySortBy = function(sort){
        app.propertyLevel = undefined;
        app.propertyName = undefined;
        if(sort === 'Recent'){
            User.getProducts().then(function(data){
                app.productsPag = data.data.products.sort((a,b) => (new Date(b.date) - new Date(a.date)));
            });
        } else if(sort === 'Price ascending'){
            User.getProducts().then(function(data){
                app.productsPag = data.data.products.sort((a,b) => (a.newPrice - b.newPrice));
            });
        } else if(sort === 'Price descending'){
            User.getProducts().then(function(data){
                app.productsPag = data.data.products.sort((a,b) => (b.newPrice - a.newPrice));
            });
        } else if(sort === 'Alphabetically'){
            User.getProducts().then(function(data){
                app.productsPag = data.data.products.sort((a,b)=>{if(a.subTitle < b.subTitle) {return -1} else if(a.subTitle > b.subTitle) {return 1} return 0
                });
            });
        }
    }
    //Client sockets
    socket.on('product', function(data){
        app.productsPag.push(data.product);
        app.productsPag.sort((a,b) => (new Date(b.date) - new Date(a.date)));
    });
    socket.on('deleteCourse', function(data){
        app.productsPag = app.productsPag.filter(function(item){
            return item._id != data.course
        });  
    });
    socket.on('updateCourse', function(data){
        app.productsPag.find(({_id}) => _id === data.id)[data.name] = data.record;
    });
}]) 
.controller('contactCtrl', ['$scope', '$timeout', 'User', function($scope, $timeout, User){ 
    let app = this;
    app.loadingPage = true;
    $scope.$on('$viewContentLoaded', function(){
        app.loadingPage = false;
    });
    //Send message by user
    app.contactUser = function(messageData, valid) { 
        app.loading = true;
        app.errorMsg = false;
        if(valid){  
            User.sendMessage(app.messageData).then(function(data){ 
                if(data.data.success){
                    app.loading = false;
                    app.successMsg = data.data.message + '...';
                    $timeout(function(){
                        app.messageData = {}
                        app.messageForm.$valid
                        app.messageForm.$setPristine();  
                        app.messageForm.$setUntouched();
                        app.successMsg = false;
                    },3000) 
                } else {
                    app.loading = false;
                    app.errorMsg = data.data.message;
                }
            })   
        } else {
            app.disabled = false;
            app.loading = false;
            app.errorMsg = 'Make sure that you have filled in the contact form correctly';
            $timeout(function(){
                app.errorMsg = false;
            },2000)
        }
    }
}])
.controller('checkoutCtrl', ['$scope', '$timeout', 'User', '$window', '$state', function($scope, $timeout, User, $window, $state){ 

    let app = this;

    app.showPerson = true;
    app.showCompany = true;
    app.showPaymentForm = false;
    app.showCompleteInfo = false;
    app.showReceiptForm = true;
    app.errorMsg = false;
    app.stepOne = 'active';
    app.stepTwo = 'disabled';
    app.stepThree = 'disabled';
    app.orderMsg = false;
    app.orderErr = false;
    app.changePrivateButton = false;
    app.changeCompanyButton = false;
    app.summaryTable = true;
    app.confirmErrMsg = false;
    app.confirmMsg = false;
    app.loading = false;
    //Make order as private person or company
    User.checkOrderSession().then(function(data){
        if(data.data.success){
            $scope.showPerson = function(){
                app.showPerson = true;
                app.showCompany = false;
            };
            $scope.showCompany = function(){
                app.showCompany = true;
                app.showPerson = false;
            };
            app.previous = function() {
                app.showPaymentForm = false;
                app.showReceiptForm = true;
                app.stepOne = 'active';
                app.stepTwo = 'disabled';
                app.stepThree = 'disabled';
            }
            app.makeOrder = function(order, valid){
                if(valid) {
                    User.order(app.order).then(function(data){
                        if(data.data.success){
                            app.orderMsg = data.data.message;
                                $timeout(function(){
                                    if($scope.privatePerson.$valid && $scope.companyForm.$valid) {
                                        app.showPaymentForm = true;
                                        app.showReceiptForm = false;
                                        app.stepOne = 'complete';
                                        app.stepTwo = 'active';
                                        app.stepThree = 'disabled';
                                        app.orderMsg = false;
                                        app.changePrivateButton = true;
                                    }
                                },2000)
                        } else {
                            app.errorMsg = data.data.message;
                            $timeout(function(){
                                app.errorMsg = false;
                            },2000)
                        }
                    })
                } else {
                    app.errorMsg = 'Fill the form correctly'
                    $timeout(function(){
                        app.errorMsg = false;
                    },2000)
                }
            }
            app.makeCompanyOrder = function(companyOrder, valid){  
                if(valid) {
                    User.companyOrder(app.companyOrder).then(function(data){
                        if(data.data.success){
                            app.orderMsg = data.data.message;
                                $timeout(function(){
                                    if($scope.privatePerson.$valid && $scope.companyForm.$valid) {
                                        app.showPaymentForm = true;
                                        app.showReceiptForm = false;
                                        app.stepOne = 'complete';
                                        app.stepTwo = 'active';
                                        app.stepThree = 'disabled';
                                        app.orderMsg = false;
                                        app.changeCompanyButton = true;
                                    }
                                },2000)
                        } else {
                            app.errorMsg = data.data.message;
                            $timeout(function(){
                                app.errorMsg = false;
                            },2000)
                        }
                    })
                } else {
                    app.errorMsg = 'Fill the dorm correctly'
                    $timeout(function(){
                        app.errorMsg = false;
                    },2000)
                }
            }
            //Make payment, using PayU
            app.payment = function(order, valid){
                if(valid){  
                    User.sendOrders(app.order).then(function(data){
                        if(data.data.success) {
                            app.PayMsg = data.data.message;
                            $window.location = data.data.body.redirectUri;
                        } else {
                            $state.go('parent.cart')
                        } 
                    }) 
                } else {
                    app.errorPayMsg = 'Fill the form correctly'
                    $timeout(function(){
                        app.errorPayMsg = false;
                    },2000)
                }        
            }
            if(data.data.session.order && data.data.session.cart) { 
                app.showCompany = false;
                app.showPerson = true;
                app.changePrivateButton = true;
                app.changeCompanyButton = false;
                app.order.receiptName = data.data.session.order.name;
                app.order.receiptStreet = data.data.session.order.street;
                app.order.receiptHomeNumber = data.data.session.order.homeNumber;
                app.order.receiptPostCode = data.data.session.order.postCode;
                app.order.receiptCity = data.data.session.order.city; 
            } else if(data.data.session.companyOrder && data.data.session.cart){
                app.changeCompanyButton = true;
                app.changePrivateButton = false;
                app.showCompany = true;
                app.showPerson = false;
                app.companyOrder.companyName = data.data.session.companyOrder.CompanyName;
                app.companyOrder.NIPNumber = data.data.session.companyOrder.NIP;
                app.companyOrder.companyStreet = data.data.session.companyOrder.CompanyStreet;  
                app.companyOrder.companyHomeNumber = data.data.session.companyOrder.homeNumber;
                app.companyOrder.companyPostcode = data.data.session.companyOrder.postCode;
                app.companyOrder.companyCity = data.data.session.companyOrder.city;
                app.companyOrder.companyCountry = data.data.session.companyOrder.country;

            } else {
                app.showCompany = false;  
            }
        } else {
            $window.location.replace('/courses')
            app.showCompany = false; 
        }
    })
}])
.controller('aboutCtrl', ['User',function(User){ 
    let app = this;
    let socket = io.connect();
    app.loadingPage = true;
    //Get constent of the "About Us" page
    User.getAboutUs().then(function(data){
        if(data.data.success && data.data.about){
            app.author = data.data.about.author;
            app.blog = data.data.about.blog;
            app.loadingPage = false;            
        } else {
            app.author = false;
            app.loadingPage = false;
            app.blog = false;
        }
    });
    //Socket client
    socket.on('aboutUs', function(data){
        app.author = data.aboutUs.author; 
        app.blog = data.aboutUs.blog;
    })
}])  
.controller('NoFoundCtrl', function(){ 
})
.controller('shoppingCtrl', function(){ 
}) 
.controller('homePageCtrl', function(){ 
}) 






