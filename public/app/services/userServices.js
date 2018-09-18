export default angular.module('userServices', [])

.factory('User', ['$http', function($http){
    let userFactory = {}
    //Methos which enable communication between server and client, $http service uses XMLHttpRequest object. These methods returns a promise. I will not explain what the methods means, you can see it in api.js follows by url paths  
    userFactory.create = function(regData){
        return $http.post('/api/users', regData)
    }
    userFactory.checkUsername = function(regData) {
        return $http.post('/api/checkusername', regData)
    }
    userFactory.checkEmail = function(regData) {
        return $http.post('/api/checkemail', regData)
    }
    userFactory.activateAccount = function(token){
        return $http.put('/api/activate/' + token);
    }
    userFactory.checkCredentials = function(loginData) {
        return $http.post('/api/resend', loginData);
    }
    userFactory.resendLink = function(username){
        return $http.put('/api/resend', username);
    }
    userFactory.sendUsername = function(userData) {
        return $http.get('/api/resetusername/' + userData)
    }
    userFactory.sendPassword = function(resetData) {
        return $http.put('/api/resetpassword', resetData)
    }
    userFactory.resetUser = function(token) {
        return $http.get('/api/resetpassword/' + token)
    }
    userFactory.savePassword = function(regData) {
        return $http.put('/api/savepassword', regData)
    }
    userFactory.renewSession = function(username) {
        return $http.get('/api/renewToken/username', username);
    }
    userFactory.getPermission = function(){
        return $http.get('/api/permission/')
    }
    userFactory.getAboutUs = function() {
        return $http.get('/api/aboutme/')
    }
    userFactory.getProducts = function() {
        return $http.get('/api/courses/')
    }
    userFactory.getMyCourses = function(courses){
        return $http.get('/api/myCourses', courses);  
    }
    userFactory.getMyOrdersCourse = function(orders){
        return $http.get('/api/orders/myOrders', orders);  
    }
    userFactory.videoDetail = function(username, id){
        return $http.get('/api/myCourses/' + username + '/' + id);  
    }
    userFactory.blogArticles = function(page, method) {
        return $http.get('/api/blog/articles/' + page + '/' + method)
    }
    userFactory.singleArticle = function(id, page) {
        return $http.get('/api/blog/article/' + id + '/' + page)
    }
    userFactory.singleArticleComment = function(comment) {
        return $http.post('/api/blog/article/comment', comment)
    }
    userFactory.singleArticleReply = function(reply) {
        return $http.post('/api/blog/article/comment/reply', reply)
    }
    userFactory.readMoreCourse = function(id) {
        return $http.get('/api/courses/details/' + id) 
    }
    userFactory.sendMessage = function(messageData){
        return $http.post('/api/contact', messageData) 
    }
    userFactory.postComment = function(comment){
        return $http.post('/api/comment', comment);  
    }
    userFactory.replyUserComment = function(reply){
        return $http.post('/api/comment/reply', reply);  
    }
    userFactory.addToCart = function(id) {
        return $http.get('/api/addToCart/' + id);  
    } 
    userFactory.removeFromCart = function(id) {
        return $http.get('/api/removeFromCart/' + id);  
    } 
    userFactory.getSession = function() {
        return $http.get('/api/cart/');  
    } 
    userFactory.order = function(order) {
        return $http.post('/api/orders', order);  
    }
    userFactory.companyOrder = function(companyOrder) {
        return $http.post('/api/CompanyOrder', companyOrder);  
    }
    userFactory.updateOrder = function(id) {
        return $http.put('/api/orders/update', id)
    }
    userFactory.checkOrderSession = function() {
        return $http.get('/api/payments/')
    }
    userFactory.notification = function(id){
        return $http.post('/api/notify/'+ id)   
    }
    userFactory.orderByPayu = function() {
        return $http.get('/api/orderStatus/')
    }
    userFactory.sendOrders = function(order) {
        return $http.post('/api/sendOrders', order)
    }
    userFactory.editMyProfile = function(){
        return $http.get('/api/profile/editAccount/')
    }
    userFactory.saveChangesAccount = function(id){
        return $http.put('/api/profile/editAccount/editProfile', id)
    }
    userFactory.checkChangedUsername = function(id){
        return $http.post('/api/profile/checkusername', id)
    }
    userFactory.checkChangedEmail = function(id){
        return $http.post('/api/profile/checkemail', id)
    }
    userFactory.checkCurrPass = function(id){
        return $http.post('/api/profile/checkpassword', id)
    }
    userFactory.comparePasswords = function(id){
        return $http.post('/api/profile/comparepassword', id)
    }
    userFactory.saveChangePassword = function(id){
        return $http.put('/api/profile/savenewpassword', id)
    }
    /***********************ADMIN DASHBOARD***********************/
    userFactory.upload = function(file){
        var fd = new FormData();
        if(file != undefined || file != null) {
            if(file.length){
                for(var i = 0; i < file.length; i++){
                    fd.append('myfile', file[i]);
                }
            } else if(file.newBlog) {
                fd.append('myfile', file.newBlog);
            } else if(file.editBlogArticle){
                fd.append('myfile', file.editBlogArticle)
            }
        }
        return $http.post('/api/dashboard/admin/upload/', fd, {
            transformRequest: angular.identity,
            headers: { 'Content-Type': undefined }
        })
    }
    userFactory.editAdminProfile = function(){
        return $http.get('/api/dashboard/admin/profile/edit')
    }
    userFactory.checkAdminUsername = function(id){
        return $http.post('/api/dashboard/admin/profile/checkusername', id)
    }
    userFactory.checkAdminEmail = function(id){
        return $http.post('/api/dashboard/admin/profile/checkemail', id)
    }
    userFactory.saveChangesAdminAccount = function(id){
        return $http.put('/api/dashboard/admin/profile/save', id)
    }
    userFactory.checkAdminPassword = function(id){
        return $http.post('/api/dashboard/admin/profile/checkpassword', id)
    }
    userFactory.compareAdminPasswords = function(id){
        return $http.post('/api/dashboard/admin/profile/comparepassword', id)
    }
    userFactory.saveChangeAdminPassword = function(id){
        return $http.put('/api/dashboard/admin/profile/savenewpassword', id)
    }
    userFactory.getUsers = function(){
        return $http.get('/api/dashboard/admin/management/')
    }
    userFactory.getUser = function(id) {
        return $http.get('/api/dashboard/admin/users/edit/' + id)
    }
    userFactory.editUser = function(id) {
        return $http.put('/api/dashboard/admin/users/edit', id)
    }
    userFactory.saveAdminPassword = function(id){
        return $http.post('/api/dashboard/admin', id)
    }
    userFactory.activateAdminAccount = function(token){
        return $http.put('/api/dashboard/admin/activate/' + token);
    }
    userFactory.renewAdminSession = function(username) {
        return $http.get('/api/admin/renewToken/username', username);
    }
    userFactory.getAdminPermission = function(){
        return $http.get('/api/admin/permission/')
    }
    userFactory.checkAdminCredentials = function(loginAdminData) {
        return $http.post('/api/dashboard/admin/resend', loginAdminData);
    }
    userFactory.resendAdminLink = function(username){
        return $http.put('/api/dashboard/admin/resend', username);
    }
    userFactory.postAdminComment = function(comment){
        return $http.post('/api/dashboard/admin/comment', comment);  
    }
    userFactory.articleAdminComment = function(comment){
        return $http.post('/api/dashboard/admin/blog/article/comment', comment);  
    }
    userFactory.articleAdminReply = function(reply){
        return $http.post('/api/dashboard/admin/blog/article/comment/reply', reply);  
    }
    userFactory.articleRemoveReply = function(id){
        return $http.put('/api/dashboard/admin/blog/article/comment/reply/delete', id);  
    } 
    userFactory.articleRemoveComment = function(id){
        return $http.put('/api/dashboard/admin/blog/article/comment/delete', id);  
    }
    userFactory.articleVoteComment = function(id){ 
        return $http.put('/api/dashboard/admin/blog/article/comment/vote', id);  
    }
    userFactory.articleVoteReply = function(id){
        return $http.put('/api/dashboard/admin/blog/article/comment/reply/vote', id);  
    }
    userFactory.replyComment = function(reply){
        return $http.post('/api/dashboard/admin/comment/reply', reply);  
    }
    userFactory.deleteUser = function(username) {
        return $http.delete('/api/dashboard/admin/users/' + username)
    }
    userFactory.deleteDescription = function(id) {
        return $http.put('/api/dashboard/admin/editProduct/description/remove', id); 
    }
    userFactory.deleteVideoCourse = function(id) {
        return $http.delete('/api/dashboard/admin/course/delete/' + id)
    }
    userFactory.deleteArticle = function(id) {
        return $http.delete('/api/dashboard/admin/blog/articles/delete/' + id)
    }
    userFactory.removeComment = function(id){
        return $http.put('/api/dashboard/admin/comment/remove', id);  
    } 
    userFactory.removeReply = function(id){
        return $http.put('/api/dashboard/admin/comment/reply/remove', id);  
    } 
    userFactory.editProduct = function(id) {
        return $http.put('/api/dashboard/admin/editProduct', id)
    }   
    userFactory.getProduct = function(id) {
        return $http.get('/api/dashboard/admin/editProduct/' + id)
    }
    userFactory.editArticle = function(id) {
        return $http.get('/api/dashboard/admin/blog/articles/' + id)
    }
    userFactory.saveChangesArticle = function(id) {
        return $http.put('/api/dashboard/admin/blog/articles/edit', id)
    }
    userFactory.getArticles = function(id) {
        return $http.get('/api/dashboard/admin/blog/articles/')
    }
    userFactory.newBlogArticle = function(article){
        return $http.post('/api/dashboard/admin/blog/article', article)
    }
    userFactory.createNewCourse = function(productData){
        return $http.post('/api/dashboard/admin/courses', productData)
    }
    userFactory.editAboutUsPage = function(about){
        return $http.put('/api/dashboard/admin/aboutme/edit', about)
    }
    userFactory.getAboutUsPage = function(about){
        return $http.get('/api/dashboard/admin/aboutme/edit', about)
    }
    return userFactory 
}])
.factory('socket', function(){
    return {
        on: function(eventName, callback){
            socket.on(eventName, callback);
        },
        emit: function(eventName, data) {
            socket.emit(eventName, data);
        } 
    };
});
 


