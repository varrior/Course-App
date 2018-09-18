export default angular.module('profileController', ['userServices', 'authServices'])

.controller('profileCtrl', ['$scope', 'User', 'AuthToken', '$timeout', function($scope, User, AuthToken, $timeout){
    let app = this;
    app.saveChangesLoading = false;
    app.successChanged = false;
    app.correctInput = true;
    //Get user details
    User.editMyProfile().then(function(data){
        app.disabledProfile = true;
        app.change = {};
        if(data.data.success){
            app.change.changeUsername = data.data.user.username;
            app.change.changeEmail = data.data.user.email;
            app.change.changeName = data.data.user.name;
            app.change.changeBirthday = data.data.user.birthday;
        } else {
            app.usernameMsg = data.data.message;
        }
    })
    //Unblock edit form
    app.editProfile = function(){
        app.disabledProfile = false;
    }
    //Save changes in user account
    app.saveChanges = function(change, valid) {
        app.correctInput = false;
        if(valid) {
            app.saveChangesLoading = true;
            User.saveChangesAccount(app.change).then(function(data){
                if(data.data.success){
                    AuthToken.setToken(data.data.token);
                    $timeout(function(){
                        app.disabledProfile = true;
                        $scope.editAccountUser.$setPristine();
                        $scope.main.username = data.data.user.username;
                        app.successChanged = data.data.message;
                    },1000)
                    $timeout(function(){
                        app.successChanged = false;
                        app.correctInput = true;
                    },3000)
                    app.saveChangesLoading = false;
                    app.emailMsg = false;
                    app.usernameMsg = false;
                } else {
                    if(data.data.message.username){
                        $scope.editAccountUser.changeUsername.$setValidity('changeUsername', false);
                        app.usernameErrMsg = data.data.message.username.message;
                        app.saveChangesLoading = false;
                    } else if (data.data.message.email){
                        $scope.editAccountUser.changeEmail.$setValidity('changeEmail', false);
                        app.emailErrMsg = data.data.message.email.message;
                        app.saveChangesLoading = false;
                    } else if (data.data.message.name) {
                        $scope.editAccountUser.changeName.$setValidity('changeName', false);
                        app.nameErrMsg = data.data.message.name.message;
                        app.saveChangesLoading = false;
                    } else {
                        $scope.editAccountUser.$setValidity('editAccountUser', false);
                        app.saveChangesLoading = false;
                    }
                }
            })
        }
    }
    //Check the username if it exists
    app.checkChangedUsername = function(change){
        app.checkingUsername = true;
        app.usernameInvalid = false;
        app.usernameMsg = false;
        app.usernameErrMsg = false;
        User.checkChangedUsername(app.change).then(function(data){
            if(data.data.success){
                app.checkingUsername = false;
                $timeout(function(){
                    app.usernameMsg = true;
                    app.usernameInvalid = false;
                },900)
                $scope.editAccountUser.changeUsername.$setValidity('changeUsername', true);
            } else {
                app.checkingUsername = false;
                $timeout(function(){
                    app.usernameInvalid = true;
                    app.usernameErrMsg = data.data.message;
                },500)
                $scope.editAccountUser.changeUsername.$setValidity('changeUsername', false);
            }
        })
    }
    //Check the email if it exists
    app.checkChangedEmail = function(change){
        app.checkingEmail = true;
        app.emailInvalid = false;
        app.emailMsg = false;
        app.emailErrMsg = false;
        User.checkChangedEmail(app.change).then(function(data){
            if(data.data.success){
                app.checkingEmail = false;
                $timeout(function(){
                    app.emailInvalid = false;
                    app.emailMsg = true;
                },900)
                $scope.editAccountUser.changeEmail.$setValidity('changeEmail', true);
            } else {
                app.checkingEmail = false;
                $timeout(function(){
                    app.emailInvalid = true;
                    app.emailErrMsg = data.data.message;
                })
                $scope.editAccountUser.changeEmail.$setValidity('changeEmail', false);
            }
        })
    }
    //Check current password
    app.checkCurrPass = function(pass){
        app.passwordInvalid = false;
        app.passMsg = false;
        app.passErrMsg = false;
        app.checkingPass = true;
        User.checkCurrPass(app.pass).then(function(data){
            if(data.data.success){
                app.checkingPass= false;
                app.passwordInvalid = false;
                $timeout(function(){
                    app.passMsg = true;
                },900)
            } else {
                app.checkingPass = false;
                $timeout(function(){
                    app.passErrMsg = data.data.message;
                    app.passwordInvalid = true;
                },900)
            }
        })
    }
    //Compare two passwords
    app.comparePasswords = function(pass){
        app.compareInvalid = false;
        app.comMsg = false;
        app.comErrPass = false;
        app.checkingCom = true;
        User.comparePasswords(app.pass).then(function(data){
           if(data.data.success){
                app.checkingCom  = false;
                app.compareInvalid = false;
                $timeout(function(){
                    app.comMsg = true;
                },900)
           } else {
                app.checkingCom  = false;
                $timeout(function(){
                    app.comErrPass = data.data.message;
                    app.compareInvalid = true;
                },900)
           }
        })
    }
    //Save new password
    app.saveChangePassword = function(pass, valid) {
        if(valid){
            app.passMsg = false;
            app.saveNewPassword = true;
            User.saveChangePassword(app.pass).then(function(data){
                if(data.data.success){
                    app.saveNewPassword = false;
                    $timeout(function(){
                        app.showPassMsg = data.data.message;
                    },1000)
                    $timeout(function(){
                        app.showPassMsg = false;
                        $scope.changePasswordForm.$setPristine()
                        app.pass = {
                            currentPass : '',
                            newPass: '',
                            confirmPass: ''
                        };
                    },3000)
                } else {
                    app.saveNewPassword = false;
                    $timeout(function(){
                        app.showPassErr = data.data.message;
                    },1000)
                    $timeout(function(){
                        app.showPassErr = false;
                    },3000) 
                }
            })
        }
    }
}])
//My purchased courses
.controller('ordersCtrl', ['$scope', 'User', function($scope, User){
    let app = this;
    User.getMyOrdersCourse().then(function(data){
        app.orders = data.data.orders
        data.data.orders.forEach(function(item){
            if(item.status === 'COMPLETED'){
                item.realized = 'Yes'
            } else {
                item.realized = 'No'
            }
        })
    })
}])