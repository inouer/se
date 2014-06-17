/**
 * Created with IntelliJ IDEA.
 * User: inoueryouta
 * Date: 13/12/06
 * Time: 15:00
 * To change this template use File | Settings | File Templates.
 */

function WFEPController(){
    // スライドのURL
    this.slideURLs = new Array();

    // user id
    this.userID;

    // current slide
    this.cslide = 0;

    // アノテーションの配列
    this.annotations = new Array();

    // スライドのサイズ
    this.slidesizeW;
    this.slidesizeH;
    // デフォルトのサイズ（初期値）
    this.origSlideSizeW;
    this.origSlideSizeH;

    // ウインドウサイズの違いを吸収する倍率
    this.scaleX=1;
    this.scaleY=1;

    // ポインタのサイズ
    this.pointerSize = 64;

    // アノテーションのドラッグ中か否か
    this.annotationDragging = false;

    // ポインタの番号
    this.pointerNumber = 0;

    // ポインタの画像のURL（決め打ち）
    this.pointers = {
        0:"black.png",
        1:"white.png",
        2:"red.png",
        3:"green.png",
        4:"blue.png"
    };

    // ポインタの削除タイマー
    this.pointerTimer;

    // ポインタの送信間隔タイマー
    this.pointerIntervalTimer;

    // タッチイベント
    this.touchStartX;
    this.touchEndX;

    // ユーザーエージェント
    this.UA;

    // 同期オンオフの状態
    this.syncState = true;
};

