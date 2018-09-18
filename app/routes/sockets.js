module.exports = function(io){
    io.on('connection', function(socket){
        //Create room and join by article id
        socket.on('connect blog', function(id){
            socket.join(id)
        });
        //Add user to room by id
        socket.on('connect user', function(id){
            socket.join(id)
        });
        //Create room and join admin
        socket.on('connect admin', function(id){
            socket.join(id)
        });
        //Add reply to comment 
        socket.on('reply', function(id, data, number){
            socket.join(id);
            io.sockets.in(id).emit('reply', { 
                reply: data,
                commentNumber: number
            });
        });
        //Add comment to course
        socket.on('new comment', function(id, data){ 
            socket.join(id);
            io.sockets.in(id).emit('newComment', { 
                comment: data
            });
        });
        //Add comment to article
        socket.on('new blogComment', function(id, data){
            socket.join(id);
            io.sockets.in(id).emit('newBlogComment', {
                comment: data
            })
        })
        //Add reply to article comment
        socket.on('blog reply', function(id, data, number){
            socket.join(id);
            io.sockets.in(id).emit('blogReply', { 
                reply: data, 
                commentNumber: number
            });
        });
        /******************************ADMIN SOCKET************************/
        //Remove comment by admin from course
        socket.on('update comment', function(data, id){
            socket.join(id)
            io.sockets.in(id).emit('updateComment', { 
                comment: data
            });
        });
        //Create new course
        socket.on('product', function(data){
            io.emit('product', { 
                product: data
            });
        });
        //Remove reply of comment by admin from course
        socket.on('update reply', function(data, id){
            socket.join(id);
            io.sockets.in(id).emit('updateReply', { 
                reply: data
            });
        });
        //Add comment to article by admin 
        socket.on('article adminComment', function(id, data){
            socket.join(id);
            io.sockets.in(id).emit('articleAdminComment', { 
                articleComment: data
            });
        });
         //"Like", "Dislike" comment by admin
        socket.on('vote adminComment', function(id, data, number){
            socket.join(id);
            io.sockets.in(id).emit('voteAdminComment', { 
                vote: data,
                number: number
            });
        });
        //Update article by admin
        socket.on('update article', function(data, id){
            socket.join(id)
            io.sockets.in(id).emit('updateArticle', {
                data: data,
                id: id,
            })
        })
        //Delete article from database
        socket.on('deleteArticle', function(data){
            io.emit('deleteArticle', {
                data: data,
            })
        })
        //"Like", "Dislike" comment reply by admin
        socket.on('vote adminReply', function(id, data, number, index){
            io.sockets.in(id).emit('voteAdminReply', { 
                vote: data,
                number: number,
                index: index
            });
        });
        //Add reply to comment by admin
        socket.on('article adminReply', function(id, data, number){
            socket.join(id);
            io.sockets.in(id).emit('articleAdminReply', { 
                articleReply: data,
                commentNumber: number
            });
        });
        //Remove comment by admin from article
        socket.on('article removeComment', function(id, data){
            socket.join(id);
            io.sockets.in(id).emit('articleRemoveComment', data);
        });
        //Remove reply of comment by admin from article
        socket.on('article removeReply', function(id, data, number){
            socket.join(id);
            io.sockets.in(id).emit('articleRemoveReply', 
                {
                    data: data,
                    number: number
                }
            );
        });
        //Update "About Us" page
        socket.on('aboutUs', function(data){
            io.emit('aboutUs', {
                aboutUs: data
            })
        })
        //Remove course by admin
        socket.on('delete course', function(data){
            io.emit('deleteCourse', { 
                course: data
            });
        });
        //Update course details by admin
        socket.on('update course', function(data, id, name){
            socket.join(id)
            io.sockets.in(id).emit('updateCourse', {
                record: data,
                id: id,
                name: name
            })
        })
        socket.on('disconnect', function(){
            console.log('User disconnected!')
        })   
    })    
    return io
}
