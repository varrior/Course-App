export default angular.module('newCourseController',['textAngular','angularSpectrumColorpicker'])

.controller('newCourseCtrl', ['$scope', '$timeout', 'User', '$state', function($scope, $timeout, User, $state){
    let app = this;
    let socket = io.connect(); 
    let newCoursePhotos = [];
    app.inputs = []; 
    app.productData = {
        fileName: [],
    };
    app.imagePreview = false;
    app.thumbnail = {
        dataUrl: null,
    };
    //Add new input to dscription
    app.addfield = function(){
        app.inputs.push({})
    }   
    //Add photo to the header of the course
    app.photoChanged = function(files) {
        if(files.length > 0 && files[0].name.match(/\.(png|jpeg|jpg)$/)) {
            let file = files[0];
            app.uploading = true;
            app.imagePreview = true;
            newCoursePhotos.push(file)
            for(let i = 0; i < newCoursePhotos.length; i++) {
                let fileReader = new FileReader();
                fileReader.readAsDataURL(newCoursePhotos[i]);
                fileReader.onload = function(e) {
                    $timeout(function() {
                        app.thumbnail = {};
                        app.thumbnail.dataUrl = e.target.result;
                        app.uploading = false;                   
                    });
                };
            }
        } else {
            app.thumbnail = {};
        }
    };
    $scope.$watch('file.newCourse', function(newFile){
        if(newFile) app.productData.imagePath = newFile.name

    })
    //Remove image
    app.clearImage = function(file){
        let but = document.querySelector("#selectImage");
        app.uploading = false;
        app.imagePreview = false;
        app.productData.imagePath = '';
        app.thumbnail.dataUrl = '';
        newCoursePhotos = [];
        angular.element(but).val(null);
    } 
    app.easyLevel = function(){
        app.productData.level = 'fa fa-3x fa-battery-quarter text-primary level-higher-easy'
    }
    app.mediumLevel = function(){  
        app.productData.level = 'fa fa-3x fa-battery-half text-primary level-higher-medium'    
    }
    app.hardLevel = function(){
        app.productData.level = 'fa fa-3x fa-battery-full text-primary level-higher-hard'   
    }   
    //Add course to database 
    app.sendProduct = function(productData, valid) {      
        app.disabled = true;
        app.errorMsg = false;
        if(valid){
            User.createNewCourse(app.productData).then(function(data){  
                if(data.data.success){ 
                    app.successMsg = data.data.message;
                    $timeout(function(){ 
                        app.disabled = false;
                        app.successMsg = false;
                        $scope.sendProductForm.$setPristine();
                        app.productData = {};
                        app.imagePreview = false;
                        app.thumbnail.dataUrl = '';
                        newCoursePhotos = [];
                        app.inputs = [];
                        angular.forEach(
                            angular.element(document.querySelector("#selectImage")),
                            function(inputElem) {
                              angular.element(inputElem).val(null);
                            }
                        );
                    },2000)     
                    socket.emit('product', data.data.product);         
                } else {
                    app.disabled = false;
                    app.errorMsg = data.data.message;
                    $timeout(function(){
                        app.errorMsg = false;
                    },2000)
                    
                }    
            });     
            User.upload(newCoursePhotos).then(function(data) {
                if (data.data.success) { 
                    app.uploading = false;            
                    $scope.file = {};
                } else {
                    app.uploading = false;
                    app.errorMsg = data.data.message;
                    $scope.file = {};
                    $timeout(function(){
                        app.errorMsg = false;
                    },2000)
                }
            });        
        } else {
            app.disabled = false;
            app.errorMsg = 'Make sure that the form has been completed correctly';
            $timeout(function(){
                app.errorMsg = false;
            },2000)
        }
    }
    $scope.showModal = function(){
        $('#createLink').modal('show');
    }
}])