WFEPController.prototype.init = function(){
    // user id
    this.userID = window.wfepcontroller.makeRandobet(128);

    // ユーザーエージェント
    window.wfepcontroller.getUA();

    // テスト用
    window.wfepcontroller.slideURLs.push("./img/test/01.jpg");
    window.wfepcontroller.slideURLs.push("./img/test/02.jpg");
    window.wfepcontroller.slideURLs.push("./img/test/03.jpg");
    window.wfepcontroller.slideURLs.push("./img/test/04.jpg");
    window.wfepcontroller.slideURLs.push("./img/test/05.jpg");
    window.wfepcontroller.jumpSlide(1);

    var timer = false;
    $(window)
        .on("beforeunload",function(e){
            // サーバーから切断
            MWClient.bye();
        })
        .resize(function() {
            // リサイズ操作が終わった時のみリロード
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(function() {
//                $('#realtimeCanvas')
//                    .css({
//                        left:$("#slideContainer").find(":first-child").offset().left
//                    });
//                $('#slideController')
//                    .css({
//                        left:$("#slideContainer").find(":first-child").offset().left
//                    });

                // モバイルのブラウザでは無視
                if(window.wfepcontroller.isMobile()){
                }else{
                    location.reload();
                }
            }, 200);
        })
        .keydown(function(e){
            // ページめくり
            if(e.keyCode == 37){
                window.wfepcontroller.jumpSlide(window.wfepcontroller.cslide-1);
                return false;
            } else if (e.keyCode == 39){
                window.wfepcontroller.jumpSlide(window.wfepcontroller.cslide+1);
                return false;
            }
        });

    // 矢印の動作
    $('#leftArrow')
        .off()
        .on('click', function(){
            window.wfepcontroller.jumpSlide(window.wfepcontroller.cslide-1);
        });
    $('#rightArrow')
        .off()
        .on('click', function(){
            window.wfepcontroller.jumpSlide(window.wfepcontroller.cslide+1);
        });

    // スライダー
    $('#pageSlider')
        .slider({
            range:"min",
            value: 1,
            min: 1,
            max: window.wfepcontroller.slideURLs.length,
            step: 1,
            slide: function(e, ui) {
                window.wfepcontroller.jumpSlide(ui.value);
            }
        });

    // 同期オンオフスイッチ
    $('#syncSwitch')
        .bootstrapSwitch()
        .on('switchChange',function(e, data){
            window.wfepcontroller.syncState = data.value;
        });

    // スライドのサイズ
//    this.slidesizeH = $("#slideContainer").find(":first-child").height();
    this.slidesizeH = $(window).height() - $('#bottomBar').height();
    this.slidesizeW = this.slidesizeH*4/3;
    $('#slideContainer')
        .css({
            height: this.slidesizeH,
            width: this.slidesizeW
        });
    this.origSlideSizeW = this.slidesizeW;
    this.origSlideSizeH = this.slidesizeH;

    // スライド操作のためのイベント付加
    var longClickTimer;
    var pointerFlag = false;
    $('#slideController')
        .css({
            left:$("#slideContainer").find(":first-child").offset().left,
            height:this.slidesizeH,
            width:this.slidesizeW
        })
        .off()
        .on('contextmenu',function(e, ui){
            // スライド上での右クリック
            window.wfepcontroller.openContextMenu(e);

            return false;
        })
        .on('mousedown',function(e,ui){
            // スライド上でのクリック
            $('.contextMenu')
                .hide();

            if(e.which==1 && !window.wfepcontroller.annotationDragging){
                // 長押し判定でポインタ表示
                longClickTimer = setTimeout(function(){
                    pointerFlag = true;

                    $('#realtimeLayer')
                        .css({
                            cursor:"url('./img/pointer/"+window.wfepcontroller.pointers[window.wfepcontroller.pointerNumber]+"'), default"
                        })
                        .show();

                    window.wfepcontroller.pointerMove(e);
                },500);
            }

            return false;
        })
        .on('mouseup mouseout', function(e, ui){
            clearTimeout(longClickTimer);
        })
        // タッチイベント系
        .on('touchstart', function(e, ui){
            e.preventDefault();

            window.wfepcontroller.touchStartX = e.originalEvent.targetTouches[0].pageX;

            if(!window.wfepcontroller.annotationDragging){
                // 長押し判定でポインタ表示
                longClickTimer = setTimeout(function(){
                    pointerFlag = true;

                    $('<img/>')
                        .attr({
                            id: "myPointer",
                            src:"./img/pointer/"+window.wfepcontroller.pointers[window.wfepcontroller.pointerNumber]
                        })
                        .appendTo($('body'));

                    window.wfepcontroller.pointerMove(e);
                },1000);
            }
        })
        .on('touchmove',function(e, ui){
            e.preventDefault();

            if(pointerFlag){
                $('#myPointer')
                    .css({
                        left: e.originalEvent.targetTouches[0].pageX-window.wfepcontroller.pointerSize/2,
                        top: e.originalEvent.targetTouches[0].pageY-window.wfepcontroller.pointerSize-20,
                        width:window.wfepcontroller.pointerSize,
                        height:window.wfepcontroller.pointerSize
                    });

                window.wfepcontroller.pointerMove(e);
            }

            window.wfepcontroller.touchEndX = e.originalEvent.targetTouches[0].pageX;
        })
        .on('touchend', function(e, ui){
//            e.preventDefault();

            clearTimeout(longClickTimer);


            if(pointerFlag){
                $('#myPointer').remove();
                pointerFlag = false;

                window.wfepcontroller.pointerMove(e,true);
            }else{
                // フリック
                if(window.wfepcontroller.touchStartX != null && window.wfepcontroller.touchEndX != null){
                    var diff = window.wfepcontroller.touchEndX - window.wfepcontroller.touchStartX;
                    console.log(diff);
                    if(Math.abs(diff) >= 50){
                        if(diff>0){
                            window.wfepcontroller.jumpSlide(window.wfepcontroller.cslide-1);
                        }else{
                            window.wfepcontroller.jumpSlide(window.wfepcontroller.cslide+1);
                        }
                    };
                    window.wfepcontroller.touchStartX = null;
                    window.wfepcontroller.touchEndX = null;
                }
            }
        })
        .on('gesturechange', function(e){
            // ポインタを消す
            $('#myPointer').remove();
            pointerFlag = false;

            //拡大縮小倍率
            var scale = e.originalEvent.scale;

            // 中央座標
            var position = {
                left: e.originalEvent.layerX,
                top: e.originalEvent.layerY
            }

            //拡大縮小
            $('#slideContainer')
                .css({
                    zoom: scale
                });
        })
        .on('gestureend',function(e){
            var scale = e.originalEvent.scale;

            if($('#slideContainer').width()*scale<window.wfepcontroller.origSlideSizeW || $('#slideContainer').height()*scale<window.wfepcontroller.origSlideSizeH){
                scale = 1;
            }

            $('#slideContainer')
                .css({
                    width:$('#slideContainer').width()*scale+"px",
                    height:$('#slideContainer').height()*scale+"px",
                    zoom:1
                });
            window.wfepcontroller.slidesizeW = $('#slideContainer').width()*scale;
            window.wfepcontroller.slidesizeH = $('#slideContainer').height()*scale;
        });

    // リアルタイムレイヤー
    $('#realtimeLayer')
        .css({
            left:$("#slideContainer").find(":first-child").offset().left,
            height:this.slidesizeH,
            width:this.slidesizeW
        })
        .on('mouseup mouseout', function(e, ui){
            e.preventDefault();

            clearTimeout(longClickTimer);

            if(pointerFlag){
                $(this)
                    .css({
                        cursor:"default"
                    })
                    .hide();

                pointerFlag = false;

                // 終了を通知
                window.wfepcontroller.pointerMove(e,true);
            }
        })
        .on('mousemove', function(e, ui){
            e.preventDefault();

            if(pointerFlag){
                window.wfepcontroller.pointerMove(e);
            }
        });

//    $('body')
//        .on('click touchend', function(){
//            window.wfepcontroller.toggleFullScreen($('body'));
//        });
}

