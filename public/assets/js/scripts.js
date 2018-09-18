(function($){
    'use strict';
    //Responsive dashboard navigation bar
    $(document).on('click','#dashboard_panel .rad-toggle-btn', function() {
        let params = window.window.location.pathname.split('/').splice(-1).toString();
        if($('.rad_nav_min').width() < 60 && window.innerWidth >= 850) {
            $('.al-main').css('margin-left','155px');
            $('.rad-sidebar').removeClass('rad_nav_min');
            $('.collapse').removeClass('in');
            if(window.window.location.pathname === '/dashboard/admin/manage/courses' || window.window.location.pathname === '/dashboard/admin/new-course' || window.window.location.pathname === '/dashboard/admin/edit-course/'+params){
                $('.courseManage.collapse').addClass('in').css('height', 'auto');
            } else if(window.window.location.pathname === '/dashboard/admin/blog/new-article' || window.window.location.pathname === '/dashboard/admin/blog/articles' || window.window.location.pathname === '/dashboard/admin/edit-article/'+params) {
                $('.blogManage.collapse').addClass('in').css('height', 'auto');
            }
        } else if($('.rad_nav_min').width() < 60 && window.innerWidth < 850){
            $('.rad-sidebar').removeClass('rad_nav_min');
            $('.collapse').removeClass('in');
            if(window.window.location.pathname === '/dashboard/admin/manage/courses' || window.window.location.pathname === '/dashboard/admin/new-course' || window.window.location.pathname === '/dashboard/admin/edit-course/'+params){
                $('.collapse').addClass('in');
            } else if(window.window.location.pathname === '/dashboard/admin/blog/new-article' || window.window.location.pathname === '/dashboard/admin/blog/articles' || window.window.location.pathname === '/dashboard/admin/edit-article/'+params) {
                $('.blogManage.collapse').addClass('in');
            }
        } else if($('.rad-sidebar').width() > 60){
            $('.al-main').css('margin-left','5px');
            $('.rad-sidebar').addClass('rad_nav_min');
            $('.collapse').removeClass('in');
        }
    });
    $(document).on('click', '.nav_href_users', function(){
        $('.collapse').removeClass('in');
    });
    $(window).on('resize', function() {
        let params = window.window.location.pathname.split('/').splice(-1).toString();
        if($(window).width() < 1200) {
            $('.rad-sidebar').addClass('rad_nav_min');
            $('.collapse').removeClass('in');
            $('.al-main').css('margin-left','5px');
        } else if(window.location.pathname == '/dashboard/admin/manage/courses' || window.location.pathname == '/dashboard/admin/new-course' || window.window.location.pathname === '/dashboard/admin/edit-course/'+params) {
            $('.rad-sidebar').removeClass('rad_nav_min');
            $('.courseManage.collapse').addClass('in');
            $('.al-main').css('margin-left','155px');
        } else if(window.location.pathname == '/dashboard/admin/blog/new-article' || window.window.location.pathname === '/dashboard/admin/blog/articles' || window.window.location.pathname === '/dashboard/admin/edit-article/'+params) {
            $('.rad-sidebar').removeClass('rad_nav_min');
            $('.blogManage.collapse').addClass('in');
            $('.al-main').css('margin-left','155px');
        } else {
            $('.rad-sidebar').removeClass('rad_nav_min');
            $('.al-main').css('margin-left','155px');
        }
    });
    //Animation in home page
    $(window).scroll(function() {
        $(".slideanim").each(function(){
        let pos = $(this).offset().top;
        let winTop = $(window).scrollTop();
            if (pos < winTop + 600) {
            $(this).addClass("slideshow");
            }
        });  
    });
    $('#homeCarousel').carousel({
      interval: 5000,
      cycle: true
    });
    //Scroll to the top of the page
    $(document).on('click','.scroll-to-top',function(){ 
        $("html, body").animate({ scrollTop: 0 }, 1000);
        return false;
    });
})(jQuery);