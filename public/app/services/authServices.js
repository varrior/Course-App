export default angular.module('authServices', [])
//User authentication
.factory('Auth', ['$http', 'AuthToken', function($http, AuthToken){
    let authFactory = {};
    //User login
    authFactory.login = function(loginData){
        return $http.post('/api/authenticate', loginData).then(function(data){
            AuthToken.setToken(data.data.token)
            return data
        })
    }
    //Check whether user is logged in
    authFactory.isLoggedIn = function(){
        if(AuthToken.getToken()){
            return true 
        } else {
            return false
        }
    }
    //Get user details
    authFactory.getUser = function(){
        if(AuthToken.getToken()){
            return $http.post('/api/me')
        } else {
            $q.reject({message:'User has no token'})
        }
    }     
    //Log out
    authFactory.logout = function() {
        AuthToken.setToken()
    }
    return authFactory
}])

.factory('AuthToken', ['$window', function($window){
    
    let authTokenFactory = {};
    //Set token to the local storage
    authTokenFactory.setToken = function(token){
        if(token){
            $window.localStorage.setItem('token',token)
        } else {
            $window.localStorage.removeItem('token')
        }
    };
    //Get token
    authTokenFactory.getToken = function(){
        return $window.localStorage.getItem('token')
    }

    return authTokenFactory
}])
.factory('AuthInterceptors', ['AuthToken', function(AuthToken){ 
    let authInterceptorsFactory = {};
    //Add token to headers
    authInterceptorsFactory.request = function(config){
        
        let token = AuthToken.getToken();

        if(token) config.headers['x-access-token'] = token
        
        return config
    }
    return authInterceptorsFactory
}])