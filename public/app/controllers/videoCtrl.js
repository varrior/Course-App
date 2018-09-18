export default angular.module('videoPlayer', ['userServices', 'authServices',"ngSanitize", "com.2fdevs.videogular", "com.2fdevs.videogular.plugins.controls", "com.2fdevs.videogular.plugins.overlayplay", "com.2fdevs.videogular.plugins.poster"])
//The video section is not finished, display courses bought by the user
.controller('videoCtrl', ['User', function(User){

    let app = this;
    app.currentPage = 1;
    app.itemsPerPage = 8;
    app.loading = true;

    User.getProducts().then(function(data){
        app.products = data.data.products;
        User.getMyCourses().then(function(data){
            app.username = encodeURI(data.data.user);
            app.myCourses = app.products.filter(function(item){
                 return data.data.courses.indexOf(item._id) !== -1
            });
         })
    })
}])
//This section is not finished, videos should be streamed from database using NodeJS, here is only an example how this could work. "Videogular"
.controller('videoCtrlDetail', ['$sce', '$scope', 'User', '$stateParams', '$state', function($sce, $scope, User, $stateParams, $state){
    let app = this;
    app.loading = true;

    app.config = {
        preload: "none",
        sources: [
            {src: $sce.trustAsResourceUrl("http://static.videogular.com/assets/videos/videogular.mp4"), type: "video/mp4"},
            {src: $sce.trustAsResourceUrl("http://static.videogular.com/assets/videos/videogular.webm"), type: "video/webm"},
            {src: $sce.trustAsResourceUrl("http://static.videogular.com/assets/videos/videogular.ogg"), type: "video/ogg"}
        ],
        tracks: [
            {
                src: "http://www.videogular.com/assets/subs/pale-blue-dot.vtt",
                kind: "subtitles",
                srclang: "en",
                label: "English",
                default: ""
            }
        ],
        theme: {
            url: "https://unpkg.com/videogular@2.1.2/dist/themes/default/videogular.css"
        },
        plugins: {
  poster: "http://www.videogular.com/assets/images/videogular.png"
        }
    };
    User.videoDetail($stateParams.username, $stateParams.id).then(function(data){
        if(data.data.success){
            app.productDetail = data.data.product
        } else {
            app.loading = true;
            $state.go('parent.video')
        }
    })
    $scope.$on('$viewContentLoaded', function(){
        app.loading = false;
    })
}])