WFEPController.prototype.openContextMenu = function(e){
    this.openTextMenu(e);
}

WFEPController.prototype.closeContextMenu = function(){
    // 他のウインドウを閉じる
    $('.contextMenu')
        .hide();
}

WFEPController.prototype.openTextMenu = function(e){
    this.closeContextMenu();

    // 削除ボタンの表示非表示
    var removeButtonFlag = false;

    var annotationPosition = {
        left: e.offsetX,
        top: e.offsetY
    };

    // 初期値
    var initVal = {
        id:window.wfepcontroller.makeRandobet(64),
        text:"",
        fontsize:"16",
        fontcolor:"#000000",
        backgroundcolor:"#ffffff",
        left:annotationPosition.left,
        top:annotationPosition.top
    };

    // アノテーションの編集の場合
    if($(e.target).hasClass("annotations")){
        removeButtonFlag = true;

        initVal = {
            id:$(e.target).attr('id'),
            text:$(e.target).html(),
            fontsize:window.wfepcontroller.getFontSize(e.target),
            fontcolor:$(e.target).css('color'),
            backgroundcolor:$(e.target).css('background-color'),
            left:$(e.target).position().left,
            top:$(e.target).position().top
        }
    }

    $("#annotationInput")
        .css({
            "font-size":initVal.fontsize+"px",
            color:initVal.fontcolor,
            "background-color":initVal.backgroundcolor
        })
        .val(initVal.text);

    $('#annotationFontSize')
        .val(initVal.fontsize)
        .off()
        .on('change',function(){
            $('#annotationInput')
                .css({
                    "font-size": $('#annotationFontSize').val()+"px"
                });
        });

    $('#annotationFontColor')
        .spectrum({
            color: initVal.fontcolor
        })
        .val(initVal.fontcolor)
        .off()
        .on('change',function(){
            $('#annotationInput')
                .css({
                    "color": $('#annotationFontColor').val()
                });
        });

    $('#annotationBackgroundColor')
        .spectrum({
            color: initVal.backgroundcolor
        })
        .val(initVal.backgroundcolor)
        .off()
        .on('change',function(){
            $('#annotationInput')
                .css({
                    "background-color": $('#annotationBackgroundColor').val()
                });
        });

    $('#annotationSubmit')
        .off()
        .on('click',function(e, ui){
            if($('#annotationInput').val()==""){
                alert('コメントを入力して下さい');
                return;
            }

            // メッセージ送信
            // msg: メッセージ本文
            // to: 送信先(アスタリスクを指定すればOK)
            // group: 送信先グループ(null を入れるか省略すればすべてのグループ)
            var msg = {
                type: "cmt_slide",
                cslide: window.wfepcontroller.cslide,
                left: window.wfepcontroller.scaleTo(initVal.left,window.wfepcontroller.slidesizeW,1),
                top: window.wfepcontroller.scaleTo(initVal.top,window.wfepcontroller.slidesizeH,1),
//                img_width: $('#slideController').width(),
//                img_height: $('#slideController').height(),
                size: $('#annotationFontSize').val(),
                color: $('#annotationFontColor').val(),
                backgroundcolor: $('#annotationBackgroundColor').val(),
                text: $('<div>').html($('#annotationInput').val()).text(),
                id: initVal.id
            };

            window.wfepcontroller.manipulateAnnotation(msg);

            // 配列に追加
            window.wfepcontroller.annotations.push(msg);

            msg.width = window.wfepcontroller.scaleTo($('#'+initVal.id).width(),window.wfepcontroller.slidesizeW,1);
            //msg.width = $('#'+initVal.id).width();
            msg.left = window.wfepcontroller.scaleTo(initVal.left,window.wfepcontroller.slidesizeW,1);
            msg.top = window.wfepcontroller.scaleTo(initVal.top,window.wfepcontroller.slidesizeH,1);

            window.mickrmanager.sendMickr(msg);

            window.wfepcontroller.closeContextMenu();
        });

    // 削除ボタンの表示非表示
//    if(removeButtonFlag){
//        $('#annotationRemove')
//            .off()
//            .on('click',function(e, ui){
//                $('#'+initVal.id)
//                    .remove();
//
//                $.each(window.wfepcontroller.annotations,function(i, v){
//                    if(this.id==initVal.id){
//                        window.wfepcontroller.annotations.splice(i,1);
//                    }
//                });
//            })
//            .show();
//    }else{
//        $('#annotationRemove')
//            .hide();
//    }

    $('#textMenu')
        .css({
            left: e.pageX,
            top: e.pageY
        })
        .show();
}

