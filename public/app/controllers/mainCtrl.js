export default angular.module('mainController', ['authServices', 'userServices'])

.controller('mainCtrl', ['$timeout','$state','$stateParams','$location','Auth','$rootScope','$window','$interval','User','AuthToken','$scope','$anchorScroll', function($timeout, $state, $stateParams, $location, Auth, $rootScope, $window, $interval, User, AuthToken, $scope, $anchorScroll){

    let app = this;    
    let socket = io.connect(); 
    app.loadme = false;
    app.emptyCart = false;
    app.video_limit = 4; 
    app.blog_limit = 4;
    app.commentCarousel = []; 
    //Display random 6 user comments
    (function getProducts() {
        User.getProducts().then(function(data){
            app.products = data.data.products; 
            app.loading = false;
            app.products.map((item => item.comments.map((com,index) => app.commentCarousel.push(com))));
            app.sortedComment = app.commentCarousel.sort(function(){
                return 0.5 - Math.random()
            }).slice(0, 6);
            app.sortedProducts = app.products.sort(function(){
                return 0.5 - Math.random()
            }).slice(0, 1);
        })
    })();
    //Get path name to style navigation bar
    $scope.$on('$viewContentLoaded', function(){
        app.currentId = $state.params.id;
    })
    $scope.isActive = function(activeClass) { 
        return activeClass === $state.href($state.current.name, $state.params); 
    };
    //Check products in cart, add new item to the cart, remove item from cart
    $rootScope.$on('$stateChangeStart', function(){ 
        $scope.linkEnabled = false;
        app.emptyCart = false;
        function getSession(){
            User.getSession().then(function(data){ 
                app.showInnerCart = data.data.success   
                if(data.data.success){
                    if(data.data.session == undefined){
                        return false 
                    } else {
                        $scope.totalQty = data.data.session.totalQty;
                        app.sessionProduct = data.data.session;
                        app.summaryPrice = data.data.session.totalPrice;
                        app.showBadge = true;
                        $scope.linkEnabled = true;
                    }
                } else {  
                    app.showCartMessage = function() { 
                        app.emptyCart = 'You have not added any course to the cart';
                        $timeout(function(){
                            app.emptyCart = false; 
                        },2000)  
                    }      
                    $scope.linkEnabled = false; 
                    app.showBadge = false;
                }
            })
        }  
        getSession();
        app.addCart = function(product){
            User.addToCart($stateParams.id).then(function(data){ 
                if(data.data.success){
                    $scope.totalQty = data.data.cart.totalQty;
                    app.showBadge = true;
                    $scope.linkEnabled = true;  
                    app.emptyCart = false; 
                } else {
                    app.logInCourse = 'You must be logged in to buy a course';
                    $timeout(function(){
                        app.logInCourse = false;
                    },2000)
                }
            });
        } 
        app.reduceCart = function(id){ 
            User.removeFromCart(id).then(function(data){   
                if(data.data.success){
                    getSession()       
                } else {
                    app.errorMsg = data.data.message;
                }
            });
        }
    });
    //Check user session 
    app.checkSession = function(){
        if(Auth.isLoggedIn()) {
            app.checkingSession = true;
            let interval = $interval(function(){
                let token = $window.localStorage.getItem('token');
                if(token === null){
                    $interval.cancel(interval);
                } else {
                    self.parseJwt = function(token) {
                        var base64Url = token.split('.')[1];
                        var base64 = base64Url.replace('-', '+').replace('_', '/');
                        return JSON.parse($window.atob(base64))
                    }
                    var expireTime = self.parseJwt(token);
                    var timeStamp = Math.floor(Date.now() / 1000);
                    var timeCheck = expireTime.exp - timeStamp;
                    if(timeCheck <= 1800) {
                        showModal(1);
                        $interval.cancel(interval);
                    }
                }
            },3000)
        }
    };
    app.checkSession();
    //Show modal when session expired
    function showModal(option) {
        app.choiceMade = false;
        app.modalHeader = undefined;
        app.modalBody = undefined;
        app.hideButton = false;
        if(option === 1) {
            app.modalHeader = 'Timeout Warning';
            app.modalBody = 'Your session will expired in 30 minutes. Would you like to renew your session?';
            $("#myModal").modal({ backdrop: "static" });
            $timeout(function(){
                if(!app.choiceMade) app.endSession();
            }, 10000);
        } else if(option === 2) {
            app.hideButton = true;
            app.modalHeader = 'Logging Out';
            $("#myModal").modal({ backdrop: "static" });
            $timeout(function(){
                Auth.logout();
                $state.go('logout');
                app.authorized = false;
                hideModal();
                $anchorScroll();
            }, 2000)
        }
    };
    //Renew user session
    app.renewSession = function(){
        app.choiceMade = true;
        User.renewSession().then(function(data){
            if(data.data.success){
                AuthToken.setToken(data.data.token);
                app.checkSession();
            } else {
                app.modalBody = data.data.message;
            }
        });
        hideModal();
    };
    app.endSession = function() {
        app.choiceMade = true;
        hideModal();
        $timeout(function(){
            showModal(2);
        }, 1000);
    }; 
    let hideModal = function() {
        $("#myModal").modal('hide');
        $("#LoginModal").modal('hide')
    };
    // Will run code every time a route changes
    $rootScope.$on('$stateChangeStart', function(){ 
        if(!app.checkingSession) app.checkSession();
        if(Auth.isLoggedIn()){
            app.isLoggedIn = true;
            Auth.getUser().then(function(data){
                if(data.data.username === undefined){
                    Auth.logout();
                    $window.localStorage.removeItem('token')
                    $state.go('parent.home')
                } else {
                    app.username = data.data.username;
                    app.useremail = data.data.email;
                    app.isLoggedIn = true;
                    User.getPermission().then(function(data){
                        if(data.data.permission === 'admin'){
                            app.authorized = true;
                            app.loadme = true;
                        } else {
                            app.loadme = true;
                        }
                    })                    
                }
            })
        } else {
            app.username = '';
            app.isLoggedIn = false;
            app.loadme = true;
        }
    })
    //User login
    app.doLogin = function(loginData, valid){
        app.errorMsg = false;
        app.expired = false;
        app.disabled = true;
        if(valid) {
            Auth.login(app.loginData).then(function(data){
                if(data.data.success){
                    app.successMsg = data.data.message + '...Redirecting';
                    $timeout(function(){
                        $state.go('parent.Home');
                        app.loginData = '';
                        app.successMsg = false;
                        hideModal();
                        $anchorScroll();
                        app.disabled = false;
                        app.checkSession();
                    },2000);
                } else {
                    if(data.data.expired){
                        app.expired = true;
                        app.errorMsg = data.data.message;
                    } else {
                        app.errorMsg = data.data.message;  
                        app.disabled = false;
                        $timeout(function(){
                            app.errorMsg = false
                        },2000)
                    }
                }
            });
        } else {
            app.errorMsg = 'Fill the form correctly';  
            app.disabled = false;
            $timeout(function(){
                app.errorMsg = false
            },2000)
        }
    };
    app.logout = function(){
        showModal(2);
    }
    app.hideLoginModal = function(){
        hideModal();
    };
    //Get articles from database on home page
    (function() {
        User.blogArticles().then(function(data){
            app.blog = data.data.allArticles; 
            app.loading = false;
        })
    })();
    //Scroll page to the top
    app.scroll = function(){
        $timeout(function(){
            $anchorScroll()
        },1) 
    };
    //Client sockets
    socket.on('product', function(data){
        app.products.push(data.product);    
    });
}])
