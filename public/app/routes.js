export default angular.module('appRoutes',['ngRoute','ui.router', 'ui.router.state.events'])

.config(['$stateProvider', '$locationProvider', '$urlRouterProvider', function($stateProvider, $locationProvider, $urlRouterProvider){ 
    //Define all routes using angular-ui-router
    $stateProvider
    .state('parent', {
        abstract: true,
        views:{
            'navigation':{ templateUrl: 'app/views/pages/users/navigation.html' },
            'footer': { templateUrl: 'app/views/pages/users/footer.html' }
        }
    })
    .state('parent.home', { 
        url: '/',
        views:{
            'content@': { templateUrl: 'app/views/pages/users/home.html' },
        }
    })
    .state('parent.blog', {
        url: '/blog',
        views:{ 
            'content@': { 
                templateUrl: 'app/views/pages/users/blog.html',
                controller: 'blogCtrl',
                controllerAs: 'blog'
            }
        },
        authenticated: [true, false],
    })
    .state('parent.article', {
        url: '/blog/:id',
        views:{
            'content@': { 
                templateUrl: 'app/views/pages/users/singleArticle.html',
                controller: 'singleArtCtrl',
                controllerAs: 'singleArt'
            }
        },
        authenticated: [true, false],
    })
    .state('parent.register', {
        url: '/register',
        views: {
            'content@': {
                templateUrl: 'app/views/pages/users/register.html',
                controller: 'regCtrl',
                controllerAs: 'register',
            }
        },
        authenticated: false
    })
    .state('parent.Home', {
        url: '/home',
        views: {
            'content@': {
                templateUrl: 'app/views/pages/users/home.html',
            }
        },
        authenticated: true,
    })
    .state('404', {
        url: '/404',
        views: {
            'content': {        
                templateUrl: 'app/views/pages/users/404.html',
                controller: 'NoFoundCtrl',
                controllerAs: 'NoFound',}
        }, 
        authenticated: [true, false], 
    })
    .state('parent.seeMore', {
        url: '/course/details/:id',
        views: {
            'content@': {        
                templateUrl: 'app/views/pages/users/navigation/see-more.html',
                controller: 'seeMoreCtrl',
                controllerAs: 'seeMore',
            }
        },
        authenticated: [true, false],
    })
    .state('parent.courses', {
        url: '/courses',
        views: {
            'content@': {         
                templateUrl: 'app/views/pages/users/navigation/courses.html',
                controller: 'navCtrl',
                controllerAs: 'navi', 
            }
        },
        authenticated: [true, false],
    })
    .state('parent.cart', {
        url:'/cart',
        views: {
            'content@': {        
                templateUrl: 'app/views/pages/shopping/cart.html',
                controller: 'shoppingCtrl',
                controllerAs: 'shopping',
            }
        },
        authenticated: true,
    })
    .state('parent.checkout', {
        url: '/checkout',
        views: {
            'content@': {        
                templateUrl: 'app/views/pages/checkout/checkout.html',
                controller: 'checkoutCtrl',
                controllerAs: 'checkout',
            }
        },
        authenticated: true,
    })
    .state('parent.contact', {
        url:'/contact',
        views: {
            'content@': {        
                templateUrl: 'app/views/pages/users/navigation/contact.html',
                controller: 'contactCtrl',
                controllerAs: 'contact',
            }
        },
        authenticated: [true, false],
    })
    .state('parent.aboutMe', {
        url: '/about-us',
        views: {
            'content@': {        
                templateUrl: 'app/views/pages/users/navigation/about.html',
                controller: 'aboutCtrl',
                controllerAs: 'about',}
        },
        authenticated: [true, false],
    })
    .state('logout', {
        url:'/logout',
        templateUrl: 'app/views/pages/users/logout.html',
        authenticated: true,
    })

    .state('parent.profile', {
        url: '/profile',
        views: {
            'content@': {        
                templateUrl: 'app/views/pages/users/profile.html',
                controller: 'profileCtrl',
                controllerAs: 'profile'
            }
        },
        authenticated: true,
    })
    .state('parent.video', {
        url: '/account/courses',
        views: {
            'content@': {        
                templateUrl: 'app/views/pages/users/myVideo.html',
                controllerAs: 'video',
                controller: 'videoCtrl',
            }
        },
        authenticated: true,
    })
    .state('parent.history', {
        url: '/bills',
        views: {
            'content@': {        
                templateUrl: 'app/views/pages/users/myOrders.html',
                controllerAs: 'orders',
                controller: 'ordersCtrl',
            }
        },
        authenticated: true,
    })
    .state('parent.myCourse', {
        url: '/account/courses/:username/:id',
        views: {
            'content@': {        
                templateUrl: 'app/views/pages/users/userCourse.html',
                controllerAs: 'videoDetail',
                controller: 'videoCtrlDetail',
            }
        },
        authenticated: true,
    })
    .state('parent.tests', {
        url: '/myTests',
        views: {
            'content@': {        
                templateUrl: 'app/views/pages/users/myTests.html',
                controller: 'testsCtrl',
                controllerAs: 'test',
            }
        },
        authenticated: true,
    })
    .state('parent.test', {
        url: '/test',
        views: {
            'content@': {
                templateUrl: 'app/views/pages/users/test.html',
                controller: 'testsCtrl',
                controllerAs: 'test',
            }
        },
        authenticated: true,
    })  
    .state('parent.activate', {
        url: '/activate/:token',
        views: {
            'content@': {        
                templateUrl: 'app/views/pages/users/activation/activate.html',
                controller: 'emailCtrl',
                controllerAs: 'email',
            }
        },
        authenticated: false,
    })
    .state('parent.resend', {
        url: '/resend',
        views: {
            'content@': {        
                templateUrl: 'app/views/pages/users/activation/resend.html',
                controller: 'resendCtrl',
                controllerAs: 'resend',
            }
        },
        authenticated: false,
    })
    .state('parent.resetUsername', {
        url: '/resetusername',
        views: {
            'content@': {        
                templateUrl: 'app/views/pages/users/reset/username.html',
                controller: 'usernameCtrl',
                controllerAs: 'username',
            }
        },
        authenticated: false,
    })
    .state('parent.resetPassword', {
        url: '/resetpassword',
        views: {
            'content@': {        
                templateUrl: 'app/views/pages/users/reset/password.html',
                controller: 'passwordCtrl',
                controllerAs: 'password',
            }
        },
        authenticated: false
    })
    .state('parent.resetToken', {
        url: '/reset/:token',
        views: {
            'content@': {        
                templateUrl: 'app/views/pages/users/reset/newpassword.html',
                controller: 'resetCtrl',
                controllerAs: 'reset',
            }
        },
        authenticated: false,
    })

    /**************************Admin Route *******************************/
    .state('adminLogin', {
        url: '/dashboard/admin/login',
        views: {
            'content@': {        
                templateUrl:'app/views/pages/management/dashboardLogin.html',
                controller: 'dashboardCtrl',
                controllerAs: 'dashboard',
            }
        },
        authenticated: true,
        permission: 'admin'
    })
    .state('adminRegister', {
        url: '/dashboard/admin/register',
        views: {
            'content': {        
                templateUrl:'app/views/pages/management/dashboardRegister.html',
                controller: 'dashboardCtrl',
                controllerAs: 'dashboard',
            }
        },
        authenticated: true,
        permission: 'admin'
    })
    .state('adminResend', {
        url: '/dashboard/admin/resend',
        templateUrl: 'app/views/pages/users/activation/resendAdmin.html',
        controller: 'resendAdminCtrl',
        controllerAs: 'resendAdmin',
        authenticated: true,
        permission: 'admin'
    })
    .state('parent.adminActivate', {
        url: '/dashboard/admin/activate/:token',
        views: {
            'content@': {        
                templateUrl: 'app/views/pages/users/activation/activate.html',
                controller: 'activateAdminCtrl',
                controllerAs: 'activateAdmin',
            }
        },
        authenticated: true,
        permission: 'admin'
    })
    .state('dashboard', {
        abstract: true,
        views: {
            'content@': {
                templateUrl:'app/views/pages/management/dashboard.html',
                controller: 'dashboardCtrl',
                controllerAs: 'dashboard',
            }
        },
        authenticated: true,
        adminAuthenticated: true, 
        permission: 'AuthAdmin'
    })
    .state('dashboard.aboutAdmin', {
        url: '/dashboard/admin/description/',
        views: {
            'dashboard@dashboard': {        
                templateUrl: 'app/views/pages/management/aboutAdmin.html',
                controller: 'aboutAdminCtrl',
                controllerAs: 'aboutAdmin',
            }
        },
        authenticated: true,
        adminAuthenticated: true,
        permission: 'AuthAdmin'
    })
    .state('dashboard.editAdmin', {
        url: '/dashboard/admin/settings/',
        views: {
            'dashboard@dashboard': {        
                templateUrl: 'app/views/pages/management/editAdmin.html',
                controller: 'editAdminCtrl',
                controllerAs: 'editAdmin',
            }
        },
        authenticated: true,
        adminAuthenticated: true,
        permission: 'AuthAdmin'
    })
    .state('dashboard.panel', {
        url: '/dashboard/admin/panel',
        views: {
            'dashboard@dashboard': {
                templateUrl:'app/views/pages/management/homePage.html',
                controller: 'homePageCtrl',
                controllerAs: 'homePage',
            }
        },
        authenticated: true,
        adminAuthenticated: true,
        permission: 'AuthAdmin'
    })
    .state('dashboard.adminUsers', {
        url: '/dashboard/admin/users',
        views: {
            'dashboard@dashboard': {
                templateUrl:'app/views/pages/management/users.html',
                controller: 'manageUserCtrl',
                controllerAs: 'manageUser',
            }
        },
        authenticated: true,
        adminAuthenticated: true,
        permission: 'AuthAdmin' 
    })
    .state('dashboard.editUser', {
        url: '/dashboard/admin/users/edit/:id',
        views: {
            'dashboard@dashboard': {        
                templateUrl: 'app/views/pages/management/edit.html',
                controller: 'editCtrl',
                controllerAs: 'edit',
            }
        },
        authenticated: true,
        adminAuthenticated: true,
        permission: 'AuthAdmin'
    })
    .state('dashboard.manageCourses', {
        url: '/dashboard/admin/manage/courses',
        views: {
            'dashboard@dashboard': {        
                templateUrl: 'app/views/pages/management/manageCourses.html',
                controller: 'managementProduct',
                controllerAs: 'manageProduct',
            }
        },
        authenticated: true,
        adminAuthenticated: true,
        permission: 'AuthAdmin'
    }) 
    .state('dashboard.editProduct', {
        url: '/dashboard/admin/edit-course/:id',
        views: {
            'dashboard@dashboard': {        
                templateUrl: 'app/views/pages/management/editCourse.html',
                controller: 'editProductCtrl',
                controllerAs: 'editProduct',
            }
        },
        authenticated: true,
        adminAuthenticated: true,
        permission: 'AuthAdmin'
    })
    .state('dashboard.newCourse', {
        url: '/dashboard/admin/new-course',
        views: {
            'dashboard@dashboard': {        
                templateUrl: 'app/views/pages/management/newCourse.html',
                controller: 'newCourseCtrl',
                controllerAs: 'newCourse',
            }
        },
        authenticated: true,
        adminAuthenticated: true,
        permission: 'AuthAdmin'
    })
    .state('dashboard.newBlog', {
        url: '/dashboard/admin/blog/new-article',
        views: {
            'dashboard@dashboard': {        
                templateUrl: 'app/views/pages/management/newArticleBlog.html',
                controller: 'newBlogCtrl',
                controllerAs: 'newBlog',
            }
        },
        authenticated: true,
        adminAuthenticated: true,
        permission: 'AuthAdmin'
    })
    .state('dashboard.allArticles', {
        url: '/dashboard/admin/blog/articles',
        views: {
            'dashboard@dashboard': {        
                templateUrl: 'app/views/pages/management/allBlogArticles.html',
                controller: 'allArticlesCtrl',
                controllerAs: 'allArticles',
            }
        },
        authenticated: true,
        adminAuthenticated: true,
        permission: 'AuthAdmin'
    })
    .state('dashboard.editArticle', {
        url: '/dashboard/admin/edit-article/:id',
        views: {
            'dashboard@dashboard': {        
                templateUrl: 'app/views/pages/management/articleDetails.html',
                controller: 'editArticleCtrl',
                controllerAs: 'editArticle',
            }
        },
        authenticated: true,
        adminAuthenticated: true,
        permission: 'AuthAdmin'
    })

    $urlRouterProvider.otherwise('/');
    
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false, 
    });
}])
//Routes management with reference to authenticated, permission, logged in and admin authenticated
.run(['$rootScope', 'Auth', '$state', 'User', 'AuthDashboard', '$timeout' , function($rootScope, Auth, $state, User, AuthDashboard, $timeout){
    $rootScope.$on('$stateChangeStart', function(event, next, current){
        if(next.$$state !== undefined) {   
            if(next.authenticated == true && !next.adminAuthenticated){
                if(!Auth.isLoggedIn()){
                    event.preventDefault();
                    $timeout(function(){
                        $state.go('parent.home')
                    })
                } else if(next.permission === 'admin' || next.permission === 'AuthAdmin') {
                    User.getPermission().then(function(data){
                        if(next.permission !== data.data.permission){
                            event.preventDefault();
                        }
                    })
                }  
            } else if(next.adminAuthenticated === true && next.authenticated === true) {
                if((!AuthDashboard.dashboardLoggedIn() && Auth.isLoggedIn()) || (!AuthDashboard.dashboardLoggedIn() && !Auth.isLoggedIn()) || (AuthDashboard.dashboardLoggedIn() && !Auth.isLoggedIn())){
                    event.preventDefault();
                    $timeout(function(){
                        $state.go('404')
                    })
                } else if(next.permission) {
                    User.getAdminPermission().then(function(data){
                        if(next.permission !== data.data.permission){
                            event.preventDefault();
                            $timeout(function(){
                                $state.go('404')
                            })
                        }
                    })
                } else if((next.adminAuthenticated == false && next.authenticated == true) || (next.adminAuthenticated == false && next.authenticated == false) || (next.adminAuthenticated == true && next.authenticated == false)){
                    if(AuthDashboard.dashboardLoggedIn()){
                        event.preventDefault();
                        $timeout(function(){
                            $state.go('404')
                        })
                    }
                }
            } else if(next.authenticated === false) { 
                if(Auth.isLoggedIn()){
                    event.preventDefault();
                    $state.go('parent.profile');
                }
            }
        } 
    })
}])