// 自分のポインタを通知
WFEPController.prototype.pointerMove = function(e, end){
    // 30ms毎に送信
    if(typeof window.wfepcontroller.pointerIntervalTimer == "undefined" || end){
        clearTimeout(window.wfepcontroller.pointerIntervalTimer);
        window.wfepcontroller.pointerIntervalTimer = setTimeout(function(){
            window.wfepcontroller.pointerIntervalTimer = undefined;
        },30);
    }else{
        return;
    }

    var pointerLeft;
    var pointerTop;

    if(end){
        pointerLeft = 0;
        pointerTop = 0;
    }
    else if(this.isMobile()){
        pointerLeft = e.originalEvent.targetTouches[0].pageX-e.originalEvent.targetTouches[0].target.offsetLeft;
        pointerTop = (e.originalEvent.targetTouches[0].pageY-e.originalEvent.targetTouches[0].target.offsetTop)-this.pointerSize+15;
    }else{
        pointerLeft = e.offsetX+this.pointerSize/2;
        pointerTop = e.offsetY+this.pointerSize/2;
    }

    var msg = {
        type: "pointer",
        cslide: window.wfepcontroller.cslide,
        left: window.wfepcontroller.scaleTo(pointerLeft,window.wfepcontroller.slidesizeW,1),
        top: window.wfepcontroller.scaleTo(pointerTop,window.wfepcontroller.slidesizeH,1),
//        img_width: $('#slideController').width(),
//        img_height: $('#slideController').height(),
        color: window.wfepcontroller.pointerNumber,
        id: window.wfepcontroller.userID
    };
    window.mickrmanager.sendMickr(msg);
}

