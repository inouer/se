/**
 * Created with IntelliJ IDEA.
 * User: inoueryouta
 * Date: 13/12/06
 * Time: 15:00
 * To change this template use File | Settings | File Templates.
 */

function WFEPController(){
    // user id
    this.userID;

    // current slide
    this.cslide;

    // アノテーションの配列
    this.annotations = new Array();

    // スライドのサイズ
    this.slidesizeW;
    this.slidesizeH;

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
        1:"red.png",
        2:"green.png",
        3:"blue.png"
    };
};

WFEPController.prototype.init = function(){
    // user id
    this.userID = window.wfepcontroller.makeRandobet(128);

    var timer = false;
    $(window)
        .on("beforeunload",function(e){
            // サーバーから切断
            MWClient.bye();
        })
        .resize(function() {
            // リサイズ操作が終わった時のみ調整を実行
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(function() {
                $('#realtimeCanvas')
                    .css({
                        left:$("#slideContainer").find(":first-child").offset().left
                    });


                $('#slideController')
                    .css({
                        left:$("#slideContainer").find(":first-child").offset().left
                    });
            }, 200);
        });

    // スライドのサイズ
    this.slidesizeW = $("#slideContainer").find(":first-child").width();
    this.slidesizeH = $("#slideContainer").find(":first-child").height()

    // スライド操作のためのイベント付加
    var longClickTimer;
    var pointerFlag = false;
    $('#slideController')
        .css({
            left:$("#slideContainer").find(":first-child").offset().left
        })
        .off()
        .on('contextmenu',function(e, ui){
            window.wfepcontroller.openContextMenu(e);

            return false;
        })
        .on('mousedown',function(e,ui){
            $('.contextMenu')
                .hide();

            if(e.which==1 && !window.wfepcontroller.annotationDragging){
                longClickTimer = setTimeout(function(){
                    pointerFlag = true;

//                    var ctx = $('#realtimeCanvas')[0].getContext('2d');
//                    ctx.beginPath();
//                    /* グラデーション領域をセット */
//                    var grad  = ctx.createRadialGradient(e.offsetX, e.offsetY, 4, e.offsetX, e.offsetY, 5);
//                    /* グラデーション終点のオフセットと色をセット */
//                    grad.addColorStop(0,'rgba(255,255,255,0)');
//                    grad.addColorStop(1,'red');
//                    /* グラデーションをfillStyleプロパティにセット */
//                    ctx.fillStyle = grad;
//                    /* 矩形を描画 */
//                    ctx.arc(e.offsetX, e.offsetY, 10, 0, Math.PI*2, false)
//                    ctx.fill();

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
        });

    // リアルタイムレイヤー
    $('#realtimeLayer')
        .css({
            left:$("#slideContainer").find(":first-child").offset().left
        })
        .on('mouseup mouseout', function(e, ui){
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
            if(pointerFlag){
                window.wfepcontroller.pointerMove(e);
            }
        });

    // contextMenu.js を使う場合
//    var menu = [{
//        name: 'Text',
//        img: './img/pen.png',
//        title: 'text button',
//        fun: function () {
//            window.wfepcontroller.createText();
//        }
//    }];
//    $('#slideController').contextMenu(menu,{triggerOn:'contextmenu'});
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
                left: initVal.left,
                top: initVal.top,
                img_width: $('#slideController').width(),
                img_height: $('#slideController').height(),
                size: $('#annotationFontSize').val(),
                color: $('#annotationFontColor').val(),
                backgroundcolor: $('#annotationBackgroundColor').val(),
                text: $('<div>').html($('#annotationInput').val()).text(),
                id: initVal.id
            };

            window.wfepcontroller.manipulateAnnotation(msg);

            // 配列に追加
            window.wfepcontroller.annotations.push(msg);

            msg.width = $('#'+initVal.id).width();

            var to = "*";
            var group = "default";
            MWClient.send(msg, to, group);

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

WFEPController.prototype.pointerMove = function(e, end){
    var pointerLeft = e.offsetX+this.pointerSize/2;
    var pointerTop = e.offsetY+this.pointerSize/2;
    if(end){
        pointerLeft = -1;
        pointerTop = -1;
    }

    var msg = {
        type: "pointer",
        left: pointerLeft,
        top: pointerTop,
        img_width: $('#slideController').width(),
        img_height: $('#slideController').height(),
        color: window.wfepcontroller.pointerNumber,
        id: window.wfepcontroller.userID
    };
    var to = "*";
    var group = "default";
    MWClient.send(msg, to, group);
}

WFEPController.prototype.showPointer = function(pointerInfo){
    if(pointerInfo.id == window.wfepcontroller.userID) return;

    // 調整
//    pointerInfo.left *= window.wfepcontroller.scaleX;
//    pointerInfo.top *= window.wfepcontroller.scaleY;

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
                width:window.wfepcontroller.pointerSize*window.wfepcontroller.scaleX,
                height:window.wfepcontroller.pointerSize*window.wfepcontroller.scaleY
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
//    annotationInfo.left *= window.wfepcontroller.scaleX;
//    annotationInfo.top *= window.wfepcontroller.scaleY;
//    annotationInfo.size = parseInt(annotationInfo.size)*(window.wfepcontroller.scaleX*window.wfepcontroller.scaleY);

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
                        left: ui.position.left,
                        top: ui.position.top,
                        img_width: $('#slideController').width(),
                        img_height: $('#slideController').height()
                    };
                    var to = "*";
                    var group = "default";
                    MWClient.send(msg, to, group);
                },
                drag:function(e,ui){
                    window.wfepcontroller.annotationDragging = true;
//                    var annotationInfo = {
//                        id:$(e.target).attr("id"),
//                        slide:$(e.target).attr("data-slide"),
//                        text: $(e.target).html(),
//                        size: $(e.target).css("font-size"),
//                        color: $(e.target).css("color"),
//                        backgroundcolor: $(e.target).css("background-color"),
//                        left: ui.position.left,
//                        top: ui.position.top
//                    };
//
//                    var msg = {
//                        type: "cmt_slide",
//                        cslide: window.wfepcontroller.cslide,
//                        left: ui.position.left,
//                        top: ui.position.top,
//                        img_width: $('#slideController').width(),
//                        img_height: $('#slideController').height(),
//                        size: $('#annotationFontSize').val(),
//                        color: $('#annotationFontColor').val(),
//                        backgroundcolor: $('#annotationBackgroundColor').val(),
//                        text: $('#annotationInput').val(),
//                        annotationInfo:annotationInfo
//                    };
//                    var to = "*";
//                    var group = "default";
//                    MWClient.send(msg, to, group);

                    var msg = {
                        type: "cmt_moving",
                        cslide: window.wfepcontroller.cslide,
                        left: ui.position.left,
                        top: ui.position.top,
                        img_width: $('#slideController').width(),
                        img_height: $('#slideController').height(),
                        size: $(e.target).css("font-size"),
                        color: $(e.target).css("color"),
                        backgroundcolor: $(e.target).css("background-color"),
                        text: $(e.target).html(),
                        id: $(e.target).attr("id")
                    };
                    var to = "*";
                    var group = "default";
                    MWClient.send(msg, to, group);
                },
                stop:function(e, ui){
//                    console.log(e);
//                    console.log(ui);

                    window.wfepcontroller.annotationDragging = false;

                    var msg = {
                        type: "cmt_moveend",
                        cslide: window.wfepcontroller.cslide,
                        left: ui.position.left,
                        top: ui.position.top,
                        img_width: $('#slideController').width(),
                        img_height: $('#slideController').height(),
                        size: $(e.target).css("font-size"),
                        color: $(e.target).css("color"),
                        backgroundcolor: $(e.target).css("background-color"),
                        text: $(e.target).html(),
                        id: $(e.target).attr("id")
                    };
                    var to = "*";
                    var group = "default";
                    MWClient.send(msg, to, group);
                }
            })
            .on('contextmenu',function(e, ui){
                window.wfepcontroller.openContextMenu(e);

                return false;
            })
            .appendTo($('#slideController'));
    }else{
        // アノテーションの編集
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

// 下のコメント送信欄
function CommentController(){};

CommentController.prototype.init = function(){
    $('#commentSubmit')
        .on('click',function(){
            var msg = {
                type: "cmt_embed",
                cslide: window.wfepcontroller.cslide,
                text: $('#commentInput').val()
            };
            var to = "*";
            var group = "default";
            MWClient.send(msg, to, group);

            window.commentcontroller.clearComment();
        });
}

CommentController.prototype.clearComment = function(){
    $('#commentInput').val('');
}


function initMW(){
    // optional
    MWClient.application = "wfe-p"; // アプリケーション名
    MWClient.group = "default"; // クライアントのグループ名

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
        var to = "*";
        var group = "default";
        MWClient.send(msg, to, group);
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

        window.wfepcontroller.scaleX = window.wfepcontroller.slidesizeW/msg.img_width;
        window.wfepcontroller.scaleY = window.wfepcontroller.slidesizeH/msg.img_height;

        switch(msg.type){
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
                window.wfepcontroller.showPointer(msg);
                break;
            case "cmt_embed":

                break;
            case "ssbegin":
                $('#slideImage')
                    .attr({
                        src:msg.url
                    });
                window.wfepcontroller.cslide = msg.cslide;

                break;
            case "ssnext":
                var timer = setInterval(function(){
                    console.log($('#commentInput').is(':focus'));
                    console.log($(".contextMenu").css('display'));
                    if($('#commentInput').is(':focus') || $(".contextMenu").css('display') != 'none'){
                        return;
                    }else{
                        $('.annotations').remove();

                        $('#slideImage')
                            .attr({
                                src:msg.url
                            });
                        window.wfepcontroller.cslide = msg.cslide;

                        $.each(window.wfepcontroller.annotations,function(){
                            if(msg.cslide==this.cslide){
                                window.wfepcontroller.manipulateAnnotation(this);
                            }
                        });

                        clearInterval(timer);
                    }
                },100);

                break;
            case "ssend":
                $('.annotations').remove();

                $('#slideImage')
                    .attr({
                        src:"./img/default.png"
                    });
                window.wfepcontroller.cslide = null;

                break;
            case "count_clients":
                // 接続中のクライアントのカウント
                if(msg.response){
                    if(msg.userid==window.wfepcontroller.userID){
                        window.wfepcontroller.pointerNumber++;
                        window.wfepcontroller.pointerNumber%=4;
                    }
                }else{
                    var resmsg = {
                        type: "count_clients",
                        userid:msg.userid,
                        response:true
                    };
                    var to = "*";
                    var group = "default";
                    MWClient.send(resmsg, to, group);
                }

                break;
            default : break;
        }
    }
}

$(function() {
    initMW();

    window.wfepcontroller = new WFEPController;
    window.wfepcontroller.init();

    window.commentcontroller = new CommentController;
    window.commentcontroller.init();
})