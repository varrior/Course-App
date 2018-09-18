export default angular.module('UserControllers', ['userServices'])
    
.controller('regCtrl', ['$state', '$timeout', 'User','$scope', function($state, $timeout, User, $scope){

    let app = this;
    //Create new user
    app.regUser = function(regData, valid, confirmed) { 
        app.disabled = true;
        app.loading = true;
        app.errorMsg = false;
        if(valid && confirmed){ 
            User.create(app.regData).then(function(data){
                if(data.data.success){    
                    app.loading = false;
                    app.successMsg = data.data.message;
                    $timeout(function(){
                        $state.go('parent.home')
                    },8000)            
                } else {
                    app.disabled = false; 
                    app.loading = false;
                    app.errorMsg = data.data.message;
                    $timeout(function(){
                        app.errorMsg = false;
                    },2500) 
                }    
            });             
        } else {
            app.disabled = false;
            app.loading = false;
            app.errorMsg = 'Make sure that the form has been completed correctly';  
            $timeout(function(){
              app.errorMsg = false;  
            },2500)
        }
    }
    app.checkUsername = function(regData, input) {
        if(input){
            app.checkingUsername = true;
            app.usernameMsg = false;
            app.usernameInvalid = false;
            User.checkUsername(app.regData).then(function(data){
                if(data.data.success) {
                    app.checkingUsername = false;
                    app.usernameInvalid = false;
                    app.usernameMsg = data.data.message;
                } else {
                    app.checkingUsername = false;
                    app.usernameInvalid = true;
                    app.usernameMsg = data.data.message;
                }
            })            
        }
    }
    app.checkEmail = function(regData, email) {
        if(email){
            app.checkingEmail = true;
            app.emailMsg = false;
            app.emailInvalid = false;
            User.checkEmail(app.regData).then(function(data){
                if(data.data.success) {
                    app.checkingEmail = false;
                    app.emailInvalid = false;
                    app.emailMsg = data.data.message;
                } else {
                    app.checkingEmail = false;
                    app.emailInvalid = true;
                    app.emailMsg = data.data.message;
                }
            })
        }
    }
}])
//Compare two passwords
.directive('match', function(){
    return {
        restrict: 'A',
        controller: ['$scope',function($scope){      
            $scope.doConfirm = function(values){
                $scope.confirmed = false;
                values.forEach(function(ele){
                    if($scope.confirm === ele){
                        $scope.confirmed = true;
                    } else {
                        $scope.confirmed = false;
                    }
                })
            }
        }],
        link: function(scope, element, attrs){
            attrs.$observe('match', function() {
                scope.matches = JSON.parse(attrs.match);
                scope.doConfirm(scope.matches);
            });
            scope.$watch('confirm', function(){
                scope.matches = JSON.parse(attrs.match);
                scope.doConfirm(scope.matches)
            })
        }
    }
})