// 他のクライアントからのポインタ表示
WFEPController.prototype.showPointer = function(pointerInfo){
    if(pointerInfo.id == window.wfepcontroller.userID) return;
    if(pointerInfo.cslide != window.wfepcontroller.cslide) return;

    // 調整
    pointerInfo.left = window.wfepcontroller.scaleTo(pointerInfo.left,1,window.wfepcontroller.slidesizeW);
    pointerInfo.top = window.wfepcontroller.scaleTo(pointerInfo.top,1,window.wfepcontroller.slidesizeH);

//    console.log($('#pointer-'+pointerInfo.id).length);

    if($('#pointer-'+pointerInfo.id).length==0){
        $('<img/>')
            .attr({
                id: "pointer-"+pointerInfo.id,
                class:"pointer",
                src:"./img/pointer/"+window.wfepcontroller.pointers[pointerInfo.color]
            })
            .css({
                left:pointerInfo.left-window.wfepcontroller.pointerSize/2,
                top:pointerInfo.top-window.wfepcontroller.pointerSize/2,
                width:window.wfepcontroller.pointerSize,
                height:window.wfepcontroller.pointerSize
            })
            .appendTo($('#slideController'));
    }else{
        if(pointerInfo.left<0){
            $('#pointer-'+pointerInfo.id).remove();
        }else{
            $('#pointer-'+pointerInfo.id)
                .css({
                    left:pointerInfo.left-window.wfepcontroller.pointerSize/2,
                    top:pointerInfo.top-window.wfepcontroller.pointerSize/2
                });
        }
    }
}

WFEPController.prototype.manipulateAnnotation = function(annotationInfo){
    // 調整
    if(annotationInfo.left < 1) {
        annotationInfo.left = window.wfepcontroller.scaleTo(annotationInfo.left,1,window.wfepcontroller.slidesizeW);
        annotationInfo.top = window.wfepcontroller.scaleTo(annotationInfo.top,1,window.wfepcontroller.slidesizeH);
    }

    if($('#'+annotationInfo.id).length==0){
        // アノテーションの生成
        var $div = $('<div/>');
        $div
            .attr({
                id:annotationInfo.id,
                class:"annotations"
            })
            .css({
                position:"absolute",
                left:annotationInfo.left,
                top:annotationInfo.top,
                color:annotationInfo.color,
                "background-color":annotationInfo.backgroundcolor,
                "font-size":annotationInfo.size+"px",
                "date-slide":annotationInfo.slide
            })
            .html($('<div>').html(annotationInfo.text).text())
            .draggable({
                containment:"#slideController",
                start:function(e, ui){
                    window.wfepcontroller.annotationDragging = true;

                    var msg = {
                        type: "cmt_movestart",
                        left: window.wfepcontroller.scaleTo(ui.position.left,window.wfepcontroller.slidesizeW,1),
                        top: window.wfepcontroller.scaleTo(ui.position.top,window.wfepcontroller.slidesizeH,1),
//                        img_width: $('#slideController').width(),
//                        img_height: $('#slideController').height()
                    };
                    window.mickrmanager.sendMickr(msg);
                },
                drag:function(e,ui){
                    window.wfepcontroller.annotationDragging = true;

                    var msg = {
                        type: "cmt_moving",
                        cslide: window.wfepcontroller.cslide,
                        left: window.wfepcontroller.scaleTo(ui.position.left,window.wfepcontroller.slidesizeW,1),
                        top: window.wfepcontroller.scaleTo(ui.position.top,window.wfepcontroller.slidesizeH,1),
//                        img_width: $('#slideController').width(),
//                        img_height: $('#slideController').height()
                        size: $(e.target).css("font-size"),
                        color: $(e.target).css("color"),
                        backgroundcolor: $(e.target).css("background-color"),
                        text: $(e.target).html(),
                        id: $(e.target).attr("id")
                    };
                    window.mickrmanager.sendMickr(msg);
                },
                stop:function(e, ui){
//                    console.log(e);
//                    console.log(ui);

                    window.wfepcontroller.annotationDragging = false;

                    var msg = {
                        type: "cmt_moveend",
                        cslide: window.wfepcontroller.cslide,
                        left: window.wfepcontroller.scaleTo(ui.position.left,window.wfepcontroller.slidesizeW,1),
                        top: window.wfepcontroller.scaleTo(ui.position.top,window.wfepcontroller.slidesizeH,1),
//                        img_width: $('#slideController').width(),
//                        img_height: $('#slideController').height()
                        size: $(e.target).css("font-size"),
                        color: $(e.target).css("color"),
                        backgroundcolor: $(e.target).css("background-color"),
                        text: $(e.target).html(),
                        id: $(e.target).attr("id")
                    };
                    window.mickrmanager.sendMickr(msg);
                }
            })
            .on('contextmenu',function(e, ui){
                window.wfepcontroller.openContextMenu(e);

                return false;
            })
            .appendTo($('#slideController'));
    }else{
        // 既存アノテーションの編集
        $('#'+annotationInfo.id)
            .css({
                position:"absolute",
                left:annotationInfo.left,
                top:annotationInfo.top,
                color:annotationInfo.color,
                "background-color":annotationInfo.backgroundcolor,
                "font-size":annotationInfo.size+"px"
            })
            .html($('<div>').html(annotationInfo.text).text());
    }
};

