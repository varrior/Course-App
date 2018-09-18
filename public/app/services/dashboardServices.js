export default angular.module('dashboardAuthServices', [])

.factory('AuthDashboard', ['$http', 'AuthAdminToken', function($http, AuthAdminToken){
    
    let AdminAuthFactory = {};
    //Admin login
    AdminAuthFactory.loginAdmin = function(loginAdminData){
        return $http.post('/api/dashboard/admin/authenticate', loginAdminData).then(function(data){
            AuthAdminToken.setToken(data.data.token)
            return data
        })
    }
    //Check whether user is logged in
    AdminAuthFactory.dashboardLoggedIn = function(){
        if(AuthAdminToken.getToken()){
            return true 
        } else {
            return false
        }
    }
    //Get admin details
    AdminAuthFactory.getAdmin = function(){
        if(AuthAdminToken.getToken()){
            return $http.post('/api/admin/me')
        } else {
            $q.reject({message:'Admin has no token'})
        }
    }     
    //Admin log out
    AdminAuthFactory.adminLogout = function() {
        AuthAdminToken.setToken()
    }
    
    return AdminAuthFactory
}])

.factory('AuthAdminToken', ['$window', function($window){
    
    let authAdminTokenFactory = {};
    //Set token to the local storage
    authAdminTokenFactory.setToken = function(token){
        if(token){
            $window.localStorage.setItem('AdminToken',token)
        } else {
            $window.localStorage.removeItem('AdminToken')
        }
        
   };
   //Get token from local storage
   authAdminTokenFactory.getToken = function(){
        return $window.localStorage.getItem('AdminToken')
    }

    return authAdminTokenFactory
}])
.factory('AdminInterceptors', ['AuthAdminToken', function(AuthAdminToken){
    let AdminInterceptorsFactory = {};
    //Add token to the headers
    AdminInterceptorsFactory.request = function(config){
        
        let token = AuthAdminToken.getToken();
        
        if(token) config.headers.Authorization = 'Bearer ' + token
        
        return config
    }
    return AdminInterceptorsFactory
}])