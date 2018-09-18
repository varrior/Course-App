export default angular.module('emailController', ['userServices'])

.controller('emailCtrl', ['$stateParams', '$state', 'User', '$timeout', function($stateParams, $state, User, $timeout){
    
    let app = this;
    //Activate user account
    User.activateAccount($stateParams.token).then(function(data){
        app.errorMsg = false;
        if(data.data.success){
            app.successMsg = data.data.message + '...Redirecting';
            $timeout(function(){
                $state.go('parent.home')
            }, 2000)
        } else {
            app.errorMsg = data.data.message + '...Redirecting';
            $timeout(function(){
                $state.go('parent.home')
            }, 2000);
        }
    });
}])

.controller('resendCtrl', ['User', function(User){

    let app = this;
    //Resend activation link
    app.checkCredentials = function(loginData){
        app.disabled = true;
        app.errorMsg = false;
        User.checkCredentials(app.loginData).then(function(data){
            if(data.data.success){
                User.resendLink(app.loginData).then(function(data){
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
.controller('usernameCtrl', ['User', function(User){
    let app = this;
    //REset user username
    app.sendUsername = function(userData, valid) {
        app.errorMsg = false;
        app.loading = true;
        app.disabled = true;
        if(valid) {
            User.sendUsername(app.userData.email).then(function(data) {
                app.loading = false;
                if (data.data.success) {
                    app.successMsg = data.data.message;
                } else {
                    app.disabled = false;
                    app.errorMsg = data.data.message;
                }
            });
        } else {
            app.disabled = false;
            app.loading = false;
            app.errorMsg = 'Provide a valid email address';
        }
    };
}])
.controller('passwordCtrl', ['User',function(User){
    let app = this;
    //Reset password
    app.sendPassword = function(resetData, valid) {
        app.errorMsg = false;
        app.loading = true;
        app.disabled = true;
        if(valid) {
            User.sendPassword(app.resetData).then(function(data){
                app.loading = false;
                if (data.data.success) {
                    app.successMsg = data.data.message;
                } else {
                    app.disabled = false;
                    app.errorMsg = data.data.message;
                }
            });
        } else {
            app.disabled = false;
            app.loading = false;
            app.errorMsg = 'Provide a valid username'
        }
    };
}])
.controller('resetCtrl',['User', '$stateParams', '$state', '$scope', '$timeout', function(User, $stateParams, $state, $scope, $timeout) {
    let app = this;
    app.hide = true;
    //Reset password
    User.resetUser($stateParams.token).then(function(data) {
        if (data.data.success) {
            app.hide = false;
            app.successMsg = 'Enter a new password';
            $scope.username = data.data.user.username;
        } else {
            app.errorMsg = data.data.message;
        }
    });
    //Add new password
    app.savePassword = function(regData, valid, confirmed) {
        app.errorMsg = false;
        app.disabled = true;
        app.loading = true;
        if (valid && confirmed) {
            app.regData.username = $scope.username;
            User.savePassword(app.regData).then(function(data) {
                app.loading = false;
                if (data.data.success) {
                    app.successMsg = data.data.message + '...Redirecting';
                    $timeout(function() {
                        $state.go('parent.home');
                    }, 2000)
                } else {
                    app.disabled = false;
                    app.errorMsg = data.data.message;
                } 
            });
        } else {
            app.loading = false;
            app.disabled = false;
            app.errorMsg = 'Make sure that the form has been completed correctly'
        }
    }
}])