// スライド遷移
WFEPController.prototype.jumpSlide = function(index){
    index = parseInt(index);

    // 範囲外のものが指定された場合は無視
    if(index<=0 || index>window.wfepcontroller.slideURLs.length) return;

    // コメント入力中，あるいは，アノテーション付加中は無視
    if($('#commentInput').is(':focus') || $(".contextMenu").css('display') != 'none') return;

    // cslide記憶
    window.wfepcontroller.cslide = index;

    // スライダー
    $('#pageSlider')
        .slider({
            value:window.wfepcontroller.cslide
        });

    // 調整
    index -= 1;

    // アノテーション削除
    $('.annotations').remove();

    // ポインタ削除
    $('.pointer').remove();

    // 遷移
    if(index==null){
        $('#slideImage')
            .attr({
                src:"./img/default.png"
            });
    }else{
        try{
            $('#slideImage')
                .attr({
                    src:window.wfepcontroller.slideURLs[index]
                });

            $.each(window.wfepcontroller.annotations,function(){
                if(window.wfepcontroller.cslide==this.cslide){
                    window.wfepcontroller.manipulateAnnotation(this);
                }
            });
        }catch (e){
            console.log(e);
        }
    }
}

//ランダム文字列生成
WFEPController.prototype.makeRandobet = function(n, b) {
    b = b || '';
    var a = 'abcdefghijklmnopqrstuvwxyz'
        + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        + '0123456789'
        + b;
    a = a.split('');
    var s = '';
    for (var i = 0; i < n; i++) {
        s += a[Math.floor(Math.random() * a.length)];
    }
    return s;
};

// フォントサイズを計測する関数
WFEPController.prototype.getFontSize = function(target){
    var div = $('<div style="display:none;font-size:1em;margin:0;padding:0;height:auto;line-height:1;border:0;">&nbsp;</div>');
    var size = div.appendTo(target).height();
    div.remove();
    return size;
}

// 座標の調整
WFEPController.prototype.scaleTo = function(value, source, dest){
    return ((value*dest)/source);
}