//Text angular config
.config(['$provide',function($provide){
    $provide.decorator('taOptions', ['taRegisterTool', '$delegate', function(taRegisterTool, taOptions){    
        taRegisterTool('backgroundColor', {
            display: "<div spectrum-colorpicker ng-model='color' title='Text background color' on-change='!!color && action(color)' options='options'></div>",
            action: function (color) {
                var me = this;
                if (!this.$editor().wrapSelection) {
                    setTimeout(function () {
                        me.action(color);
                    }, 100) 
                } else {
                    var borName = this.name;
                    return this.$editor().wrapSelection('backColor', color);
                }
            },
            options: { 
                replacerClassName: 'fa fa-paint-brush', 
                color:'transparent',
                showButtons: false, 
                showAlpha: true,  
                showInput: true,
                showInitial: true,
                showPalette: true,
                showSelectionPalette: true,
                maxSelectionSize: 10,
                preferredFormat: "hex",
                palette: [
                    ["transparent","#205081","#eb3812","rgb(0, 0, 0)", "#333333","rgb(67, 67, 67)", "rgb(102, 102, 102)",
                    "rgb(204, 204, 204)", "rgb(217, 217, 217)","rgb(255, 255, 255)"],
                    ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)",
                    "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"], 
                    ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)", 
                    "rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)", 
                    "rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)", 
                    "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)", 
                    "rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)", 
                    "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)",
                    "rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)",
                    "rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)",
                    "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)", 
                    "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]
                ]
            },
            
        });
        taRegisterTool('fontColor', {
            display: "<spectrum-colorpicker trigger-id='{{trigger}}' title='Font color' ng-model='color' on-change='!!color && action(color)' format='\"hex\"' options='options'></spectrum-colorpicker>",
            action: function(color){
                var app = this;
                if(!this.$editor().wrapSelection){
                    setTimeout(function(){
                        app.action(color);
                    }, 100)
                } else {
                    return this.$editor().wrapSelection('foreColor', color);
                }
            },
            options: { 
                replacerClassName: 'fa fa-font', 
                showButtons: false, 
                showAlpha: true, 
                color: true, 
                showInput: true,
                showInitial: true,
                showPalette: true,
                showSelectionPalette: true,
                maxSelectionSize: 10,
                preferredFormat: "hex",
                palette: [
                    ["#205081","#eb3812","rgb(0, 0, 0)", "#333333","rgb(67, 67, 67)", "rgb(102, 102, 102)",
                    "rgb(204, 204, 204)", "rgb(217, 217, 217)","rgb(255, 255, 255)"],
                    ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)",
                    "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"], 
                    ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)", 
                    "rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)", 
                    "rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)", 
                    "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)", 
                    "rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)", 
                    "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)",
                    "rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)",
                    "rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)",
                    "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)", 
                    "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]
                ]
            },
            
        });
        taRegisterTool('fontName', { 
            display: "<span class='custom-border-inline'>" +
            "<button title='Font name' class='btn btn-blue dropdown-toggle' type='button' ng-disabled='isDisabled()' style='padding-top: 4px'><i class='fa fa-font'></i>&nbsp;<i class='fa fa-caret-down'></i></button>" +
            "<ul class='dropdown-menu font-size-style'><li ng-repeat='o in options'><button class='btn btn-blue checked-dropdown' style='font-family: {{o.css}}; width: 100%' type='button' ng-click='action($event, o.css)'><i ng-if='o.active' class='fa fa-check'></i>{{o.name}}</button></li></ul></span>",
            action: function(event, font) {
                if(!!event.stopPropagation){
                    event.stopPropagation();
                    $("body").trigger("click");
                }
                return this.$editor().wrapSelection('fontName', font)
            },
            options: [ 
                { name: 'Roboto', css: 'Roboto,sans-serif' },
                { name: 'Sans-Serif', css: 'Arial, Helvetica, sans-serif' },
                { name: 'Serif', css: "'times new roman', serif" },
                { name: 'Wide', css: "'arial black', sans-serif" },
                { name: 'Narrow', css: "'arial narrow', sans-serif" },
                { name: 'Comic Sans MS', css: "'comic sans ms', sans-serif" },
                { name: 'Courier New', css: "'courier new', monospace" },
                { name: 'Garamond', css: 'garamond, serif' },
                { name: 'Georgia', css: 'georgia, serif' },
                { name: 'Tahoma', css: 'tahoma, sans-serif' },
                { name: 'Trebuchet MS', css: "'trebuchet ms', sans-serif" },
                { name: "Helvetica", css: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
                { name: 'Verdana', css: 'verdana, sans-serif' },
                { name: 'Proxima Nova', css: 'proxima_nova_rgregular' }
            ]
        });
        taRegisterTool('fontSize', {
            display: "<span class='custom-border-inline'>" +
            "<button title='Font size' class='btn btn-blue dropdown-toggle' type='button' ng-disabled='showHtml()' style='padding-top: 4px'><i class='fa fa-text-height'></i>&nbsp;&nbsp;<i class='fa fa-caret-down'></i></button>" +
            "<ul class='dropdown-menu font-size-style'><li ng-repeat='o in options'><button class='btn btn-blue checked-dropdown' style='font-size: {{o.css}}; width: 100%; ' type='button' ng-click='action($event, o.value)'><i ng-if='o.active' class='fa fa-check'></i> {{o.name}}</button></li></ul>" +
            "</span>",
            action: function (event, size) {
                if (!!event.stopPropagation) {
                    event.stopPropagation();
                    $("body").trigger("click");
                }
                return this.$editor().wrapSelection('fontSize', size);
            },
            options: [
                { name: '8px', css: '8px', value: '8px' },
                { name: '10px', css: '10px', value: '10px' },
                { name: '12px', css: '12px', value: '12px' },
                { name: '14px', css: '14px', value: '14px' },
                { name: '16px', css: '16px', value: '16px' },
                { name: '18px', css: '18px', value: '18px' },
                { name: '20px', css: '20px', value: '20px' },
                { name: '22px', css: '22px', value: '22px' },
                { name: '24px', css: '24px', value: '24px' },
                { name: '26px', css: '26px', value: '26px' },
                { name: '28px', css: '28px', value: '28px' },
                { name: '30px', css: '30px', value: '30px' },
                { name: '32px', css: '32px', value: '32px' },
                { name: '34px', css: '34px', value: '34px' },
                { name: '36px', css: '36px', value: '36px' }
            ]
        });
        taRegisterTool('ulCustom', {
            display: "<span class='custom-span-ul'>" + "<button title='Custom list' class='btn btn-blue dropdown-toggle custom-list-addon' type='button'><i class='fa fa-list-alt'></i>&nbsp;&nbsp;<i class='fa fa-caret-down'></i></button>" + "<ul class='select-list dropdown-menu'><li ng-repeat='o in options' class='list-style-cms'><button class='{{o.content}}' type='button' ng-click='action($event, o)'></button></li></ul>" + "</span>",

            action: function(event, content){ 
                if(!!event.stopPropagation){
                    event.stopPropagation();
                    $('body').trigger('click');
                }
                var customName = this.$parent.name;
                return this.$editor().wrapSelection('insertUnorderedList', content, customName)

            },
            options: [
                { content: 'glyphicon glyphicon-edit', css: 'e065'},
                { content: 'glyphicon glyphicon-share', css: 'e066'},
                { content: 'glyphicon glyphicon-ok', css: 'e013'},
                { content: 'glyphicon glyphicon-education', css: 'e233'},
                { content: 'fa fa-cogs', css: 'f085'},
                { content: 'glyphicon glyphicon-asterisk', css: 'g002a'},
                { content: 'glyphicon glyphicon-plus', css: 'g002b'},
                { content: 'glyphicon glyphicon-euro', css: 'g20ac'},
                { content: 'glyphicon glyphicon-minus', css: 'g2212'},
                { content: 'glyphicon glyphicon-cloud', css: 'g2601'},
                { content: 'glyphicon glyphicon-envelope', css: 'g2709'},
                { content: 'glyphicon glyphicon-pencil', css: 'g270f'},
                { content: 'glyphicon glyphicon-glass', css: 'e001'},
                { content: 'glyphicon glyphicon-music', css: 'e002'},
                { content: 'glyphicon glyphicon-search', css: 'e003'},
                { content: 'glyphicon glyphicon-heart', css: 'e005'},
                { content: 'glyphicon glyphicon-star', css: 'e006'},
                { content: 'glyphicon glyphicon-star-empty', css: 'e007'},
                { content: 'glyphicon glyphicon-user', css: 'e008'},
                { content: 'glyphicon glyphicon-film', css: 'e009'},
                { content: 'glyphicon glyphicon-th-large', css: 'e010'},
                { content: 'glyphicon glyphicon-th', css: 'e011'},
                { content: 'glyphicon glyphicon-th-list', css: 'e012'},
                { content: 'glyphicon glyphicon-remove', css: 'e014'},
                { content: 'glyphicon glyphicon-zoom-in', css: 'e015'},
                { content: 'glyphicon glyphicon-zoom-out', css: 'e016'},
                { content: 'glyphicon glyphicon-off', css: 'e017'},
                { content: 'glyphicon glyphicon-signal', css: 'e018'},
                { content: 'glyphicon glyphicon-cog', css: 'e019'},
                { content: 'glyphicon glyphicon-trash', css: 'e020'},
                { content: 'glyphicon glyphicon-home', css: 'e021'},
                { content: 'glyphicon glyphicon-file', css: 'e022'},
                { content: 'glyphicon glyphicon-time', css: 'e023'},
                { content: 'glyphicon glyphicon-road', css: 'e024'},
                { content: 'glyphicon glyphicon-download-alt', css: 'e025'},
                { content: 'glyphicon glyphicon-download', css: 'e026'},
                { content: 'glyphicon glyphicon-upload', css: 'e027'},
                { content: 'glyphicon glyphicon-inbox', css: 'e028'},
                { content: 'glyphicon glyphicon-play-circle', css: 'e029'},
                { content: 'glyphicon glyphicon-repeat', css: 'e030'},
                { content: 'glyphicon glyphicon-refresh', css: 'e031'},
                { content: 'glyphicon glyphicon-list-alt', css: 'e032'},
                { content: 'glyphicon glyphicon-lock', css: 'e033'},
                { content: 'glyphicon glyphicon-flag', css: 'e034'},
                { content: 'glyphicon glyphicon-headphones', css: 'e035'},
                { content: 'glyphicon glyphicon-volume-off', css: 'e036'},
                { content: 'glyphicon glyphicon-volume-down', css: 'e037'},
                { content: 'glyphicon glyphicon-volume-up', css: 'e038'},
                { content: 'glyphicon glyphicon-qrcode', css: 'e039'},
                { content: 'glyphicon glyphicon-barcode', css: 'e040'},
                { content: 'glyphicon glyphicon-tag', css: 'e041'},
                { content: 'glyphicon glyphicon-tags', css: 'e042'},
                { content: 'glyphicon glyphicon-book', css: 'e043'},
                { content: 'glyphicon glyphicon-bookmark', css: 'e044'},
                { content: 'glyphicon glyphicon-print', css: 'e045'},
                { content: 'glyphicon glyphicon-camera', css: 'e046'},
                { content: 'glyphicon glyphicon-font', css: 'e047'},
                { content: 'glyphicon glyphicon-bold', css: 'e048'},
                { content: 'glyphicon glyphicon-italic', css: 'e049'},
                { content: 'glyphicon glyphicon-text-height', css: 'e050'},
                { content: 'glyphicon glyphicon-text-width', css: 'e051'},
                { content: 'glyphicon glyphicon-align-left', css: 'e052'},
                { content: 'glyphicon glyphicon-align-center', css: 'e053'},
                { content: 'glyphicon glyphicon-align-right', css: 'e054'},
                { content: 'glyphicon glyphicon-align-justify', css: 'e055'},
                { content: 'glyphicon glyphicon-list', css: 'e056'},
                { content: 'glyphicon glyphicon-indent-left', css: 'e057'},
                { content: 'glyphicon glyphicon-indent-right', css: 'e058'},        
                { content: 'glyphicon glyphicon-facetime-video', css: 'e059'},
                { content: 'glyphicon glyphicon-picture', css: 'e060'},
                { content: 'glyphicon glyphicon-map-marker', css: 'e062'},
                { content: 'glyphicon glyphicon-adjust', css: 'e063'},
                { content: 'glyphicon glyphicon-tint', css: 'e064'},
                { content: 'glyphicon glyphicon-check', css: 'e067'},
                { content: 'glyphicon glyphicon-move', css: 'e068'},
                { content: 'glyphicon glyphicon-step-backward', css: 'e069'},
                { content: 'glyphicon glyphicon-fast-backward', css: 'e070'},
                { content: 'glyphicon glyphicon-backward', css: 'e071'},
                { content: 'glyphicon glyphicon-play', css: 'e072'},
                { content: 'glyphicon glyphicon-pause', css: 'e073'},
                { content: 'glyphicon glyphicon-stop', css: 'e074'},
                { content: 'glyphicon glyphicon-forward', css: 'e075'},
                { content: 'glyphicon glyphicon-fast-forward', css: 'e076'},
                { content: 'glyphicon glyphicon-step-forward', css: 'e077'},
                { content: 'glyphicon glyphicon-eject', css: 'e078'},
                { content: 'glyphicon glyphicon-chevron-left', css: 'e079'},
                { content: 'glyphicon glyphicon-chevron-right', css: 'e080'},
                { content: 'glyphicon glyphicon-plus-sign', css: 'e081'},
                { content: 'glyphicon glyphicon-minus-sign', css: 'e082'},
                { content: 'glyphicon glyphicon-remove-sign', css: 'e083'},
                { content: 'glyphicon glyphicon-ok-sign', css: 'e084'},
                { content: 'glyphicon glyphicon-question-sign', css: 'e085'},
                { content: 'glyphicon glyphicon-info-sign', css: 'e086'},
                { content: 'glyphicon glyphicon-screenshot', css: 'e087'},
                { content: 'glyphicon glyphicon-remove-circle', css: 'e088'},
                { content: 'glyphicon glyphicon-ok-circle', css: 'e089'},
                { content: 'glyphicon glyphicon-ban-circle', css: 'e090'},
                { content: 'glyphicon glyphicon-arrow-left', css: 'e091'},
                { content: 'glyphicon glyphicon-arrow-right', css: 'e092'},
                { content: 'glyphicon glyphicon-arrow-up', css: 'e093'},
                { content: 'glyphicon glyphicon-arrow-down', css: 'e094'},
                { content: 'glyphicon glyphicon-share-alt', css: 'e095'},
                { content: 'glyphicon glyphicon-resize-full', css: 'e096'},
                { content: 'glyphicon glyphicon-resize-small', css: 'e097'},
                { content: 'glyphicon glyphicon-exclamation-sign', css: 'e101'},
                { content: 'glyphicon glyphicon-gift', css: 'e102'},
                { content: 'glyphicon glyphicon-leaf', css: 'e103'},
                { content: 'glyphicon glyphicon-fire', css: 'e104'},
                { content: 'glyphicon glyphicon-eye-open', css: 'e105'},
                { content: 'glyphicon glyphicon-eye-close', css: 'e106'},
                { content: 'glyphicon glyphicon-warning-sign', css: 'e107'},
                { content: 'glyphicon glyphicon-plane', css: 'e108'},
                { content: 'glyphicon glyphicon-calendar', css: 'e109'},
                { content: 'glyphicon glyphicon-random', css: 'e110'},
                { content: 'glyphicon glyphicon-comment', css: 'e111'},
                { content: 'glyphicon glyphicon-magnet', css: 'e112'},
                { content: 'glyphicon glyphicon-chevron-up', css: 'e113'},
                { content: 'glyphicon glyphicon-chevron-down', css: 'e114'},
                { content: 'glyphicon glyphicon-retweet', css: 'e115'},
                { content: 'glyphicon glyphicon-shopping-cart', css: 'e116'},
                { content: 'glyphicon glyphicon-folder-close', css: 'e117'},
                { content: 'glyphicon glyphicon-folder-open', css: 'e118'},
                { content: 'glyphicon glyphicon-resize-vertical', css: 'e119'},
                { content: 'glyphicon glyphicon-resize-horizontal', css: 'e120'},
                { content: 'glyphicon glyphicon-hdd', css: 'e121'},
                { content: 'glyphicon glyphicon-bullhorn', css: 'e122'},
                { content: 'glyphicon glyphicon-bell', css: 'e123'},
                { content: 'glyphicon glyphicon-certificate', css: 'e124'},
                { content: 'glyphicon glyphicon-thumbs-up', css: 'e125'},
                { content: 'glyphicon glyphicon-thumbs-down', css: 'e126'},
                { content: 'glyphicon glyphicon-hand-right', css: 'e127'},
                { content: 'glyphicon glyphicon-hand-left', css: 'e128'},
                { content: 'glyphicon glyphicon-hand-up', css: 'e129'},
                { content: 'glyphicon glyphicon-hand-down', css: 'e130'},
                { content: 'glyphicon glyphicon-circle-arrow-right', css: 'e131'},
                { content: 'glyphicon glyphicon-circle-arrow-left', css: 'e132'},
                { content: 'glyphicon glyphicon-circle-arrow-up', css: 'e133'},
                { content: 'glyphicon glyphicon-circle-arrow-down', css: 'e134'},
                { content: 'glyphicon glyphicon-globe', css: 'e135'},
                { content: 'glyphicon glyphicon-wrench', css: 'e136'},
                { content: 'glyphicon glyphicon-tasks', css: 'e137'},
                { content: 'glyphicon glyphicon-filter', css: 'e138'},
                { content: 'glyphicon glyphicon-briefcase', css: 'e139'},
                { content: 'glyphicon glyphicon-fullscreen', css: 'e140'},
                { content: 'glyphicon glyphicon-dashboard', css: 'e141'},
                { content: 'glyphicon glyphicon-paperclip', css: 'e142'},
                { content: 'glyphicon glyphicon-heart-empty', css: 'e143'},
                { content: 'glyphicon glyphicon-link', css: 'e144'},
                { content: 'glyphicon glyphicon-phone', css: 'e145'},
                { content: 'glyphicon glyphicon-pushpin', css: 'e146'},
                { content: 'glyphicon glyphicon-usd', css: 'e148'},
                { content: 'glyphicon glyphicon-gbp', css: 'e149'},
                { content: 'glyphicon glyphicon-sort', css: 'e150'},
                { content: 'glyphicon glyphicon-sort-by-alphabet', css: 'e151'},
                { content: 'glyphicon glyphicon-sort-by-alphabet-alt', css: 'e152'},
                { content: 'glyphicon glyphicon-sort-by-order', css: 'e153'},
                { content: 'glyphicon glyphicon-sort-by-order-alt', css: 'e154'},
                { content: 'glyphicon glyphicon-sort-by-attributes', css: 'e155'},
                { content: 'glyphicon glyphicon-sort-by-attributes-alt', css: 'e156'},
                { content: 'glyphicon glyphicon-unchecked', css: 'e157'},
                { content: 'glyphicon glyphicon-expand', css: 'e158'},
                { content: 'glyphicon glyphicon-collapse-down', css: 'e159'},
                { content: 'glyphicon glyphicon-collapse-up', css: 'e160'},
                { content: 'glyphicon glyphicon-log-in', css: 'e161'},
                { content: 'glyphicon glyphicon-flash', css: 'e162'},
                { content: 'glyphicon glyphicon-log-out', css: 'e163'},
                { content: 'glyphicon glyphicon-new-window', css: 'e164'},
                { content: 'glyphicon glyphicon-record', css: 'e165'},
                { content: 'glyphicon glyphicon-save', css: 'e166'},
                { content: 'glyphicon glyphicon-saved', css: 'e168'},
                { content: 'glyphicon glyphicon-import', css: 'e169'},
                { content: 'glyphicon glyphicon-export', css: 'e170'},
                { content: 'glyphicon glyphicon-send', css: 'e171'},
                { content: 'glyphicon glyphicon-floppy-disk', css: 'e172'},
                { content: 'glyphicon glyphicon-floppy-saved', css: 'e173'},
                { content: 'glyphicon glyphicon-floppy-remove', css: 'e174'},
                { content: 'glyphicon glyphicon-floppy-save', css: 'e175'},
                { content: 'glyphicon glyphicon-floppy-open', css: 'e176'},
                { content: 'glyphicon glyphicon-credit-card', css: 'e177'},
                { content: 'glyphicon glyphicon-transfer', css: 'e178'},
                { content: 'glyphicon glyphicon-cutlery', css: 'e179'},
                { content: 'glyphicon glyphicon-header', css: 'e180'},
                { content: 'glyphicon glyphicon-compressed', css: 'e181'},
                { content: 'glyphicon glyphicon-earphone', css: 'e182'},
                { content: 'glyphicon glyphicon-phone-alt', css: 'e183'},
                { content: 'glyphicon glyphicon-tower', css: 'e184'},
                { content: 'glyphicon glyphicon-stats', css: 'e185'},
                { content: 'glyphicon glyphicon-sd-video', css: 'e186'},
                { content: 'glyphicon glyphicon-hd-video', css: 'e187'},
                { content: 'glyphicon glyphicon-subtitles', css: 'e188'},
                { content: 'glyphicon glyphicon-sound-stereo', css: 'e189'},
                { content: 'glyphicon glyphicon-sound-dolby', css: 'e190'},
                { content: 'glyphicon glyphicon-sound-5-1', css: 'e191'},
                { content: 'glyphicon glyphicon-sound-6-1', css: 'e192'},
                { content: 'glyphicon glyphicon-sound-7-1', css: 'e193'},
                { content: 'glyphicon glyphicon-copyright-mark', css: 'e194'},
                { content: 'glyphicon glyphicon-registration-mark', css: 'e195'},
                { content: 'glyphicon glyphicon-cloud-download', css: 'e197'},
                { content: 'glyphicon glyphicon-cloud-upload', css: 'e198'},
                { content: 'glyphicon glyphicon-tree-conifer', css: 'e199'},
                { content: 'glyphicon glyphicon-tree-deciduous', css: 'e200'},
                { content: 'glyphicon glyphicon-cd', css: 'e201'},
                { content: 'glyphicon glyphicon-save-file', css: 'e202'},
                { content: 'glyphicon glyphicon-open-file', css: 'e203'},
                { content: 'glyphicon glyphicon-level-up', css: 'e204'},
                { content: 'glyphicon glyphicon-copy', css: 'e205'},
                { content: 'glyphicon glyphicon-paste', css: 'e206'},
                { content: 'glyphicon glyphicon-alert', css: 'e209'},
                { content: 'glyphicon glyphicon-equalizer', css: 'e210'},
                { content: 'glyphicon glyphicon-king', css: 'e211'},
                { content: 'glyphicon glyphicon-queen', css: 'e212'},
                { content: 'glyphicon glyphicon-pawn', css: 'e213'},
                { content: 'glyphicon glyphicon-bishop', css: 'e214'},
                { content: 'glyphicon glyphicon-knight', css: 'e215'},
                { content: 'glyphicon glyphicon-baby-formula', css: 'e216'},
                { content: 'glyphicon glyphicon-tent', css: 'g26fa'},
                { content: 'glyphicon glyphicon-blackboard', css: 'e218'},
                { content: 'glyphicon glyphicon-bed', css: 'e219'},
                { content: 'glyphicon glyphicon-apple', css: 'f8ff'},
                { content: 'glyphicon glyphicon-erase', css: 'e221'},
                { content: 'glyphicon glyphicon-hourglass', css: 'g231b'},
                { content: 'glyphicon glyphicon-lamp', css: 'e223'},
                { content: 'glyphicon glyphicon-duplicate', css: 'e224'},
                { content: 'glyphicon glyphicon-piggy-bank', css: 'e225'},
                { content: 'glyphicon glyphicon-scissors', css: 'e226'},
                { content: 'glyphicon glyphicon-bitcoin', css: 'e227'},
                { content: 'glyphicon glyphicon-yen', css: 'g00a5'},
                { content: 'glyphicon glyphicon-ruble', css: 'g20bd'},
                { content: 'glyphicon glyphicon-scale', css: 'e230'},
                { content: 'glyphicon glyphicon-ice-lolly', css: 'e231'},
                { content: 'glyphicon glyphicon-ice-lolly-tasted', css: 'e232'},
                { content: 'glyphicon glyphicon-option-horizontal', css: 'e234'},
                { content: 'glyphicon glyphicon-option-vertical', css: 'e235'},
                { content: 'glyphicon glyphicon-menu-hamburger', css: 'e236'},
                { content: 'glyphicon glyphicon-modal-window', css: 'e237'},
                { content: 'glyphicon glyphicon-oil', css: 'e238'},
                { content: 'glyphicon glyphicon-grain', css: 'e239'},
                { content: 'glyphicon glyphicon-sunglasses', css: 'e240'},
                { content: 'glyphicon glyphicon-text-size', css: 'e241'},
                { content: 'glyphicon glyphicon-text-color', css: 'e242'},
                { content: 'glyphicon glyphicon-text-background', css: 'e243'},
                { content: 'glyphicon glyphicon-object-align-top', css: 'e244'},
                { content: 'glyphicon glyphicon-object-align-bottom', css: 'e245'},
                { content: 'glyphicon glyphicon-object-align-horizontal', css: 'e246'},
                { content: 'glyphicon glyphicon-object-align-left', css: 'e247'},
                { content: 'glyphicon glyphicon-object-align-vertical', css: 'e248'},
                { content: 'glyphicon glyphicon-object-align-right', css: 'e249'},
                { content: 'glyphicon glyphicon-triangle-right', css: 'e250'},
                { content: 'glyphicon glyphicon-triangle-left', css: 'e251'},
                { content: 'glyphicon glyphicon-triangle-bottom', css: 'e252'},
                { content: 'glyphicon glyphicon-triangle-top', css: 'e253'},
                { content: 'glyphicon glyphicon-console', css: 'e254'},
                { content: 'glyphicon glyphicon-superscript', css: 'e255'},
                { content: 'glyphicon glyphicon-subscript', css: 'e256'},
                { content: 'glyphicon glyphicon-menu-left', css: 'e257'},
                { content: 'glyphicon glyphicon-menu-right', css: 'e258'},
                { content: 'glyphicon glyphicon-menu-down', css: 'e259'},
                { content: 'glyphicon glyphicon-menu-up', css: 'e260'},
                { content: 'glyphicon glyphicon-edit', css: 'ee065'},
                { content: 'glyphicon glyphicon-share', css: 'ee066'},
                { content: 'glyphicon glyphicon-ok', css: 'ee013'},
                { content: 'glyphicon glyphicon-education', css: 'ee233'},
                { content: 'fa fa-cogs', css: 'ff085'}
            ]
        })
        taRegisterTool('switchViewContent', {
            display: "<span class='span-switch btn btn-default'>" + "<button class='switch-but' type='button' ng-disabled='isDisabled()' ng-click='action()' title='Preview'><i class='glyphicon glyphicon-search'></i></button>" + "</span>",
            action: function(){
                $('#switchContentView').modal('show');
            }
        });
        taRegisterTool('inlineUl', {
            display: "<span class='span-switch btn btn-default'>" + "<button class='switch-but' type='button' ng-disabled='isDisabled()' ng-click='action($event)' title='Underline on/off'><i class='glyphicon glyphicon-transfer'></i></button>" + "</span>",
            action: function(event){
                if(!!event.stopPropagation){
                    event.stopPropagation();
                    $('body').trigger('click');
                }
                    return this.$editor().wrapSelection(this.name);
            },
        });
        taRegisterTool('uiAce', {
            display: "<span class='select-ui-language'>" +
            "<button title='Add code snippet' class='btn btn-blue dropdown-toggle' type='button' ng-disabled='isDisabled()'><i class='glyphicon glyphicon-file'></i>&nbsp;<i class='fa fa-caret-down'></i></button>" +
            "<ul class='dropdown-menu font-size-style'><li ng-repeat='o in options'><button class='btn btn-blue checked-dropdown' style=' width: 100%' type='button' ng-click='action($event, o.language)'><i class='{{o.class}}'></i>{{o.language}}</button></li></ul></span>",

            action: function(e, attr){
                if(!!event.stopPropagation){
                    event.stopPropagation();
                    $('body').trigger('click');
                }
                return this.$editor().wrapSelection(this.name, attr);
            },
            activeState: function(){ return this.$editor().queryFormatBlockState('pre'); },
            options: [
                { language: 'JAVASCRIPT', class: 'fa fa-code'},
                { language: 'HTML', class: 'fa fa-html5' },
                { language: 'CSS', class: "fa fa-css3"},
            ]
        });
        taRegisterTool('addBorder', {
            display: "<span class='custom-border-inline'>" + "<button title='Underline color' class='btn btn-blue dropdown-toggle' type='button' style='padding-top: 4px'><i class='fa fa-eyedropper'></i>&nbsp;&nbsp;<i class='fa fa-caret-down'></i></button>" + "<ul class='select-list dropdown-menu borderDropStyleC'><li ng-repeat='o in options' class='list-style-cms'><button class='borderStyleC' style='background-color:{{o.color}}' type='button' ng-click='action($event, o)' title='{{o.color}}'></button></li></ul>" + "</span>",
            action: function(event, color){
                if(!!event.stopPropagation){
                    event.stopPropagation();
                    $('body').trigger('click');
                }
                    return this.$editor().wrapSelection(this.$parent.name, color);
            },
            options: [
                { class: 'borderC1', color: '#205081'},
                { class: 'borderC2', color: '#000'},
                { class: 'borderC3', color: '#333'},
                { class: 'borderC4', color: '#666'},
                { class: 'borderC5', color: '#999'},
                { class: 'borderC6', color: '#aaa'},
                { class: 'borderC7', color: '#ccc'},
                { class: 'borderC8', color: '#ddd'},
                { class: 'borderC9', color: '#eee'},
                { class: 'borderC10', color: "rgb(152, 0, 0)"},
                { class: 'borderC11', color: "rgb(255, 0, 0)"},
                { class: 'borderC12', color: "rgb(255, 153, 0)"},
                { class: 'borderC13', color: "rgb(255, 255, 0)"},
                { class: 'borderC14', color: "rgb(0, 255, 0)"},
                { class: 'borderC15', color: "rgb(0, 255, 255)"},
                { class: 'borderC16', color: "rgb(74, 134, 232)"},
                { class: 'borderC17', color: "rgb(0, 0, 255)"},
                { class: 'borderC18', color: "rgb(153, 0, 255)"},
                { class: 'borderC19', color: "rgb(255, 0, 255)"},
                { class: 'borderC20', color: "rgb(230, 184, 175)"},
                { class: 'borderC21', color: "rgb(244, 204, 204)"},
                { class: 'borderC22', color: "rgb(252, 229, 205)"},
                { class: 'borderC23', color: "rgb(255, 242, 204)"},
                { class: 'borderC24', color: "rgb(217, 234, 211)"},
                { class: 'borderC25', color: "rgb(208, 224, 227)"},
                { class: 'borderC26', color: "rgb(201, 218, 248)"},
                { class: 'borderC27', color: "rgb(207, 226, 243)"},
                { class: 'borderC28', color: "rgb(217, 210, 233)"},
                { class: 'borderC29', color: "rgb(234, 209, 220)"},
                { class: 'borderC30', color: "rgb(221, 126, 107)"},
                { class: 'borderC31', color: "rgb(234, 153, 153)"},
                { class: 'borderC32', color: "rgb(249, 203, 156)"},
                { class: 'borderC33', color: "rgb(255, 229, 153)"},
                { class: 'borderC34', color: "rgb(182, 215, 168)"},
                { class: 'borderC35', color: "rgb(162, 196, 201)"},
                { class: 'borderC36', color: "rgb(164, 194, 244)"},
                { class: 'borderC37', color: "rgb(159, 197, 232)"},
                { class: 'borderC38', color: "rgb(180, 167, 214)"},
                { class: 'borderC39', color: "rgb(213, 166, 189)"},
                { class: 'borderC40', color: "rgb(204, 65, 37)"},
                { class: 'borderC41', color: "rgb(224, 102, 102)"},
                { class: 'borderC42', color: "rgb(246, 178, 107)"},
                { class: 'borderC43', color: "rgb(255, 217, 102)"},
                { class: 'borderC44', color: "rgb(147, 196, 125)"},
                { class: 'borderC45', color: "rgb(118, 165, 175)"},
                { class: 'borderC46', color: "rgb(109, 158, 235)"},
                { class: 'borderC47', color: "rgb(111, 168, 220)"},
                { class: 'borderC48', color: "rgb(142, 124, 195)"},
                { class: 'borderC49', color: "rgb(194, 123, 160)"},
                { class: 'borderC50', color: "rgb(166, 28, 0)"},
                { class: 'borderC51', color: "rgb(204, 0, 0)"},
                { class: 'borderC52', color: "rgb(230, 145, 56)"},
                { class: 'borderC53', color: "rgb(241, 194, 50)"},
                { class: 'borderC54', color: "rgb(106, 168, 79)"},
                { class: 'borderC55', color: "rgb(69, 129, 142)"},
                { class: 'borderC56', color: "rgb(60, 120, 216)"},
                { class: 'borderC57', color: "rgb(61, 133, 198)"},
                { class: 'borderC58', color: "rgb(103, 78, 167)"},
                { class: 'borderC59', color: "rgb(166, 77, 121)"},
                { class: 'borderC60', color: "rgb(91, 15, 0)"},
                { class: 'borderC61', color: "rgb(102, 0, 0)"},
                { class: 'borderC62', color: "rgb(120, 63, 4)"},
                { class: 'borderC63', color: "rgb(127, 96, 0)"},
                { class: 'borderC64', color: "rgb(39, 78, 19)"},
                { class: 'borderC65', color: "rgb(12, 52, 61)"},
                { class: 'borderC66', color: "rgb(28, 69, 135)"},
                { class: 'borderC67', color: "rgb(7, 55, 99)"},
                { class: 'borderC68', color: "rgb(32, 18, 77)"},
                { class: 'borderC69', color: "rgb(76, 17, 48)"},
            ]
        });
        taOptions.toolbar[3].push('inlineUl','backgroundColor','fontColor','fontName','fontSize', 'ulCustom', 'addBorder','switchViewContent', 'uiAce');
        return taOptions;
    }])
}])
//Dropdown toggle click directive for text editor
.directive('dropdownToggle', ['$document', '$location', function($document, $location){
    let openElement = null,
    closeMenu = angular.noop;
    return {
        restrict: 'CA',
        link : function (scope, element, attrs) {
            scope.$watch('$location.path', function() { closeMenu(); });
            element.parent().bind('click', function() { closeMenu(); });
            element.bind('click', function(event){
                let elementWasOpen = (element === openElement);
                event.preventDefault();
                event.stopPropagation(); 
                if(!!openElement) {
                    closeMenu();
                }
                if(!elementWasOpen && !element.hasClass('disabled') && !element.prop('disabled')) {
                    element.parent().addClass('open');
                    openElement = element;
                    closeMenu = function(event) {
                        if(event){
                            event.preventDefault();
                            event.stopPropagation();
                        }
                        $document.unbind('click', closeMenu);
                        element.parent().removeClass('open');
                        closeMenu = angular.noop;
                        openElement = null;
                    };
                    $document.bind('click', closeMenu)
                }
            })
        }
    }
}])
//Change event if you add file using <input type="file">
.directive('fileModel', ['$parse', function($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var parsedFile = $parse(attrs.fileModel);
            var parsedFileSetter = parsedFile.assign;
            element.bind('change', function() {
                scope.$apply(function() {
                    parsedFileSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}])
