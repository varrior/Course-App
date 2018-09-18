export default angular.module('userTests', ['userServices', 'authServices'])
//Test to the course, this is experiment. Controller should get test from the datebase, but I have no implement adding new tests from admin dashboard
.controller('testsCtrl', ['$scope', '$timeout', 'quizProgress', 'scoreKeeper', function($scope, $timeout, quizProgress, scoreKeeper){

    $scope.quizProgress = quizProgress;
    //Quiz data, introduction view, questions content and correct answers
    $scope.quizData = {
        "quizMetadata": {
          "title": "Javascript quiz example",
          "introImg": "http://interactive.wttw.com/sites/default/files/styles/small-hero/public/B12_b.jpg",
        },
        "quizQuestions": [{
          "question": "The Chicago Loop got its name from:",
          "questionImg": "http://interactive.wttw.com/sites/default/files/styles/hero/public/Q1.jpg",
          "feedback": "Before the “L” came to the Loop, steam-powered cable cars circulated downtown, giving the area its name. Later, the elevated tracks and trains of the “L” made the Loop even more accessible to people throughout the Chicago region.",
          "options": [{
            "name": "The “L” tracks that circle the area.",
            "correct": false
          }, {
            "name": "Cable cars that circulated downtown before the “L” was built.",
            "correct": true
          }, {
            "name": "A turnaround circle for horse-drawn carriages.",
            "correct": false
          }]
        }, {
          "question": "What caused the Great Chicago Fire?",
          "questionImg": "http://interactive.wttw.com/sites/default/files/styles/hero/public/Q2.jpg",
          "feedback": "The fire did start in the vicinity of the O’Leary’s barn, but whether a cow kicked over a lantern, or a cinder came from a neighboring chimney, or a drunken neighbor dropped his pipe onto a pile of hay, or a meteor strike occurred (all theories that have been, ahem, hotly debated), no one knows for sure what happened in that barn, and the fire’s initial spark has never been definitively established.",
          "options": [{
            "name": "Mrs. O’Leary’s cow.",
            "correct": false
          }, {
            "name": "A meteor strike.",
            "correct": false
          }, {
            "name": "No one knows for sure.",
            "correct": true
          }]
        }],
    };
    $scope.quizQuestions = $scope.quizData.quizQuestions;
    $scope.quizMetadata = $scope.quizData.quizMetadata;
    quizProgress.lastQuestion = $scope.quizQuestions.length;
    quizProgress.loading = false;
    quizProgress.inProgress = true;

    $scope.startQuiz = function(){
        quizProgress.currentQuestion = 0;
        quizProgress.imageToPreload = 1;
    };
    $scope.nextQuestion = function(){
        if(quizProgress.currentQuestion < quizProgress.lastQuestion){
            quizProgress.currentQuestion = quizProgress.currentQuestion + 1;
            quizProgress.currentQuestionFriendly = quizProgress.currentQuestionFriendly + 1;
            quizProgress.imageToPreload = quizProgress.imageToPreload + 1;
        }
    };
    $scope.answerQuestion = function(data) {
        $scope.quizQuestions[quizProgress.currentQuestion].answered = true;
        angular.forEach($scope.quizQuestions[quizProgress.currentQuestion].options, function(obj) {
            if(obj.name === data.selected){
                obj.selected = true;
            } else {
                obj.selected = false;
            }
        })
    };
    $scope.checkAnswer = function(){
        $scope.quizQuestions[quizProgress.currentQuestion].answerChecked = true;
        angular.forEach($scope.quizQuestions[quizProgress.currentQuestion].options, function(obj){
            if(obj.selected){
              if(obj.correct){
                $scope.quizQuestions[quizProgress.currentQuestion].answerWasRight = true;
              } else {
                $scope.quizQuestions[quizProgress.currentQuestion].answerWasRight = false;
              }
            } 
        })
    };
    //Get result at the end
    $scope.getScore = function() {
        quizProgress.inProgress = false;
        quizProgress.finished = true;
        quizProgress.calculatingScore = true;
        $scope.score = scoreKeeper.calculateScore($scope.quizQuestions);
        $timeout(function(){
            quizProgress.calculatingScore = false;
        }, 1500)
    };

    $scope.startOver = function(){
        angular.forEach($scope.quizQuestions, function(obj){
            obj.answered = false;
            obj.answerWasRight = false;
            obj.answerChecked = false;
            angular.forEach(obj.options, function(option){
                option.selected = false;
            })
        });
        quizProgress.inProgress = true;
        quizProgress.finished = false;
        quizProgress.currentQuestion = 0;
        quizProgress.currentQuestionFriendly = 1;
    }
}])

.factory('quizProgress', function(){
    return {
        currentQuestion: 0,
        imageToPreload: 0,
        currentQuestionFriendly: 1,
        lastQuestion: 0,
        loading: true,
        inProgress: false,
        finished: false,
        calculatingScore: false
    }
})
.service('scoreKeeper', function(){
    this.calculateScore = function(quizQuestions) {
        let rightAnswers = 0;
        angular.forEach(quizQuestions, function(obj){
            if(obj.answerWasRight){
                rightAnswers += 1;
            }
        });
        return ((rightAnswers / quizQuestions.length)*100).toFixed() + '%'
    }
})
.directive('progressBar', ['quizProgress', function(quizProgress){
    return {
        restrict: 'A',
        link: function(scope, element, attrs){
            scope.$watch('quizProgress', function(newVal, oldVal){
                if(newVal){
                    element.css('width', ((quizProgress.currentQuestionFriendly / quizProgress.lastQuestion)*100 + '%'));
                }
            }, true)
        }
    }
}])
.directive('imagePreload', ['quizProgress', function(quizProgress){
    return {
        restrict: 'EA',
        template: "<img style='display:none;' ng-src='{{quizQuestions[quizProgress.imageToPreload].questionImg}}'/>"
    }
}])
.directive('animateProgression', ['quizProgress', '$timeout', function(quizProgress, $timeout){
    return {
        restrict: 'A',
        link: function(scope, element, attrs){
            scope.$watch('quizProgress.currentQuestion', function(newVal, oldVal){
                if(newVal){
                    element.addClass('question-animate');
                    $timeout(function(){
                        element.removeClass('question-animate');
                    }, 1500)
                }
            })
        }
    }
}])