WFEPController.prototype.getUA = function(){
    var uaName = 'unknown';
    var userAgent = window.navigator.userAgent.toLowerCase();
    var appVersion = window.navigator.appVersion.toLowerCase();

    if (userAgent.indexOf('msie') != -1) {
        uaName = 'ie';
        if (appVersion.indexOf('msie 6.') != -1) {
            uaName = 'ie6';
        } else if (appVersion.indexOf('msie 7.') != -1) {
            uaName = 'ie7';
        } else if (appVersion.indexOf('msie 8.') != -1) {
            uaName = 'ie8';
        } else if (appVersion.indexOf('msie 9.') != -1) {
            uaName = 'ie9';
        } else if (appVersion.indexOf('msie 10.') != -1) {
            uaName = 'ie10';
        }
    } else if (userAgent.indexOf('android') != -1) {
        uaName = 'android';
    } else if (userAgent.indexOf('ipad') != -1) {
        uaName = 'ipad';
    } else if (userAgent.indexOf('ipod') != -1) {
        uaName = 'ipod';
    } else if (userAgent.indexOf('iphone') != -1) {
        uaName = 'iphone';
//        var ios = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
//        uaName = [parseInt(ios[1], 10), parseInt(ios[2], 10), parseInt(ios[3] || 0, 10)];
    } else if (userAgent.indexOf('safari') != -1) {
        uaName = 'safari';
    } else if (userAgent.indexOf('chrome') != -1) {
        uaName = 'chrome';
    } else if (userAgent.indexOf('gecko') != -1) {
        uaName = 'gecko';
    } else if (userAgent.indexOf('opera') != -1) {
        uaName = 'opera';
    } else if (userAgent.indexOf('mobile') != -1) {
        uaName = 'mobile';
    };

    window.wfepcontroller.UA = uaName;
}

WFEPController.prototype.isMobile = function(){
    if(window.wfepcontroller.UA == "iphone" || window.wfepcontroller.UA == "ipad" || window.wfepcontroller.UA == "android"){
        return true;
    }else{
        return false;
    }
}

WFEPController.prototype.toggleFullScreen = function(target){
    $(target)
        .css({
            width:"100%",
            height:"100%"
        });

    var elem = $(target)[0];
    if((document.fullScreenElement && document.fullScreenElement !== null) || (!document.mozFullScreen && !document.webkitIsFullScreen)){
        if (elem.requestFullScreen) {
            elem.requestFullScreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullScreen) {
            elem.webkitRequestFullScreen();
        }
    }else{
        if (document.cancelFullScreen) {
            document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }
    }
}

// コメント送信関係
function CommentController(){};

CommentController.prototype.init = function(){
    $('#commentSubmit')
        .on('click',function(){
            // コメントが入力されていない時
            if($('#commentInput').val()==""){
                alert("no text");
                return;
            };

            var msg = {
                type: "cmt_embed",
                cslide: window.wfepcontroller.cslide,
                text: $('#commentInput').val()
            };
            window.mickrmanager.sendMickr(msg);

            window.commentcontroller.clearComment();

            $('#commentWindow')
                .modal('hide');
        });

    $('#commentButton')
        .on('click',function(){
            $('#commentWindow')
                .modal();
        });
}

CommentController.prototype.clearComment = function(){
    $('#commentInput').val('');
}

// Mickrサーバの利用
function MickrManager(){
    this.token = "default";
};

MickrManager.prototype.init = function(){
    $('#tokenWindow')
        .modal();

    $('#tokenSubmit')
        .on('click',function(){
            if($('#tokenInput').val() != ""){
                window.mickrmanager.token = $('#tokenInput').val();
            }

            $('#tokenWindow')
                .modal('hide');

            window.mickrmanager.clientInit();
        });
}

