export default angular.module('userApp', ['appRoutes', 'UserControllers', 'userServices', 'ngAnimate', 'mainController', 'authServices', 'emailController', 'navController', 'profileController', 'videoPlayer', 'userTests', 'blogController','dashboardController', 'dashboardAuthServices', 'newCourseController','hljs']) 
//Add interceptors
.config(['$httpProvider', function($httpProvider){
    $httpProvider.interceptors.push('AuthInterceptors');
    $httpProvider.interceptors.push('AdminInterceptors');
}])
//Options to highlight.js editor
.config(['hljsServiceProvider',function (hljsServiceProvider) {
	hljsServiceProvider.setOptions({
		tabReplace: '  '
	});
}])
.run(['$rootScope',function($rootScope){
    $rootScope.$on('$viewContentLoaded', function(){
        $('footer, nav, section#detail_item, li.active').fadeIn(500);
         
    })
}]);