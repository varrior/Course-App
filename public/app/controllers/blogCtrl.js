export default angular.module('blogController', ['userServices']) 

.controller('blogCtrl', ['$scope', 'User','$timeout' ,function($scope, User, $timeout) { 
  let app = this;
  app.currentPage = 1; 
  app.infiniteScroll = [];
  app.totalPage = 0;
  app.isFinish = false; 
  app.sortDown = false;
  app.sortUp = false;
  app.loadingPage = true;

  //Load all articles using lazy loading when scrolling down
  //Create header carousel with 3 first articles
  function getAllArticles(){
    app.sortDown = false;
    app.sortUp = false;
    app.isLoading = true;
    app.isFinish = false;
    User.blogArticles(app.currentPage).then(function(data){
      app.loadingPage = false;
      app.totalPage = data.data.totalPage;
      app.isLoading = false;
      app.isFinish = false;
      app.headerArticles = data.data.headerArticles
      data.data.articles.forEach(function(value){
        app.infiniteScroll.push(value)
      });
      if(app.currentPage >= app.totalPage){
        app.isFinish = true;
      }
      $timeout(function(){
        let $item = $('.carousel .item'); 
        let $wHeight = $(window).height()/2.4;
        $item.removeClass('active');
        $item.eq(0).addClass('active');
        $item.height($wHeight); 
        $item.addClass('full-screen');
        $('.carousel img').each(function() {
          let $src = $(this).attr('src');
          $(this).parent().css({
            'background-image' : 'url(' + $src + ')',
          });
          $(this).remove();
        });
        $(window).on('resize', function (){
          $wHeight = $(window).height()/2.4;
          $item.height($wHeight);
        });
        $('.carousel').carousel({
          interval: 6000,
          pause: "false"
        });
      },0)

    });
  }
  getAllArticles(app.currentPage);

  function sortDown(page, sort){
    app.sortDown = true;
    app.sortUp = false;
    app.isLoading = true;
    app.isFinish = false;
    User.blogArticles(page, sort).then(function(data){
      app.isLoading = false;
      data.data.articles.forEach(function(value){
        app.infiniteScroll.push(value)
      });
      app.totalPage = data.data.totalPage;
      if(app.currentPage >= app.totalPage){
        app.isFinish = true;
      }
    })
  };
  function sortUp(page){
    app.sortUp = true;
    app.sortDown = false;
    app.isLoading = true;
    app.isFinish = false;
    User.blogArticles(app.currentPage).then(function(data){
      app.isLoading = false;
      data.data.articles.forEach(function(value){
        app.infiniteScroll.push(value)
      });
      app.totalPage = data.data.totalPage;
      if(app.currentPage >= app.totalPage){
        app.isFinish = true;
      }
    })
  }
  //Show all articles, remove filter
  app.allArticles = function(){
    app.sortDown = false;
    app.sortUp = true;
    app.infiniteScroll = [];
    app.currentPage = 1;
    $('.nav-item .nav-link span').removeClass().addClass('glyphicon glyphicon-arrow-up up')
    sortUp(app.currentPage)
  }
  //Toggle click to sort articles by date
  app.sortByDate = function(select){
    app.infiniteScroll = [];
    app.currentPage = 1;
    var classList = select.currentTarget.firstElementChild.classList[2];
    if(classList === 'up'){
      select.currentTarget.lastChild.classList.remove('glyphicon-arrow-up','up')
      select.currentTarget.lastChild.classList.add('glyphicon-arrow-down', 'down')
      sortDown(app.currentPage, 'sortDown')

    } else if(classList === 'down') {
      select.currentTarget.lastChild.classList.remove('glyphicon-arrow-down','down')
      select.currentTarget.lastChild.classList.add('glyphicon-arrow-up', 'up')
      sortUp(app.currentPage)
    }
  }
app.search = function(){
    $(".sort_blog_news .search").toggleClass("close");
    $(".sort_blog_news .input").toggleClass("square");
    if ($('.sort_blog_news .search').hasClass('close')) {
      $('.sort_blog_news input').focus();
      $('.sort_blog_news input').attr('placeholder','Enter the tag you are interested in');
    } else {
      $('.sort_blog_news input').blur();
    }
}
//Filter articles by tags
app.getFilter = function(tag){
  User.blogArticles().then(function(data){
    if(tag.length){
      app.isFinish = true;
      app.currentPage = data.data.totalPage;
      app.infiniteScroll = data.data.allArticles.filter(function(item){
        return item.tags.some(function(blog){
          return blog === tag
        })
      })
    } else {
        app.isFinish = false;
        app.sortDown = false;
        app.sortUp = true;
        app.infiniteScroll = [];
        app.currentPage = 1;
        sortUp(app.currentPage)
    }
  })
}
//Load next articles from database after scrolling down
app.nextPage = function(){
  if(app.currentPage < app.totalPage){
    app.currentPage += 1;
    if(app.sortDown == true){
      sortDown(app.currentPage, 'sortDown')
    } else if(app.sortUp == true ){
      sortUp(app.currentPage)
    } else {
      getAllArticles(app.currentPage);
    }

  }
}
}])
.controller('singleArtCtrl', ['$scope', 'User', '$timeout', '$stateParams', '$window', '$anchorScroll', function($scope, User, $timeout, $stateParams, $window, $anchorScroll){
  
  let socket = io.connect(); 
  let app = this;
  app.loadingComment = false;
  app.loadingPage = true; 
  app.currentPage = 1;
  app.rest = [];
  app.isFinish = false;

  //Load single article from database by id
  User.singleArticle($stateParams.id).then(function(data){
    app.loadingPage = false;
    app.articleContent = data.data.article.body;
    app.articleImage = data.data.article.imagePath;
    app.title = data.data.article.title;
    app.author = data.data.article.author;
    app.date = data.data.article.date;
    app.tags = data.data.article.tags;
    app.comments = data.data.article.comments;
    app._id = data.data.article._id;
    
    socket.emit('connect blog', app._id);
  })
  //Load similar articles after scrolling down
  function restArticles(){
    app.isLoading = true;
    User.singleArticle($stateParams.id, app.currentPage).then(function(data){
      app.isLoading = false;
      data.data.rest.forEach(function(item){
        app.rest.push(item)
      })
      app.totalPage = data.data.totalPage;
      if(app.currentPage >= app.totalPage){
        app.isFinish = true;
        app.finishMsg = "For now, it's all articles on the blog:)"
      }
    })
  }
  restArticles(app.currentPage);
  //Add comment to article
  app.sendComment = function(data, valid){
    if(valid){
      app.loadingComment = true;
      app.comment = {};
      app.comment.body = data;
      app.comment.valid = valid;
      app.comment.id = app._id;
      User.singleArticleComment(app.comment).then(function(data){
        if(data.data.success){
          app.loadingComment = false;
          app.commentMsg = data.data.message;
          $timeout(function(){
              app.userComment = '';
              app.AddCommentForm.$setPristine();
              app.commentMsg = false;
          },2000);
          socket.emit('new blogComment', data.data.id, data.data.comment);
        } else {
          app.errCommentMsg = data.data.message;
          $timeout(function(){
              app.errCommentMsg = false;
              app.loadingComment = false;
          }, 2000)
        }
      })
    } else {
      app.errCommentMsg = 'Add comment content'
      $timeout(function(){
          app.errCommentMsg = false;
          app.AddCommentForm.$setPristine();
      }, 2000)
    }
  }
  //Add reply to comment
  app.sendReply = function(comment, body, form){
    app.addedReply = comment._id;
    if(form.$valid){    
      app.disableReply = true;
      app.loadingReply = true;
      app.reply = {};
      app.reply.id = app._id;
      app.reply.valid = form.$valid
      app.reply.commentId = comment._id
      app.reply.body = body;

      User.singleArticleReply(app.reply).then(function(data){
        if(data.data.success){
          app.disableReply = false;
          app.loadingReply = false;
          app.replyMsg = data.data.message;
          $timeout(function(){
            form.$setPristine();
            app.commentReply[comment.number] = '';
            app.replyMsg = false;
          },2000);
          socket.emit('blog reply', app._id, data.data.reply, comment.number);
        } else {
          app.disableReply = false;
          app.errReply = data.data.message;
          $timeout(function(){
            app.errReply = false;
            app.loadingReply = false;
          },2000)
        }
      })
    } else {
      app.errReply = 'Add reply content';
      $timeout(function(){
          app.errReply = false;
      },2000)
    }
  }
  //Load similar articles after scrolling down
  app.nextPage = function(){
    if(app.currentPage < app.totalPage){
      app.currentPage += 1;
      restArticles(app.currentPage);
    }
  }
  //Increase textarea height  if is smaller than text
  $(document).on('keydown', 'textarea[data-autoresize]',function(){
    setTimeout(()=>{
        this.style.cssText = 'height:' + this.scrollHeight + 'px'
    },0)
  })
  //Add socket client
  socket.on('newBlogComment', function(data){
    app.comments.push(data.comment);   
  });
  socket.on('blogReply', function(data){
    app.comments[data.commentNumber - 1].reply.push(data.reply)
  });  
  socket.on('articleAdminComment', function(data){
    app.comments.push(data.articleComment);
  });
  socket.on('articleAdminReply', function(data){
      app.comments[data.commentNumber - 1].reply.push(data.articleReply)
  });
  socket.on('updateArticle', function(data){
    app.articleContent = data.data.body;
    app.articleImage = data.data.imagePath;
    app.title = data.data.title;
    app.author = data.data.author;
    app.date = data.data.date;
    app.tags = data.data.tags;
  })
  socket.on('articleRemoveComment', function(data){
    app.comments = data.comments;
  });
  socket.on('articleRemoveReply', function(data){
    app.comments[data.number - 1].reply = data.data;
});
  $scope.$on('$stateChangeStart', function(event){
      socket.disconnect(true);
  })
}])
.directive('cutImage', ['$window',function($window){
  return {
    restict: 'A',
    link: function(scope, element, attr){
      var item = element;
      var height = $window.innerHeight/2;
      item.height(height);
    }
  }
}])
.directive('activeClass', function(){
  return {
    restrict: 'A',
    link: function(scope, element, attr){
      element.bind('click', function(){
        $('.sort_blog_news .nav-link').removeClass('active');
        element[0].classList.add('active')
      })
    }
  }
})
//Load new articles after scrolling down
.directive('infinityscroll', ['$window', function($window){
  return {
    restrict: 'A',
    link: function(scope, element, attr){
      $(window).bind('scroll', function(){
        if ($(window).scrollTop() >= $('#blog').height()-$('#footer').height()) {
          scope.$apply(attr.infinityscroll)
        } else if ($(window).scrollTop() >= $('.single-article').height()-$('#footer').height()) {
          scope.$apply(attr.infinityscroll)
        }
      })
    }
  }
}])