MickrManager.prototype.clientInit = function(){
    // optional
    MWClient.application = "wfe-p"; // アプリケーション名
    MWClient.group = this.token; // クライアントのグループ名

    // サーバーへ接続
    MWClient.hello("ws://apps.wisdomweb.net:19281/");

    // メッセージを受け取った時のリスナ
    MWClient.onHello = function(res) {
        // Hello が完了した後に実行される

        // 接続中のクライアント数をカウント（ポインタのため）
        var msg = {
            type: "count_clients",
            userid: window.wfepcontroller.userID,
            response: false
        };
        window.mickrmanager.sendMickr(msg);

        // スライド画像のURL取得
        var msg = {
            type: "get_imgurls"
        };
        window.mickrmanager.sendMickr(msg);
    }
    MWClient.onBye = function(res) {
        // Bye が完了した後に実行される
    }
    MWClient.onSendEnd = function(res) {
        // こちらからのメッセージの送信が成功したら実行される
    }
    MWClient.onReceiveMsg = function(res) {
        // 他のクライアントからメッセージを受信したら実行される
        // res.body.message に、上記の msg が入る

        var msg = res.body.message;
//        console.log(msg);

        switch(msg.type){
            case "post_imgurls":
                // スライドのURL群
                window.wfepcontroller.slideURLs = msg.url.split(/;;/);

                // スライダーの設定
                $('#pageSlider')
                    .slider({
                        range:"min",
                        value: msg.cslide,
                        min: 1,
                        max: window.wfepcontroller.slideURLs.length,
                        step: 1,
                        slide: function(e, ui) {
                            window.wfepcontroller.jumpSlide(ui.value);
                        }
                    });

                window.wfepcontroller.jumpSlide(msg.cslide);

                break;
            case "cmt_slide":
                window.wfepcontroller.manipulateAnnotation(msg);
                break;
            case "cmt_moveend":
                window.wfepcontroller.manipulateAnnotation(msg);
                break;
            case "cmt_moving":
                window.wfepcontroller.manipulateAnnotation(msg);
                break;
            case "pointer":
                clearTimeout(window.wfepcontroller.pointerTimer);
                window.wfepcontroller.pointerTimer = setTimeout(function(){
                    $('.pointer').remove();
                },1000);

                // 同期オフのときは無視
                if(window.wfepcontroller.syncState){
                    window.wfepcontroller.showPointer(msg);
                }

                break;
            case "cmt_embed":

                break;
            case "ssbegin":
                // スライドのURL群
                window.wfepcontroller.slideURLs = msg.url.split(/;;/);

                window.wfepcontroller.jumpSlide(msg.cslide);

                break;
            case "ssnext":
                // 同期オフのときは無視
                if(window.wfepcontroller.syncState){
                    window.wfepcontroller.jumpSlide(msg.cslide);
                }

                break;
            case "ssend":
                window.wfepcontroller.jumpSlide(null);

                break;
            case "updateimg":
                window.wfepcontroller.slideURLs[msg.cslide-1] = msg.url;
                window.wfepcontroller.jumpSlide(msg.cslide);

                break;
            case "count_clients":
                // 接続中のクライアントのカウント
                if(msg.response){
                    do{
                        if(msg.userid==window.wfepcontroller.userID){
                            window.wfepcontroller.pointerNumber++;
                            window.wfepcontroller.pointerNumber%=4;
                        }
                    }while(window.wfepcontroller.pointerNumber==1);
                }else{
                    var resmsg = {
                        type: "count_clients",
                        userid:msg.userid,
                        response:true
                    };
                    window.mickrmanager.sendMickr(resmsg);
                }

                break;
            default : break;
        }
    }
}

MickrManager.prototype.sendMickr = function(msg){
    var to = "*";
    var group = this.token;
    MWClient.send(msg, to, group);
}

$(function() {
    window.mickrmanager = new MickrManager;
    window.mickrmanager.init();

    window.wfepcontroller = new WFEPController;
    window.wfepcontroller.init();

    window.commentcontroller = new CommentController;
    window.commentcontroller.init();
})