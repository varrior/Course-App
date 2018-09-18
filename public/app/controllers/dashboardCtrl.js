export default angular.module('dashboardController', ['userServices', 'dashboardAuthServices', 'ui.bootstrap']) 

.controller('dashboardCtrl', ['$rootScope','$scope','User','AuthAdminToken','AuthDashboard','$interval','$window','$anchorScroll','$timeout', '$state', function($rootScope, $scope, User, AuthAdminToken, AuthDashboard, $interval, $window, $anchorScroll, $timeout, $state) { 
    let app = this;
    app.correctAdmin = true; 
    app.loadingPage = false;
    //Hide session renew and logging out modal
    let hideAdminModal = function() {
        $("#adminLoggingOut").modal('hide');
        $("#adminLogoutModal").modal('hide'); 
    };
    //Responsive dashboard navbar
    app.ActiveNav = function (activeClass) { 
        if($window.innerWidth >= 1200) {
            return activeClass === $state.href($state.current.name, $state.params); 
        }
    };
    if($window.innerWidth >= 1200) {
        $('.rad-sidebar').removeClass('rad_nav_min');
        
    } else{
        $('.rad-sidebar').addClass('rad_nav_min');

    }
    $(document).on('click','a.toggle-collapsed', function() {
        if($window.innerWidth >= 850) {
            $('.al-main').css('margin-left','155px');
            $('.rad-sidebar').removeClass('rad_nav_min');
        } else{
            $('.rad-sidebar').removeClass('rad_nav_min');
        }
    })
    //Check whether admin is logged in
    app.checkAdminSession = function(){
        if(AuthDashboard.dashboardLoggedIn()) {
            app.checkingAdminSession = true;
            if($state.$current.name === 'adminRegister' || $state.$current.name === 'adminLogin'){ 
                app.loadingPage = true;
                $state.go('dashboard.panel')
            }
            let interval = $interval(function(){
                let AdminToken = $window.localStorage.getItem('AdminToken');
                if(AdminToken === null){
                    $interval.cancel(interval)
                } else {
                    self.parseJwt = function(AdminToken) {
                        let base64Url = AdminToken.split('.')[1];
                        let base64 = base64Url.replace('-','+').replace('_','/');
                        return JSON.parse($window.atob(base64))
                    }
                    let expireTime = self.parseJwt(AdminToken);
                    let timeStamp = Math.floor(Date.now() / 1000);
                    let timeCheck = expireTime.exp - timeStamp;
                    if(timeCheck <= 1800) {
                        showAdminModal(1);
                        $interval.cancel(interval)
                    }
                }
            }, 3000)
        } 
    };
    app.checkAdminSession();
    //Show modal when logging our or session is ending
    function showAdminModal(option){
        app.choiceMade = false;
        app.modalHeader = undefined;
        app.modalBody = undefined;
        app.hideButton = false;
        if(option === 1) {
            app.modalHeader = 'The session is coming to end!';
            app.modalBody = 'The session will end in 30 minutes. Do you want to renew session?';
            $("#adminLogoutModal").modal({ backdrop: 'static' });
            $timeout(function(){
                if(!app.choiceMade) app.endAdminSession();
            },15000)
        } else if(option === 2){
            app.hideButton = true;
            app.modalHeader = "Logging out!";
            $("#adminLoggingOut").modal('show');
            $timeout(function(){
                hideAdminModal();
                $('.modal-backdrop').remove();
                AuthDashboard.adminLogout(); 
                $state.go('adminLogin');
                app.adminAuthorized = false;
                $anchorScroll()
            }, 2000)
        }
    };
    //Renew session as admin
    app.renewAdminSession = function(){
        app.choiceMade = true;
        User.renewAdminSession().then(function(data){
            if(data.data.success){
                AuthAdminToken.setToken(data.data.token);
                app.checkAdminSession();
            } else {
                app.modalBody = data.data.message;
            }
        })
        hideAdminModal()
    };
    //If admin won't renew session show modal(2) and log out
    app.endAdminSession = function() {
        app.choiceMade = true;
        hideAdminModal();
        $timeout(function(){
            showAdminModal(2)
        }, 1000);
    };
    //After every change route check whether admin is logged in and session don't expired
    $scope.$on('$stateChangeStart', function(){
        if(!app.checkingAdminSession) app.checkAdminSession();
        if(AuthDashboard.dashboardLoggedIn()){
            app.dashboardLoggedIn = true;
            AuthDashboard.getAdmin().then(function(data){ 
                if(data.data.adminAuthenticated === false) {
                    $window.localStorage.removeItem('AdminToken');
                    $state.go('parent.home')
                }
                User.getAdminPermission().then(function(data){
                    if(data.data.permission === 'AuthAdmin') {
                        app.adminAuthorized = true;
                        app.loadme = true;
                    } else {
                        app.loadme = true;
                    }
                })
            })
        } else {
            app.dashboardLoggedIn = false;
            app.loadme = true;
        }
    })
    //Create admin account, save password to admin account 
    app.addPassword = function(adminData, valid) {
        if(valid){
            app.correctAdmin = false;
            app.saveAdminPassword = true;
            User.saveAdminPassword(adminData).then(function(data){
                if(data.data.success){
                    app.successMsg = data.data.message; 
                    app.disabled = true;
                    app.saveAdminPassword = false;
                    $timeout(function(){
                        app.disabled = false;
                        $scope.adminAccountReg.$setPristine()
                        app.adminData = {
                            secretAdmin: '',
                            confirmSecretAdmin: '',
                        };
                    },1000)
                } else {
                    app.saveAdminPassword = false;
                    app.errorMsg = data.data.message
                    $timeout(function(){
                        app.errorMsg = false;
                    },5000)
                }
            })
        } else {
            app.errorMsg = 'Password no provided';
            $timeout(function(){
                app.errorMsg = false;
            },2000)
        }
    }
    //Authenticate admin
    app.loginAdmin = function(loginAdminData, valid){
        if(valid) {
            app.loading = true;
            app.errorMsg = false;
            app.expired = false;

            AuthDashboard.loginAdmin(loginAdminData).then(function(data){     
                if(data.data.success) {
                    app.loading = false;
                    app.successMsg = data.data.message + '...Redirecting';
                    $timeout(function(){                        
                        $scope.formSignin.$setPristine()
                        app.loginAdminData = {
                            secret: '',
                            admin: '',
                        };
                        app.successMsg = false;
                        $anchorScroll();
                        app.checkAdminSession();
                        $state.go('dashboard.panel');
                    },1000);
                } else {
                    if(data.data.expired) {
                        app.expired = true;
                        app.loading = false;
                        app.errorMsg = data.data.message;
                        $timeout(function(){   
                            app.errorMsg = false;
                        },2500)
                    } else {
                        app.loading = false;
                        app.errorMsg = data.data.message;
                        $timeout(function(){   
                            app.errorMsg = false;
                        },2500)
                    }
                }
            }) 
        } else {
            app.loading = false;
            app.errorMsg = 'Fill the form correctly';
            $timeout(function(){   
                app.errorMsg = false;
            },2500)
        }
    };
    //Log out from admin dashboard
    app.adminLogout = function(){
        showAdminModal(2);
    }
}])
.controller('activateAdminCtrl', ['$stateParams', 'User', function($stateParams, User){
    let app = this;
    //Activate admin account
    User.activateAdminAccount($stateParams.token).then(function(data){
        app.errorMsg = false;
        app.successMsg = false;
        if(data.data.success){
            app.successMsg = data.data.message + '...Redirecting';
        } else {
            app.errorMsg = data.data.message + '...Redirecting';
        }
    });
}])
.controller('resendAdminCtrl', ['User', function(User){
    let app = this;
    //Resend admin activation link
    app.checkAdminCredentials = function(loginAdminData){
        app.disabled = true;
        app.errorMsg = false;
        User.checkAdminCredentials(app.loginAdminData).then(function(data){
            if(data.data.success){
                User.resendAdminLink(app.loginAdminData).then(function(data){
                    if(data.data.success){
                        app.successMsg = data.data.message;
                    } else {
                        app.errorMsg = data.data.message;
                    }
                });
            } else {
                app.disabled = false;
                app.errorMsg = data.data.message;
            }
        })
    }
}])
.controller('manageUserCtrl', ['User','$window','$timeout', function(User, $window, $timeout) { 
    
    let app = this;

    app.loadingPage = true;
    app.errorMsg = false;
    app.selectNumber = '15'
    app.currentPage = 1;
    app.itemsPerPage = app.selectNumber; 
    //Check the width of the window and adjust the navigation bar
    function innerWidth (){
        if($window.innerWidth <= 1199){
            $('.rad-sidebar').addClass('rad_nav_min');
            $('.al-main').css('margin-left','5px');
        } else {
            $('.rad-sidebar').removeClass('rad_nav_min');
            $('.al-main').css('margin-left','155px');
        }
    };
    innerWidth ();
    //Get all users from database
    (function(){
        User.getUsers().then(function(data){
            if(data.data.permission === 'AuthAdmin' && data.data.success) {
                app.users = data.data.users;
                app.loadingPage = false;
            } else {
                app.errorMsg = data.data.message;
                app.loadingPage = false;
            }
        });
    })();
    //Remove user account
    app.removeUserAccount = function(username){
        User.deleteUser(username).then(function(data){
            if(data.data.success) {
                app.deleteMsg = data.data.message;
                $timeout(function(){
                    app.deleteMsg = false;
                    getUsers();
                },3000)
            } else {
                app.deleteErrMsg = data.data.message;
            }
        })
    }
    //Show modal with user details
    app.showDeletedUser = function(person){
        app.deleteUser = person;
        $('#removeUser').modal('show');
    }
    //Set number of rows on page, pagination
    app.setItemsPerPage = function(num){
        app.itemsPerPage = num;
        app.currentPage = 1  
    }
    //Filter users
    app.sortByInput = function(record, input){
        User.getAdminPermission().then(function(data){
            if(data.data.permission === 'AuthAdmin'){
                User.getUsers().then(function(data){
                    if(data.data.success) {
                        if(input.length)  {
                            app.users = data.data.users.filter(function(item){
                                return item[record].toString().toUpperCase().indexOf(input.toUpperCase()) !== -1
                            })
                        } else {
                            app.users = data.data.users
                        }
                    } else {
                        app.errorMsg = data.data.message;
                    }
                });
            } else {
                app.errorMsg = "You don't have the right permission"
            }
        })
    }
    //Sort according to the following conditions 
    app.sortBy = function(propertyName){     
        app.reverse = (app.propertyName === propertyName) ? !app.reverse : false;
        app.propertyName = propertyName
        User.getAdminPermission().then(function(data){
            if(data.data.permission === 'AuthAdmin'){
                User.getUsers().then(function(data){
                    if(data.data.success) {
                        app.users = data.data.users.sort(function(a,b){
                            return app.reverse ? a[propertyName].toString().toUpperCase() < b[propertyName].toString().toUpperCase() : a[propertyName].toString().toUpperCase() > b[propertyName].toString().toUpperCase()
                        })
                    } else {
                        app.errorMsg = data.data.message;
                    }
                });
            } else {
                app.errorMsg = "You don't have the right permission"
            }
        })
    }
}])
.controller('editCtrl', ['$scope','$stateParams','User','$timeout','$window', function($scope,$stateParams,User,$timeout,$window){
    let app = this;
    $scope.nameTab = 'active';
    app.phase1 = true;
    app.loadingPage = true;

    //Check the width of the window and adjust the navigation bar
    function innerWidth (){
        if($window.innerWidth <= 1199){
            $('.rad-sidebar').addClass('rad_nav_min');
            $('.al-main').css('margin-left','5px');
        } else {
            $('.rad-sidebar').removeClass('rad_nav_min');
            $('.al-main').css('margin-left','155px');
        }
    };
    innerWidth ()
    //Get user details
    User.getUser($stateParams.id).then(function(data){
        if(data.data.permission === 'AuthAdmin' && data.data.success){
            $scope.newName = data.data.user.name;
            $scope.newEmail = data.data.user.email;
            $scope.newUsername = data.data.user.username;
            $scope.newPermission = data.data.user.permission;
            app.currentUser = data.data.user._id;
            app.loadingPage = false;
        } else {
            app.errorMsg = data.data.message;
        }
    });
    //Tab managament
    app.newPhase = function() {
        $scope.nameTab = 'active';
        $scope.usernameTab = 'default';
        $scope.emailTab = 'default';
        $scope.permissionsTab = 'default';
        app.phase1 = true;
        app.phase2 = false;
        app.phase3 = false;
        app.phase4 = false;
        app.errorMsg = false;
    };
    //Tab managament
    app.emailPhase = function() {
        $scope.nameTab = 'default';
        $scope.usernameTab = 'default';
        $scope.emailTab = 'active';
        $scope.permissionsTab = 'default';
        app.phase1 = false;
        app.phase2 = false;
        app.phase3 = true;
        app.phase4 = false;
        app.errorMsg = false;
    };
    //Tab managament
    app.usernamePhase = function() {
        $scope.nameTab = 'default'; 
        $scope.usernameTab = 'active'; 
        $scope.emailTab = 'default'; 
        $scope.permissionsTab = 'default'; 
        app.phase1 = false;
        app.phase2 = true; 
        app.phase3 = false;
        app.phase4 = false; 
        app.errorMsg = false;
    };
    //Tab managament
    app.permissionsPhase = function(){
        $scope.nameTab = 'default';
        $scope.usernameTab = 'default';
        $scope.emailTab = 'default';
        $scope.permissionsTab = 'active';
        app.phase1 = false;
        app.phase2 = false;
        app.phase3 = false;
        app.phase4 = true; 
        app.disableUser = false; 
        app.disableModerator = false
        app.disableAdmin = false;
        app.errorMsg = false; 

        if($scope.newPermission === 'user') {
            app.disableUser = true;
        } else if($scope.newPermission === 'admin') {
            app.disableAdmin = true;
        }
    };
    //Update user name
    app.updateName = function(newName, valid) {
        app.errorMsg = false;
        app.disabled = true;
        if(valid){
            let userObject = {};
            userObject._id = app.currentUser;
            userObject.name = $scope.newName;
            app.loadingChange = true;
            User.editUser(userObject).then(function(data){
                if(data.data.permission === 'AuthAdmin' && data.data.success){
                    app.successMsg = data.data.message;
                    app.loadingChange = false;
                    $timeout(function(){
                        app.nameForm.name.$setPristine();
                        app.nameForm.name.$setUntouched();
                        app.successMsg = false;
                        app.disabled = false;
                    }, 2500);
                } else {
                    app.errorMsg = data.data.message;
                    app.loadingChange = false;
                }
            });
        } else {
            app.loadingChange = false;
            app.errorMsg = 'Fill the form correctly';
            app.disabled = false;
        }
    };
    //Update user email
    app.updateEmail = function(newEmail, valid) {
        app.errorMsg = false;
        app.disabled = true;
        if(valid) {
            let userObject = {};
            userObject._id = app.currentUser;
            userObject.email = $scope.newEmail;
            app.loadingChange = true;
            User.editUser(userObject).then(function(data){
                if(data.data.permission === 'AuthAdmin' && data.data.success){
                    app.successMsg = data.data.message;
                    app.loadingChange = false;
                    $timeout(function(){
                        app.emailForm.email.$setPristine();
                        app.emailForm.email.$setUntouched();
                        app.successMsg = false;
                        app.disabled = false;
                    }, 2000);
                } else {
                    app.errorMsg = data.data.message;
                    app.disabled = false;
                    app.loadingChange = false;
                }
            });
        } else {
            app.errorMsg = 'Fill the form correctly';
            app.disabled = false;
            app.loadingChange = false;
        }
    };
    //Update user username
    app.updateUsername = function(newUsername, valid) {
        app.errorMsg = false;
        app.disabled = true;
        if(valid){
            let userObject = {};
            userObject._id = app.currentUser;
            userObject.username = $scope.newUsername;
            app.loadingChange = true;
            User.editUser(userObject).then(function(data){
                if(data.data.permission === 'AuthAdmin' && data.data.success) {
                    app.successMsg = data.data.message;
                    app.loadingChange = false;
                    $timeout(function(){
                        app.usernameForm.username.$setPristine();
                        app.usernameForm.username.$setUntouched();
                        app.successMsg = false;
                        app.disabled = false;
                    },2000);
                } else {
                    app.errorMsg = data.data.message;
                    app.disabled = false;
                    app.loadingChange = false;
                }
            });
        } else {
            app.errorMsg = 'Fill the form correctly';
            app.disabled = false;
            app.loadingChange = false;
        }
    };
    //Update user permission
    app.updatePermissions = function(newPermission) {
        let userObject = {};
        userObject._id = app.currentUser;
        userObject.permission = newPermission;
        app.errorMsg = false;
        app.disableUser = true;
        app.disableModerator = true;
        app.disableAdmin = true;
        app.loadingChange = true;

        User.editUser(userObject).then(function(data){
            if(data.data.permission === 'AuthAdmin' && data.data.success) {
                app.successMsg = data.data.message;
                app.loadingChange = false;
                $timeout(function(){
                    app.successMsg = false;
                    $scope.newPermission = newPermission;
                    if(newPermission === 'user') {
                        app.disableUser = true;
                        app.disableAuthAdmin = false;
                        app.disableAdmin = false;
                    } else if(newPermission === 'admin') {
                        app.disableUser = false;
                        app.disableAuthAdmin = false;
                        app.disableAdmin = true;
                    }
                }, 2000)
            } else {
                app.loadingChange = false;
                app.errorMsg = data.data.message;
                app.disabled = false;
            }
        })
    }
}])
.controller('editProductCtrl', ['$scope','$stateParams','User','$timeout','$state', function($scope,$stateParams,User,$timeout, $state){
    let app = this;
    let socket = io.connect(); 
    let editCourseImg = [];
    app.comments = [];
    //comments pagination 
    app.selectNumber = '15'
    //comments pagination
    app.currentPage = 1; 
    //comments pagination
    app.itemsPerPage = app.selectNumber;  
    app.imagePreview = false;
    app.thumbnail = {
        dataUrl: null,
    };
    //Get course details
    User.getProduct($stateParams.id).then(function(data){
        if(data.data.success){
            if(data.data.product.imagePath){
                app.newImage = data.data.product.imagePath; 
                app.imagePreview = true;
            }
            if(data.data.product.author) {
                app.authorName = data.data.product.author.name;
                app.authorEdu = data.data.product.author.education;
                app.authorDescription = data.data.product.author.description;
            }
            app.introText = data.data.product.introText;
            app.newTitle = data.data.product.title;
            app.newSubtitle = data.data.product.subTitle;
            app.newLevel = data.data.product.level;
            app.newDescription = data.data.product.description;
            app.newOldPrice = data.data.product.oldPrice;
            app.newNewPrice = data.data.product.newPrice;
            app.comments = data.data.product.comments;
            app.editBody = data.data.product.body;
            app.totalItems = data.data.product.comments.length;
            if(data.data.product.level == 'fa fa-3x fa-battery-quarter text-primary level-higher-easy'){
                $scope.currentLevel = 'Easy'
                app.disableEasy = true;
                app.disableMedium = false;
                app.disableHard = false;
            } else if(data.data.product.level == 'fa fa-3x fa-battery-half text-primary level-higher-medium') {
                $scope.currentLevel = 'Medium';
                app.disableMedium = true;
                app.disableEasy = false;
                app.disableHard = false;
            } else if(data.data.product.level == 'fa fa-3x fa-battery-full text-primary level-higher-hard') {
                $scope.currentLevel = 'Advanced';
                app.disableEasy = false;
                app.disableMedium = false;
                app.disableHard = true;
            } 
            app.currentProduct = data.data.product._id;
        } else {
            app.errorMsg = data.data.message;
        }
    });  
    //Change the photo of course
    app.photoChanged = function(files) {
        editCourseImg = [];
        if(files.length > 0 && files[0].name.match(/\.(png|jpeg|jpg)$/)) {
            app.uploading = true;
            app.imagePreview = true;
            var file = files[0];
            editCourseImg.push(file)
            for(let i = 0; i < editCourseImg.length; i++) {
                var fileReader = new FileReader();
                fileReader.readAsDataURL(editCourseImg[i]);
                fileReader.onload = function(e) {
                    $timeout(function() {
                        app.thumbnail = {};
                        app.thumbnail.dataUrl = e.target.result;
                        app.uploading = false;                   
                    });
                };
            }
        } else {
            app.thumbnail = {};
        }
    };
    $scope.$watch('file.newCourse', function(newFile){
        if(newFile) {
            app.newImage = newFile.name
        }
    })
    //Remove selected photo
    app.clearImage = function(file){
        let but = document.querySelector("#selectImage");
        app.uploading = false;
        app.imagePreview = false;
        app.thumbnail.dataUrl = '';
        app.newImage = '';
        editCourseImg = [];
        angular.element(but).val(null);
    } 
    //Comments pagination
    app.setItemsPerPage = function(num){ // viewed comments on page
        app.itemsPerPage = num;
        app.currentPage = 1
    }
    //sort comments by date
    app.sortComment = function(propertyName){
        app.reverse = (app.propertyName === propertyName) ? !app.reverse : false; 
        app.propertyName = propertyName
    }
    //Return current photo of the course
    app.backChanges = function(){
        User.getProduct($stateParams.id).then(function(data){
            app.newImage = data.data.product.imagePath;
            app.imagePreview = true;
            app.thumbnail.dataUrl = '';
            editCourseImg = [];
        })
    }
    //Update the photo of the course
    app.updateImage = function(path){
        let userObject = {};
        app.imgErrMsg = false;
        app.editImageMsg = false;
        app.disabled = true;
        userObject._id  = app.currentProduct;
        userObject.imagePath = path;
        if(userObject.imagePath){
            User.editProduct(userObject).then(function(data){
                if(data.data.success){
                    app.imgErrMsg = false;
                    app.disabled = false;
                    app.editImageMsg = data.data.message;
                    $timeout(function(){
                        app.editImageMsg = false;
                        app.disabled = false;
                    },2000);
                    socket.emit('update course', data.data.image, app.currentProduct, 'imagePath');
                } else {
                    app.editImageMsgErr = data.data.message;
                    $timeout(function(){
                        app.disabled = false;
                        app.editImageMsgErr = false;
                    },2000)
                }
            })
            //upload new photo
            User.upload(editCourseImg).then(function(data) {
                if (data.data.success) { 
                    app.uploading = false;            
                    $scope.file = {};
                } else {
                    app.uploading = false;
                    app.errorMsg = data.data.message;
                    $scope.file = {};
                    $timeout(function(){
                        app.errorMsg = false;
                    },2000)
                }
            })            
        } else {
            app.imgErrMsg = true;
            $timeout(function(){
                app.disabled = false;
            },2000)
        }
    }
    //Update the author of the course
    app.updateAuthorName = function(valid){
        let userObject = {};
        userObject._id  = app.currentProduct;
        userObject.authorName = app.authorName;
        app.editAuthorNameMsg = false;
        app.disabled = true;        
        if(valid){
            User.editProduct(userObject).then(function(data){
                if(data.data.success){
                    app.disabled = false;
                    app.editAuthorNameMsg = data.data.message;
                    $timeout(function(){
                        app.editAuthorNameMsg = false;
                        app.disabled = false;
                    },2000);
                    socket.emit('update course', data.data.authorName, app.currentProduct, 'authorName');
                } else {
                    app.editAuthorNameMsgErr = data.data.message;
                    $timeout(function(){
                        app.editAuthorNameMsgErr = false;
                    },2000)
                }
            })
        } else {
            app.editAuthorNameMsg = 'Add the author name';
            $timeout(function(){
                app.editAuthorNameMsg = false;
                app.disabled = false;
            },2000);
        }
    }
    //Update education of the author
    app.updateAuthorEdu = function(valid){
        let userObject = {};
        userObject._id  = app.currentProduct;
        userObject.authorEdu = app.authorEdu;        
        app.editAuthorEduMsg = false;
        app.disabled = true;
        if(valid){
            User.editProduct(userObject).then(function(data){
                if(data.data.success){
                    app.disabled = false;
                    app.editAuthorEduMsg = data.data.message;
                    $timeout(function(){
                        app.editAuthorEduMsg = false;
                        app.disabled = false;
                    },2000);
                    socket.emit('update course', data.data.authorEdu, app.currentProduct, 'authorEducation');
                } else {
                    app.editAuthorEduMsgErr = data.data.message;
                    $timeout(function(){
                        app.editAuthorEduMsgErr = false;
                    },2000)
                }
            })
        } else {
            app.editAuthorEduMsg = 'Add the auhor education';
            $timeout(function(){
                app.editAuthorEduMsg = false;
                app.disabled = false;
            },2000);
        }
    }
    //Update description of the author
    app.updateAuthorDes = function(){
        let userObject = {};
        app.editAuthorDesMsg = false;
        app.disabled = true;
        userObject._id  = app.currentProduct;
        userObject.authorDes = app.authorDescription;
        User.editProduct(userObject).then(function(data){
            if(data.data.success){
                app.disabled = false;
                app.editAuthorDesMsg = data.data.message;
                $timeout(function(){
                    app.editAuthorDesMsg = false;
                    app.disabled = false;
                },2000);
                socket.emit('update course', data.data.authorDes, app.currentProduct, 'authorDescription');
            } else {
                app.editAuthorDesMsgErr = data.data.message;
                $timeout(function(){
                    app.editAuthorDsMsgErr = false;
                },2000)
            }
        })
    }
    //Update description of the course
    app.updateBody = function(){
        var userObject = {};
        app.editBodyMsg = false;
        app.disabled = true;
        userObject._id  = app.currentProduct;
        userObject.body = app.editBody;
        User.editProduct(userObject).then(function(data){
            if(data.data.success){
                app.disabled = false;
                app.editBodyMsg = data.data.message;
                $timeout(function(){
                    app.editBodyMsg = false;
                    app.disabled = false;
                },2000);
                socket.emit('update course', data.data.body, app.currentProduct, 'body');
            } else {
                app.editBodyMsgErr = data.data.message;
                $timeout(function(){
                    app.editBodyMsgErr = false;
                },2000)
            }
        })
    }
    //Update the title of the course
    app.updateTitle = function(newTitle, valid) {
        app.titleErrMsg = false;
        app.disabled = true;
        if(valid){
            let userObject = {};
            userObject._id = app.currentProduct;
            userObject.title = app.newTitle;
            User.editProduct(userObject).then(function(data){
                if(data.data.success && data.data.title){
                    app.titleMsg = data.data.message;
                    $timeout(function(){
                        app.titleForm.title.$setPristine();
                        app.titleForm.title.$setUntouched();
                        app.titleMsg = false;
                        app.disabled = false;
                    }, 2000);
                    socket.emit('update course', data.data.title, app.currentProduct, 'title');
                } else {
                    app.titleErrMsg = data.data.message;
                    $timeout(function(){
                        app.titleErrMsg = false;
                    }, 2000);
                }
            });
        } else { 
            app.titleErrMsg = 'Incorrect title input';
            $timeout(function(){
                app.titleErrMsg = false;
            }, 2000);
            app.disabled = false;
        }
    };
    //Update the subtitle of the course 
    app.updateSubtitle = function(newSubtitle, valid) {
        app.subTitleErrMsg = false;
        app.disabled = true;
        if(valid) {
            let userObject = {};
            userObject._id = app.currentProduct;
            userObject.subTitle = app.newSubtitle;
            User.editProduct(userObject).then(function(data){
                if(data.data.success && data.data.subtitle){
                    app.subtitleMsg = data.data.message;
                    $timeout(function(){
                        app.subtitleForm.subTitle.$setPristine();
                        app.subtitleForm.subTitle.$setUntouched();
                        app.subtitleMsg = false;
                        app.disabled = false;
                    }, 2000);
                    socket.emit('update course', data.data.subtitle, app.currentProduct, 'subTitle');
                } else {
                    app.subTitleErrMsg = data.data.message;
                    $timeout(function(){
                        app.subTitleErrMsg = false;
                    }, 2000);
                }
            });
        } else {
            app.subTitleErrMsg = "Invalid subtitle input";
            app.disabled = false;
            $timeout(function(){
                app.subTitleErrMsg = false;
            }, 2000);
        }
    }
    //Update old price of the course
    app.updateOldPrice = function(newOldPrice, valid) {
        app.OldPriceErrMsg = false;
        app.disabled = true;
        if(valid) {
            let userObject = {};
            userObject._id = app.currentProduct;
            userObject.oldPrice = app.newOldPrice;
            User.editProduct(userObject).then(function(data){
                if(data.data.success){
                    app.oldPriceMsg = data.data.message;   
                    $timeout(function(){
                        app.oldPriceForm.$setPristine();
                        app.oldPriceForm.$setUntouched();
                        app.oldPriceMsg = false;
                        app.disabled = false;
                    }, 2000);
                    socket.emit('update course', data.data.oldPrice, app.currentProduct, 'oldPrice');
                } else {
                    app.OldPriceErrMsg = data.data.message;
                    $timeout(function(){
                        app.OldPriceErrMsg = false;
                        app.disabled = false;
                    }, 2000);
                }
            });
        } else {
            app.OldPriceErrMsg = "Invalid old price";
            app.disabled = false;
            $timeout(function(){
                app.OldPriceErrMsg = false;
                app.disabled = false;
            }, 2000);
        }
    }
    //Update new price
    app.updateNewPrice = function(newNewPrice, valid) {
        app.newPriceErMsg = false;
        app.disabled = true;
        if(valid) {
            let userObject = {};
            userObject._id = app.currentProduct;
            userObject.newPrice = app.newNewPrice;
            User.editProduct(userObject).then(function(data){
                if(data.data.success){
                    app.newPriceMsg = data.data.message;
                    $timeout(function(){
                        app.newPriceForm.$setPristine();
                        app.newPriceForm.$setUntouched();
                        app.newPriceMsg = false;
                        app.disabled = false;
                    }, 2000);
                    socket.emit('update course', data.data.newPrice, app.currentProduct, 'newPrice');
                } else {
                    app.newPriceErMsg = data.data.message;
                    $timeout(function(){
                        app.newPriceErMsg = false;
                        app.disabled = false;
                    }, 2000);
                }
            });
        } else {
            app.newPriceErMsg = "Invalid new price input";
            $timeout(function(){
                app.newPriceErMsg = false;
                app.disabled = false;
            }, 2000);
        }
    }
    //Update description of the course
    app.updateDescription = function(newDescription, valid) {
        app.descriptionErrMsg = false;
        app.disabled = true;
        if(valid) {
            let userObject = {};
            userObject._id = app.currentProduct;
            userObject.description = app.newDescription;
            User.editProduct(userObject).then(function(data){
                if(data.data.success){
                    app.descriptionMsg = data.data.message;
                    $timeout(function(){
                        app.descriptionForm.$setPristine();
                        app.descriptionForm.$setUntouched();
                        app.descriptionMsg = false;
                        app.disabled = false;
                    }, 2000);
                    socket.emit('update course', data.data.description, app.currentProduct, 'description');
                } else {
                    app.descriptionErrMsg = data.data.message;
                    $timeout(function(){
                        app.descriptionErrMsg = false;
                    }, 2000);
                }
            });
        } else {
            app.descriptionErrMsg = "Invalid description input";
            app.disabled = false;
            $timeout(function(){ 
                app.descriptionErrMsg = false;
            }, 2000); 
        }
    }
    //Add new description to the course
    app.addDescription = function(addDescription, valid) {
        app.AddDesErrMsg = false;
        app.disabled = true;
        if(valid) {
            let userObject = {};
            userObject._id = app.currentProduct;
            userObject.addDescription = addDescription;
            User.editProduct(userObject).then(function(data){
                if(data.data.success && data.data.description){
                    app.AddDesMsg = data.data.message;
                    $timeout(function(){
                        app.addForm.$setPristine();
                        app.addForm.$setUntouched();
                        app.addNextDescription = '';
                        app.AddDesMsg = false;
                        app.disabled = false;
                    }, 2000);
                    socket.emit('update course', data.data.description, app.currentProduct, 'description');
                } else {
                    app.AddDesErrMsg = data.data.message;
                    $timeout(function(){
                        app.AddDesErrMsg = false;
                        app.disabled = false;
                    }, 2000);
                }
            });
        } else {
            app.AddDesErrMsg = "Invalid new description input";
            $timeout(function(){
                app.AddDesErrMsg = false;
                app.disabled = false;
            }, 2000);
        }
    }
    //Update level of the course
    app.updateLevel = function(newLevel) {
        let userObject = {};
        userObject._id = app.currentProduct;
        userObject.level = newLevel;
        app.errorMsg = false;
        app.disableEasy = false;
        app.disableMedium = false;
        app.disableHard = false;
        User.editProduct(userObject).then(function(data){
            if(data.data.success) {
                app.disableEasy = true;
                app.disableMedium = true;
                app.disableHard = true;
                app.levelMsg = data.data.message;
                $timeout(function(){
                    app.levelMsg = false;
                    $scope.newLevel = newLevel;
                    if(newLevel == 'fa fa-3x fa-battery-quarter text-primary level-higher-easy') {
                        $scope.currentLevel = 'Easy';
                        app.disableEasy = true;
                        app.disableMedium = false;
                        app.disableHard = false;
                    } else if(newLevel == 'fa fa-3x fa-battery-half text-primary level-higher-medium') {
                        $scope.currentLevel = 'Medium';
                        app.disableMedium = true;
                        app.disableEasy = false;
                        app.disableHard = false;
                    } else if(newLevel == 'fa fa-3x fa-battery-full text-primary level-higher-hard') {
                        $scope.currentLevel = 'Advanced';
                        app.disableEasy = false;
                        app.disableMedium = false;
                        app.disableHard = true;
                    }
                }, 2000)
                socket.emit('update course', data.data.level, app.currentProduct, 'level');
            } else {
                app.levelErrMsg = data.data.message;
                app.disabled = false;
            }
        })
    }
    //Remove description of the course
    app.removeDescription = function(description, newDescription, index){
        let deleteDescription = {};
        deleteDescription._id = app.currentProduct;
        deleteDescription.description = description;
        deleteDescription.array = newDescription;
        deleteDescription.index = index;
        User.deleteDescription(deleteDescription).then(function(data){
            if(data.data.success) {
                app.descriptionErrMsg = false;
                app.disabled = true;
                app.descriptionMsg = data.data.message;             
                $timeout(function(){
                    app.descriptionMsg = false;
                    app.disabled = false;
                }, 2000);
                socket.emit('update course', data.data.product.description, app.currentProduct, 'description');
            } else {
                app.descriptionErrMsg = data.data.message;
                $timeout(function(){
                    app.descriptionErrMsg = false;
                }, 2000);
            }
        })
    } 
    //Edit introduction to the course
    app.updateIntro = function(){
        let userObject = {};
        app.editIntroMsg = false;
        app.disabled = true;
        userObject._id  = app.currentProduct;
        userObject.introText = app.introText;
        User.editProduct(userObject).then(function(data){
            if(data.data.success){
                app.disabled = false;
                app.editIntroMsg = data.data.message;
                $timeout(function(){
                    app.editIntroMsg = false;
                    app.disabled = false;
                },2000);
                socket.emit('update course', data.data.intro, app.currentProduct, 'introText');
            } else {
                app.editIntroMsgErr = data.data.message;
                $timeout(function(){
                    app.editIntroMsgErr = false;
                },2000)
            }
        })
    }
    //Show modal with comment details
    app.showDeletedComment = function(comment){
        app.deletedComment = comment; 
        $('#removeComment').modal('show');
    }
    //Show modal with reply details
    app.showDeletedReply = function(reply, comment){
        app.deletedReply = reply; 
        app.deletedComment = comment; 
        $('#removeReply').modal('show');
    }
    //Remove comment
    app.deleteComment = function(comment){
        let removeComment = {};
        removeComment._id = app.currentProduct;
        removeComment.comment = comment;
        User.removeComment(removeComment).then(function(data){ 
            if(data.data.success) {
                app.errorMsg = false;
                app.disabled = true;
                app.delCommentMsg = data.data.message;           
                $timeout(function(){
                    app.delCommentMsg = false;
                    app.disabled = false;
                }, 2000);
                socket.emit('update comment', data.data.product.comments, app.currentProduct); 
            } else {
                app.delCommentMsgErr = data.data.message;
            }
        })
    }
    //Remove reply
    app.deleteReply = function(reply, comment){
        let removeReply = {};
        removeReply._id = app.currentProduct;
        removeReply.reply = reply;
        removeReply.commentId = comment._id
        User.removeReply(removeReply).then(function(data){
            if(data.data.success) {
                app.disabled = true;
                app.delCommentMsg = data.data.message;           
                $timeout(function(){
                    app.delCommentMsg = false;  
                    app.disabled = false;
                }, 2000);
                socket.emit('update reply', data.data.product.comments, app.currentProduct); 
            } else { 
                app.delCommentMsgErr = data.data.message;
                $timeout(function(){
                    app.delCommentMsgErr = false;
                },2000)
            }
        })
    }
    //Add comment as admin
    app.AddDashboardComment = function(comment, valid) {     
        app.disabled = true;
        app.loading = true;
        app.errorMsg = false;       
        let userComment = {};  
        if(valid){     
            userComment._id = app.currentProduct; 
            userComment.comment = comment;        
            User.postAdminComment(userComment).then(function(data){  
                if(data.data.success){ 
                    app.commentAdminMsg = 'Comment has been added!';
                    app.loading = false;
                    $timeout(function(){
                        $scope.editProduct.comment = '';
                        app.AdminCommentForm.$setPristine();  
                        app.AdminCommentForm.$setUntouched(); 
                        app.commentAdminMsg = false;
                        app.disabled = false;
                    },2000);                        
                        socket.emit('new comment', app.currentProduct, data.data.product.comments[data.data.product.comments.length-1]); 
                    } else {
                        app.disabled = false;
                        app.loading = false;
                        app.commentAdminErrMsg = data.data.message;
                    }  
                });             
        } else {
            app.disabled = false;
            app.loading = false; 
            app.commentAdminErrMsg = 'Your comment has not been added. Add some content';
            $timeout(function(){
                app.AdminCommentForm.$setPristine();  
                app.AdminCommentForm.$setUntouched();   
                app.commentAdminErrMsg = false;
            },3000)  
        } 
    } 
    //Add reply to the comment as admin
    app.replyComment = function(reply, body, form, index){
        let adminReply = {};
        let liveReply = {};
        if(form.$valid){
            adminReply.replyComment = body;
            adminReply.id = reply
            adminReply._id = app.currentProduct;
            User.replyComment(adminReply).then(function(data){
                if(data.data.success){ 
                    app.disabled = true;
                    liveReply.index = index-1;
                    liveReply.username = data.data.user.username;
                    liveReply.reply = data.data.product.comments[index-1].reply[data.data.product.comments[index-1].reply.length-1];
                    app.replyAdminMsg = 'Comment has been added!';
                    app.loading = false;
                    $timeout(function(){
                        app.commentReply[index] = '';
                        form.$setPristine();
                        app.replyAdminMsg = false;
                        app.disabled = false;
                    },2000);                        
                    socket.emit('reply', liveReply);                        
                } else {
                    app.disabled = false;
                    app.loading = false;
                    app.replyAdminErrMsg = data.data.message;
                }              
            })
        } else {
            app.disabled = false;
            app.loading = false; 
            app.replyAdminErrMsg = 'Your comment has not been added. Add some content.';
            $timeout(function(){
                app.replyAdminErrM = false;
            },3000)  
        }
    }
    //Client sockets
    socket.on('updateComment', function(data){
        app.comments = data.comment;  
    });
    socket.on('updateReply', function(data){
        app.comments = data.reply;  
    });
    socket.on('newComment', function(data){
        app.comments.push(data.comment);  
    });
    socket.on('reply', function(data){
        app.comments[data.reply.index].reply.push(data.reply.reply)
    });
    socket.on('updateCourse', function(data){
        switch(data.name) {
            case 'description':
                app.newDescription = data.record
            break
            case 'title':
                app.newTitle = data.record
            break
            case 'subTitle':
                app.newSubtitle = data.record
            break
            case 'oldPrice':
                app.newOldPrice = data.record
            break
            case 'newPrice':
                app.newNewPrice = data.record
            break
            case 'level':
                app.newLevel = data.record
            break
            case 'body':
                app.editBody = data.record
            break
            case 'imagePath':
                app.newImage = data.record
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
    //Dynamically resize textarea
    let textarea = document.querySelector('textarea#admin-dash-textarea');
    textarea.addEventListener('keydown', function(){
        setTimeout(()=>{
            this.style.cssText = 'height:' + this.scrollHeight + 'px'
        },0)
    });
}])
.controller('managementProduct', ['User','$scope','$timeout', function(User, $scope, $timeout){ 

    let app = this;
    app.sorted = true;
    app.currentPage = 1;
    app.itemsPerPage = '16';
    app.selectSort = 'Sort';
    app.titleSort = 'titleSort';
    app.loadingPage = true;

    let socket = io.connect()
    //Get all courses
    User.getProducts().then(function(data){
        let titles = [];
        app.productsPag = data.data.products.sort((a,b) => (new Date(b.date) - new Date(a.date)));
        data.data.products.forEach(item => titles.push(item.title));

        app._titles = titles.filter(function(item, pos){
            return titles.indexOf(item) === pos
        });
        app.articlesCount = Array.from(app._titles).length > 3;
        app.loadingPage = false; 
    });
    //Sort course by title
    app.sortByCourse = function(event, propertyName){
        if(event){
            if(event.target.className.indexOf('sortedCourse') === -1){
                User.getProducts().then(function(data){
                    app.productsPag = data.data.products.filter(title => title.title === propertyName);
                });
                app.propertyLevel = undefined;
                app.propertyName = propertyName;
            } else {
                User.getProducts().then(function(data){
                    app.productsPag = data.data.products.sort((a,b) => (new Date(b.date) - new Date(a.date)));
                });
                app.propertyLevel = undefined;
                app.propertyName = undefined;
            }            
        } else {
            if(propertyName === 'allArticles'){
                User.getProducts().then(function(data){
                    app.productsPag = data.data.products.sort((a,b) => (new Date(b.date) - new Date(a.date)));
                });
                app.propertyName = false;
            } else {
                User.getProducts().then(function(data){
                    app.productsPag = data.data.products.filter(title => title.title === propertyName);
                });  
                app.propertyName = propertyName;              
            }
        }
    }
    //Sort course by the level
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
    //Sort course by following conditions 
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
    //Course pagination
    app.setItem = function(num){
        app.itemsPerPage = num;
        app.currentPage = 1;
    }
    //Show modal with course detials
    app.showDeletedVideo = function(video){
        app.deleteVideo = video;
        $('#removeVideo').modal('show');
    }
    //Remove course
    app.deleteVideoCourse = function(id){  
        User.deleteVideoCourse(id).then(function(data){
            if(data.data.success) {
                app.successDelMsg = data.data.message;
                $timeout(function(){
                    app.successDelMsg = false
                },2500)
                socket.emit('delete course', data.data.course); 
            } else {
                app.errDelMsg = data.data.message;
                $timeout(function(){
                    app.errDelMsg = false
                },2500)
            }
        })
    }
    //Client socket
    socket.on('deleteCourse', function(data){
        app.productsPag = app.productsPag.filter(function(item){
            return item._id != data.course
        });  
    });
}])
.controller('newBlogCtrl', ['$scope','User','$timeout', function($scope, User, $timeout){
    
    let app = this;
    app.inputs = []; 
    app.articleTags = []; 
    app.blog = {
        articleBlogImg: [],
        tags: [],
        description: []
    }
    app.thumbnail = {
        dataUrl: null,
    };
    //Add tag to article
    $("#tag-typer").keypress( function(event) {
        let key = event.which;
        if (key == 13 || key == 44){
            event.preventDefault();
            let tag = $(this).val();
            if(tag.length > 0){
                $("<span class='tag' style='display:none'><span class='close'>&times;</span>"+tag+" </span>").insertBefore(this).fadeIn(100);
                app.articleTags.push(tag.trim());
                $(this).val("");
            }
        }
    });
    //Remove tag from article
    $("#tags").on("click", ".close", function() {
        $(this).parent("span").fadeOut(100);
        for (let i = 0; i < app.articleTags.length; i++) {
            if (app.articleTags[i].trim() === $(this)[0].nextSibling.data.trim()) {
                app.articleTags.splice(i, 1);
            }
        }
    });
    //The photo of the article header
    $scope.articleIntroImg = function(files) {
        app.fileReaderSupported = window.FileReader != null;
        if (files != null) {
            let file = files[0];
            if(app.fileReaderSupported && files[0].name.match(/\.(png|jpeg|jpg)$/)) {
                $timeout(function(){
                    let fileReader = new FileReader();
                    fileReader.readAsDataURL(file);
                    fileReader.onload = function (e) {
                        $timeout(function () {
                            app.blog.articleBlogImg = file.name;
                            app.thumbnail.dataUrl = e.target.result;
                            app.imagePreview = true;
                        });
                    }
                });
            }
        }
    };
    //Add new input field to description of the course
    app.addfield = function(){
        app.inputs.push({})
    }  
    //Remove photo from header of the article
    app.clearImg = function(){
        app.uploading = false;
        app.blog.articleBlogImg = '';
        app.thumbnail.dataUrl = undefined;
        app.imagePreview = false;
        angular.forEach(
            angular.element(document.querySelector("#selectBlogImage")),
            function(inputElem) {
              angular.element(inputElem).val(null);
            }
        );
    }; 
    //Add new article to the database
    app.addNewArticle = function(blog, valid){
        blog.tags = app.articleTags;
        app.disabled = true;
        if(valid){
            User.newBlogArticle(blog).then(function(data){
                blog.tags = '';
                if(data.data.success){
                     app.disabled = false;
                     app.message = data.data.message;
                     $timeout(function(){
                         app.message = false;
                         app.blog = {};
                         $('span.tag').detach();
                         $scope.blogForm.$setPristine();
                         $scope.blogForm.contentEditDiv.$setPristine();
                         app.imagePreview = false;
                         app.articleTags.length = 0;
                         angular.forEach(
                             angular.element(document.querySelector("#selectBlogImage")),
                             function(inputElem) {
                             angular.element(inputElem).val(null);
                             }
                         );
                     },2000);
                     User.upload($scope.file).then(function(data) {
                         if (data.data.success) { 
                             app.uploading = false;            
                             $scope.file = {};
                         } else {
                             app.uploading = false;
                             app.errorMsg = data.data.message;
                             $scope.file = {};
                         }
                     }); 
                } else {
                    app.errMessage = data.data.message;
                    $timeout(function(){
                        app.errMessage = false;
                        app.disabled = false;
                    }, 2000)
                }
             })
        } else {
            app.errMessage = 'Fill the form correctly';
            $timeout(function(){
                app.errMessage = false;
                app.disabled = false;
            }, 2000)
        }
      }
}])
//Directive styling code snippet
.directive('codeContent', ['hljsService','$window','$sce', function(hljsService, $window, $sce){
    return {
        restrict: 'A',
        link: function(scope, iElm, iAttrs){
            scope.$watch($sce.parseAsHtml(iAttrs.codeContent), function(content){
                if(content){
                    iElm.html(content)
                    let service = $window.hljs || hljsService;
                    if(iElm.find('pre')[0]){
                        for(let i= 0; i<iElm.find('pre').length; i++){
                            service.highlightBlock(iElm.find('pre')[i])
                        }       
                    }
                } else {
                    iElm.html('')
                }
            })
        }
    }
}])
.directive('dateNow', ['$filter', function($filter){
    return {
        link: function($scope, $element, $attrs){
            $element.text($filter('date')(new Date(), $attrs.dateNow))
        }

    }
}])
.controller('allArticlesCtrl', ['$scope','User','$timeout',function($scope, User, $timeout){
   
    let app = this;
    let socket = io.connect();
    app.currentPage = 1;
    app.itemsPerPage = '15';
    app.selectSort = 'Sort';
    app.loadingPage = true;
    //Get all articles
    User.getArticles().then(function(data){
        let tags = [];
        app.articles = data.data.articles.sort((a,b) => (new Date(b.date) - new Date(a.date)));
        app.tags = data.data.articles.forEach(item => item.tags.forEach(tag => tags.push(tag)))
        app._tags = tags.filter(function(item, pos){
            return tags.indexOf(item) == pos
        });
        app.loadingPage = false; 
    });
    //Sort by following conditions
    app.applySortBy = function(sort){
        if(sort === 'allArticles'){
            User.getArticles().then(function(data){
                app.articles = data.data.articles.sort((a,b) => (new Date(b.date) - new Date(a.date)));
            })
        } else {
            User.getArticles().then(function(data){
                app.articles = data.data.articles.filter(item => item.tags.some(tag => sort === tag));
            })
        }
    }
    //Sort by title
    app.searchByTitle = function(sort){
        if(sort.length){
            User.getArticles().then(function(data){
                app.articles = data.data.articles.filter(item => item.title.substring(0,(sort.length)).toUpperCase() === sort.toUpperCase())
            })
        } else {
            sortUp()
        }
    }
    //Sort by date
    function sortDown(page, sort){
        app.sortDown = true;
        app.sortUp = false;
        User.getArticles().then(function(data){
            app.articles = data.data.articles.sort((a,b) => (new Date(a.date) - new Date(b.date)));
        })
    };
    //Sort by date
    function sortUp(page){
        app.sortUp = true;
        app.sortDown = false;
        User.getArticles().then(function(data){
            app.articles = data.data.articles.sort((a,b) => (new Date(b.date) - new Date(a.date)));
        })
    }
    //Sort by date
    app.sortByDate = function(select){
        app.currentPage = 1;
        let classList = select.currentTarget.firstElementChild.classList[2];
        if(classList === 'up'){
          select.currentTarget.lastChild.classList.remove('glyphicon-arrow-up','up')
          select.currentTarget.lastChild.classList.add('glyphicon-arrow-down', 'down')
          sortDown(app.currentPage, 'sortDown')
        } else if(classList === 'down') {
          select.currentTarget.lastChild.classList.remove('glyphicon-arrow-down','down')
          select.currentTarget.lastChild.classList.add('glyphicon-arrow-up', 'up')
          sortUp(app.currentPage)
        }
    }
    //Show modal with article details
    app.showDeletedArticle = function(article){
        app.deleteArticle = article;
        $('#removeArticle').modal('show');
    }
    //Remove article
    app.deleteArticles = function(article){
        User.deleteArticle(article._id).then(function(data){
            if(data.data.success){
                app.artMsg = data.data.message;
                $timeout(function(){
                    app.artMsg = false
                },2000)
                User.getArticles().then(function(items){
                    socket.emit('deleteArticle', items.data)
                })
            } else {
                app.artErrMsg = data.data.message;
                $timeout(function(){
                    app.artErrMsg = false
                },2000)
            }
        })
    }
    socket.on('deleteArticle', function(data){
        if(data.data.success){
            let tags = [];
            app.articles = data.data.articles.sort((a,b) => (new Date(b.date) - new Date(a.date)));
            app.tags = data.data.articles.forEach(item => item.tags.forEach(tag => tags.push(tag)))
            app._tags = tags.filter(function(item, pos){
                return tags.indexOf(item) == pos
            });
        }
    })
}])
.controller('editArticleCtrl', ['$scope', 'User', '$timeout', '$stateParams' ,function($scope, User, $timeout, $stateParams){
    let app = this;
    let socket = io.connect();
    app.articleTags = []; 
    app.selectNumber = '15'
    app.currentPage = 1;
    app.itemsPerPage = app.selectNumber; 
    //Get single article to edit
    User.editArticle($stateParams.id).then(function(data){
        app.user = data.data.id;
        app.title = data.data.articles[0].title;
        app.id = data.data.articles[0]._id;
        app.body = data.data.articles[0].body; 
        app.tags = data.data.articles[0].tags;
        app.author = data.data.articles[0].author;
        app.articleComments = data.data.articles[0].comments;
        app.totalItems = data.data.articles[0].comments.length;
        if(data.data.articles[0].imagePath){
            app.imagePath = data.data.articles[0].imagePath;          
            app.imagePreview = true;  
        }
        if(app.tags.length > 0){
            app.tags.forEach(function(i){
                return [$("<span class='tag'><span class='close'>&times;</span>"+i+" </span>").insertBefore('#tagsEdit-typer'), app.articleTags.push(i)];
            })
        }
       app.dislikeVote = function(rating){
            if(rating.length){
                for (var i = 0; i < rating.length; i++) {
                    if (rating[i].id == app.user && rating[i].vote === 'dislike') {
                        return "activeLike"
                    }
                }
            }
        }
        app.likeVote = function(rating){
            if(rating.length){
                for (var i = 0; i < rating.length; i++) {
                    if (rating[i].id == app.user && rating[i].vote === 'like') {
                        return "activeLike"
                    }
                }
            }
        }
        socket.emit('connect admin', app.id);
    });
    //Edit Article image
    $scope.articleEditImg = function (files) { 
        app.fileReaderSupported = window.FileReader != null;
        if (files != null) {
            let file = files[0];
            if (app.fileReaderSupported && files[0].name.match(/\.(png|jpeg|jpg)$/)) {
                 $timeout(function () {
                    let fileReader = new FileReader();
                    fileReader.readAsDataURL(file);
                    fileReader.onload = function (e) {
                        $timeout(function () {
                            app.imagePath = file.name
                            app.imagePreview = true;
                        });
                    }
                });
            }
        }
    };
    //Remove current photo of the course header
    app.clearImg = function(){ 
        app.uploading = false;
        app.imagePath = '';
        app.imagePreview = false;
        angular.forEach(
            angular.element(document.querySelector("#editImageArticle")),
            function(inputElem) {
              angular.element(inputElem).val(null);
            }
        );
    }; 
    //Save changes in article
    app.saveEditedArticle = function(data, valid){
        app.disabled = true;
        if(valid){
            let editArticle         = {};
            editArticle.title       = data.title;
            editArticle.id          = data.id;
            editArticle.author      = data.author;
            editArticle.body        = data.body;
            editArticle.imagePath   = data.imagePath;
            editArticle.tags        = app.articleTags;
            User.saveChangesArticle(editArticle).then(function(data){
                if(data.data.success){
                    app.message = data.data.message;
                    $timeout(function(){
                        $scope.editArticleBlog.$setPristine();
                        $scope.editArticleBlog.contentEditDiv.$setPristine();
                        app.imagePreview = false;
                        app.disabled = false;
                        app.message = false;
                    },2000);
                    socket.emit('update article', data.data.article, app.id);
                    User.upload($scope.file).then(function(data) {
                        if (data.data.success) { 
                            app.uploading = false;            
                            $scope.file = {};
                        } else {
                            app.uploading = false;
                            app.errorMsg = data.data.message;
                            $scope.file = {};
                        }
                    });
                } else {
                    app.errMessage = data.data.message;
                    $timeout(function(){
                        app.errMessage = false;
                        app.disabled = false;
                    },2000)
                }
                
            });
        } else {
            app.errMessage = 'Fill the form correctly';
            $timeout(function(){
                app.errMessage = false
            },2000)
        }

    };
    //Add comment as admin
    app.adminComment = function(comment, valid, id){
        app.errCommentMsg = false;
        app.disableComment = true;
        app.loadingComment = true;
        if(valid){
            let adminComment = {};
            adminComment.comment = comment
            adminComment._id = app.id;
            app.disableComment = false;
            app.loadingComment = false;
            User.articleAdminComment(adminComment).then(function(data){
                if(data.data.success) {
                    app.commentMsg = data.data.message;
                    $timeout(function(){
                        app.comment = '';
                        app.adminArticleComment.$setPristine();
                        app.commentMsg = false;
                    },2000);
                    socket.emit('article adminComment', data.data.id, data.data.comment);
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
                app.adminArticleComment.$setPristine();
            }, 2000)
        }
    }
    //Add reply to the comment as admin
    app.adminReply = function(comment, reply, form){
        app.addedReply = comment._id;
        app.errReply = false;
        app.disableReply = true;
        app.loadingReply = true;
        if(form.$valid){
            let adminReply = {};
            adminReply._id          = app.id;
            adminReply.commentId    = comment._id;
            adminReply.reply        = reply;
            app.disableReply        = false;
            app.loadingReply        = false;
            User.articleAdminReply(adminReply).then(function(data){
                if(data.data.success){
                    app.replyMsg = data.data.message;
                    $timeout(function(){
                        form.$setPristine()
                        app.commentReply[comment.number] = '';
                        app.replyMsg = false;
                    },2000);
                    socket.emit('article adminReply', app.id, data.data.reply, comment.number);
                } else {
                    app.errReply = data.data.message;
                    $timeout(function(){
                        app.errReply = false;
                    },2000)
                }
            })
        } else {
            app.errReply = 'Add reply content';
            app.disableReply = false;
            app.loadingReply = false;
            $timeout(function(){
                app.errReply = false;
            },2000)
        }
    };
    //Remove user comment to article
    app.delArticleComment = function(comment){
        let delComment = {};
        delComment.id = app.id;
        delComment.commentId = comment._id;
        User.articleRemoveComment(delComment).then(function(data){
            if(data.data.success){
                app.removedCommentMsg = data.data.message;
                $timeout(function(){
                    app.removedCommentMsg = false
                },2000)
                socket.emit('article removeComment', app.id, data.data.article);
            } else {
                app.removedCommentErrMsg = data.data.message;
                $timeout(function(){
                    app.removedCommentErrMsg = false
                },2000)
            }
            
        })
    }
    //Remove reply to the comment
    app.delCommentReply = function(reply, id, number){
        let delReply = {};
        delReply.id = app.id;
        delReply.commentId = id;
        delReply.replyId = reply._id
        app.deletedReplyId = id;
        User.articleRemoveReply(delReply).then(function(data){
            if(data.data.success){
                app.removedReplyMsg = data.data.message;
                $timeout(function(){
                    app.removedReplyMsg = false
                },2000)
                socket.emit('article removeReply', app.id, data.data.article, number);
            } else {
                app.removedReplyErrMsg = data.data.message;
                $timeout(function(){
                    app.removedReplyErrMsg = false
                },2000)
            }
        })
    }
    //Add vote to comment
    app.voteComment = function(comment, vote, event){
        let ratings = {};
        ratings.id = app.id;
        ratings.vote = vote;
        ratings.commentId = comment._id;
        User.articleVoteComment(ratings).then(function(data){
            if(data.data.success){
                socket.emit('vote adminComment', app.id, data.data.vote, comment.number);
            } else {
                app.clickedComment = comment._id;
                if(event.currentTarget.className === 'dislike activeLike') {
                    app.errVoteDislike = data.data.message;
                } else if(event.currentTarget.className === 'like activeLike') {
                    app.errVote = data.data.message;
                }
                $timeout(function(){
                    app.errVote = false;
                    app.errVoteDislike = false;
                },2000)
            }
        })
    }
    //Add vote to reply
    app.voteReply = function(comment, reply, vote, event, index){
        let ratings = {};
        ratings.id = app.id;
        ratings.vote = vote;
        ratings.commentId = comment._id;
        ratings.replyId = reply._id
        User.articleVoteReply(ratings).then(function(data){
            if(data.data.success){
                socket.emit('vote adminReply', app.id, data.data.vote, comment.number, index+1);
            } else {
                app.clickedReply = reply._id;
                if(event.currentTarget.className === 'dislike activeLike') {
                    app.errReplyVoteDislike = data.data.message;
                } else if(event.currentTarget.className === 'like activeLike') {
                    app.errReplyVote = data.data.message;
                }
                $timeout(function(){
                    app.errReplyVote = false;
                    app.errReplyVoteDislike = false;
                },2000)
            }
        })
    }
    //Comment pagination
    app.setItemsPerPage = function(number){
        app.itemsPerPage = number;
        app.currentPage = 1
    }
    //Sort comments by date
    app.sortComment = function(propertyName){
        app.reverse = (app.propertyName === propertyName) ? !app.reverse : false; 
        app.propertyName = propertyName
    }
    //Add tags
    $("#tagsEdit-typer").keypress( function(event) {
        var key = event.which;
        if (key == 13 || key == 44){
         event.preventDefault();
         var tag = $(this).val();
          if(tag.length > 0){
            $("<span class='tag' style='display:none'><span class='close'>&times;</span>"+tag+" </span>").insertBefore(this).fadeIn(100);
            app.articleTags.push(tag.trim());
            $(this).val("");
          }
        }
    });
    //Remove tags
    $("#tagsEdit").on("click", ".close", function() {
        $(this).parent("span").fadeOut(100);
        for (let i = 0; i < app.articleTags.length; i++) {
            if (app.articleTags[i].trim() === $(this)[0].nextSibling.data.trim()) {
                app.articleTags.splice(i, 1);
            }
        }
    });
    //Add animation to click "Like" or "Dislike"
    $(document).ready(function(){
        $(document).on('click','.like, .dislike',function(event) {
            event.preventDefault();
            $(this).parent().children().removeClass('activeLike');
            $(this).effect("bounce", {
              times: 4
            }, 1000);
            $(this).addClass('activeLike');
          });
    })
    //Show modal with comment details
    app.showRemoveCommentModal = function(comment){
        app.deletedComment = comment; 
        $('#delArticleComment').modal('show');
    };
    //Show modal with reply details
    app.showRemoveReplyModal = function(reply, comment){
        app.deletedReply = reply; 
        app.parentComment = comment._id;
        app.commentNumber = comment.number
        $('#delArticleReply').modal('show');
    };
    //Client sockets
    socket.on('newBlogComment', function(data){
        app.articleComments.push(data.comment);
        app.totalItems = app.articleComments.length 
    })
    socket.on('blogReply', function(data){
        app.articleComments[data.commentNumber - 1].reply.push(data.reply)
    })
    socket.on('articleAdminComment', function(data){
        app.articleComments.push(data.articleComment);
        app.totalItems = app.articleComments.length 
    });
    socket.on('articleAdminReply', function(data){
        app.articleComments[data.commentNumber - 1].reply.push(data.articleReply)
    });
    socket.on('articleRemoveComment', function(data){
        app.articleComments = data.comments;
        app.totalItems = app.articleComments.length;
        if(Number.parseInt(app.totalItems) === Number.parseInt(app.selectNumber)){
            app.currentPage -= 1;
        }
    });
    socket.on('articleRemoveReply', function(data){
        app.articleComments[data.number - 1].reply = data.data;
    });
    socket.on('voteAdminComment', function(data){
        app.articleComments[data.number - 1].ratings = data.vote;
    });
    socket.on('voteAdminReply', function(data){
        app.articleComments[data.number - 1].reply[app.articleComments[data.number - 1].reply.length - data.index].ratings = data.vote
    });
    //Dynamically resize textarea
    let textarea = document.querySelector('textarea#admin-dash-textarea');
    textarea.addEventListener('keydown', function(){
        var el = this;
        setTimeout(function(){
            el.style = 'height:' + el.scrollHeight + 'px'
        },0)
    });
}])
.controller('editAdminCtrl', ['$scope', '$timeout', 'User', 'AuthAdminToken', function($scope, $timeout, User, AuthAdminToken){
    let app = this;
    app.loadingPage = true;
    app.saveChangesLoading = false;
    app.successChanged = false;
    app.correctInput = true;
    app.confirmDisabled = true;
    //Get admin details
    User.editAdminProfile().then(function(data){
        app.loadingPage = false;
        app.disabledProfile = true;
        app.change = {};
        if(data.data.success){
            app.change.changeName = data.data.admin.name;
            app.change.changeUsername = data.data.admin.username;
            app.change.changeEmail = data.data.admin.email;
        } else {
            app.loadingPage = true;
        }
    })
    app.editProfile = function(){
        app.disabledProfile = false;
    }
    //Save changes in admin profile
    app.saveChanges = function(change, valid) {
        if(valid) {
            app.saveChangesLoading = true;
            User.saveChangesAdminAccount(app.change).then(function(data){
                if(data.data.success){
                    app.saveChangesLoading = false;
                    app.successChanged = data.data.message;
                    AuthAdminToken.setToken(data.data.token);
                    $timeout(function(){
                        app.disabledProfile = true;
                        $scope.editAccountAdmin.$setPristine();
                        app.successChanged = false;
                        app.emailMsg = false;
                        app.usernameMsg = false;
                    },1000)
                } else {
                    if(data.data.message.username){
                        $scope.editAccountAdmin.changeAdminUsername.$setValidity('changeAdminUsername', false);
                        app.adminAccountErrMsg = data.data.message.username.message;
                        app.saveChangesLoading = false;
                    } else if (data.data.message.email){
                        $scope.editAccountAdmin.changeAdminEmail.$setValidity('changeEmail', false);
                        app.adminAccountErrMsg = data.data.message.email.message;
                        app.saveChangesLoading = false;
                    } else if (data.data.message.name) {
                        $scope.editAccountAdmin.changeAdminName.$setValidity('changeAdminName', false);
                        app.adminAccountErrMsg = data.data.message.name.message;
                        app.saveChangesLoading = false;
                    } else {
                        app.adminAccountErrMsg = data.data.message;
                        $scope.editAccountAdmin.$setValidity('editAccountAdmin', false);
                        app.saveChangesLoading = false;
                        
                    }
                }
            })
        }
    }
    //Check admin username in database
    app.checkChangedUsername = function(change){
        app.usernameMsg = false;
        app.usernameErrMsg = false;
        app.loadingUsername = true;
        User.checkAdminUsername(app.change).then(function(data){
            if(data.data.success){
                app.loadingUsername = false;
                app.usernameMsg = true;
                $timeout(function(){
                    app.usernameMsg = false;
                },2000)
                $scope.editAccountAdmin.changeAdminUsername.$setValidity('changeAdminUsername', true);
            } else {
                app.loadingUsername = false
                $timeout(function(){
                    app.usernameErrMsg = data.data.message;
                },500)
                $scope.editAccountAdmin.changeAdminUsername.$setValidity('changeAdminUsername', false);
            }
        })
    }
    //Check admin email in database
    app.checkChangedEmail = function(change){
        app.emailMsg = false;
        app.emailErrMsg = false;
        app.loadingEmail = true;
        User.checkAdminEmail(app.change).then(function(data){
            if(data.data.success){
                app.loadingEmail = false;
                app.emailMsg = true;
                $timeout(function(){
                    app.emailMsg = false;
                },2000)
                $scope.editAccountAdmin.changeAdminEmail.$setValidity('changeAdminEmail', true);
            } else {
                app.loadingEmail = false;
                $timeout(function(){
                    app.emailErrMsg = data.data.message;
                },500)
                $scope.editAccountAdmin.changeAdminEmail.$setValidity('changeAdminEmail', false);
            }
        })
    }
    //Check admin pasword
    app.checkCurrPass = function(pass){
        app.loadingPassword = true;
        app.passwordInvalid = false;
        app.passMsg = false;
        app.passErrMsg = false;
        User.checkAdminPassword(app.pass).then(function(data){
            if(data.data.success){
                app.passMsg = true;
                app.loadingPassword = false;
                app.passwordInvalid = false;
            } else {
                app.passwordInvalid = true;
                app.loadingPassword = false;
                app.passErrMsg = data.data.message;
                $timeout(function(){
                    app.passErrMsg = false;
                },1500)
            }
        })
    }
    //Compare passwords
    app.comparePasswords = function(pass){
        app.compareInvalid = true;
        app.comMsg = false;
        app.comErrPass = false;
        app.loadingNewPassword = true;
        User.compareAdminPasswords(app.pass).then(function(data){
           if(data.data.success){
                app.confirmDisabled = false;
                app.loadingNewPassword = false;
                app.compareInvalid = false;
                app.comMsg = true;
           } else {
                app.confirmDisabled = true;
                app.loadingNewPassword = false;
                app.comErrPass = data.data.message;
                app.compareInvalid = true;
           }
        })
    }
    //Save new password
    app.saveChangePassword = function(pass, valid) { 
        if(valid){
            app.passMsg = false;
            app.saveNewPassword = true;
            User.saveChangeAdminPassword(app.pass).then(function(data){
                if(data.data.success){
                    app.showPassMsg = data.data.message;
                    $timeout(function(){
                        app.showPassMsg = false;
                        $scope.changeAdminPassword.$setPristine()
                        app.pass = {
                            currentPass : '',
                            newPass: '',
                            confirmPass: ''
                        };
                    },1500)
                    $timeout(function(){
                        app.saveNewPassword = false;
                    },1000)
                } else {
                    app.saveNewPassword = false;
                    app.showPassErr = data.data.message;
                    $timeout(function(){
                        app.showPassErr = false;
                    },2000) 
                }
            })
        }
    }
}])
.controller('aboutAdminCtrl', ['$scope','User','$timeout', function($scope,User,$timeout){
    let app = this;
    let socket = io.connect();
    app.loadingPage = true;
    //Get constent of the "About Us" page in admin dashboard
    User.getAboutUsPage().then(function(data){
        app.body = data.data.about.author;
        app.blog = data.data.about.blog;
        app.loadingPage = false;
    })
    //Edit content of the "About Us" page
    app.editAboutUs = function(data,valid){
        valid && User.editAboutUsPage(data).then(function(data){
            if(data.data.success){
                if(data.data.type ==='description'){
                    app.aboutMsg = data.data.message;
                    $timeout(function(){
                        app.aboutMsg = false;
                    },2000)            
                } else {
                    app.blogMsg = data.data.message;
                    $timeout(function(){
                        app.blogMsg = false;
                    },2000)                
                }
                socket.emit('aboutUs', data.data.about) 
            } else {
                if(data.data.type ==='description'){
                    app.aboutErrMsg = data.data.message;
                    $timeout(function(){
                        app.aboutErrMsg = false;
                    },2000)                    
                } else {
                    app.blogErrMsg = data.data.message;
                    $timeout(function(){
                        app.blogErrMsg = false;
                    },2000)                
                }
            }
        })        
    }
}])