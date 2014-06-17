/**
 * Created with IntelliJ IDEA.
 * User: katashin
 * Date: 2013/08/01
 *
 * Dependency:
 * uuid.js
 *
 */

'use strict';

var MWClient;

var MWConnection = {
    CLOSED: 0,
    CONNECTING: 1,
    CONNECTED: 2
};

MWClient = {
    uuid: null,
    state: MWConnection.CLOSED,
    application: "mickr",
    group: "default",
    bye_interval: null,

    _socket: null,
    _ticket: null,

    /* =================================================
        Public functions
       ================================================= */

    echo: function(obj) {
        obj.method = 'ECHO';
        obj.ticket = this._ticket;
        this._socket.send(JSON.stringify(obj));
    },

    hello: function(url) {
        if (!this.uuid) {
            this.uuid = UUID.generate().toLowerCase();
        }

        if (this.state != MWConnection.CLOSED) {
            return;
        }

        this.state = MWConnection.CONNECTING;

        var socket = this._socket = new WebSocket(url);

        socket.onopen = function() {
            console.log('WebSocket open');

            var hello_msg = JSON.stringify(MWClient._createMessageObj(null, 'HELLO', '*'));
            socket.send(hello_msg);
        };

        socket.onmessage = this._onReceive;

        socket.onclose = (function(_this) {
            return function() {
                console.log('--BYE');
                _this.state = MWConnection.CLOSED;
            }
        }(this));
    },

    bye: function() {
        if (this.state != MWConnection.CONNECTED) {
            return;
        }

        var bye_msg = JSON.stringify(this._createMessageObj(null, 'BYE', '*'));
        this._socket.send(bye_msg);

        this.bye_interval = setTimeout(function() {
            console.log('--BYE timeout');
            MWClient._socket.close();
            MWClient.onBye();
        }, 3000);
    },

    sendText: function(text, to, group, cast, cheese) {
        if (this.state != MWConnection.CONNECTED) {
            return;
        }

        var msg_obj = this._createMessageObj({ text: text }, 'SEND', to, group, cast, cheese);
        this._socket.send(JSON.stringify(msg_obj));
    },

    send: function(obj, to, group, cast, cheese) {
        if (this.state != MWConnection.CONNECTED) {
            return;
        }

        var msg_obj = this._createMessageObj(obj, 'SEND', to, group, cast, cheese);
        this._socket.send(JSON.stringify(msg_obj));
    },

    // テキストデータを受信した時のリスナ
    // @param data: 取得したメッセージ
    onReceiveMsg: function(){},

    onHello: function(){},

    onSendEnd: function(){},

    onBye: function(){},

    /* =================================================
        Private functions
       ================================================= */

    _onReceive: function(e) {
        var data = JSON.parse(e.data);

        console.log('receive: ' + e.data);

        // HELLO リクエストのレスポンス
        if (MWClient.state == MWConnection.CONNECTING && data.cheese == 'HELLO') {
            MWClient._onHelloResponse(data);
            return;
        }

        // BYE リクエストのレスポンス
        if (MWClient.state == MWConnection.CONNECTED && data.cheese == 'BYE') {
            MWClient._onByeResponse(data);
            return;
        }

        // ステータスがあれば、こちらから送ったメッセージのレスポンス
        if (data.status) {
            MWClient._onSendResponse(data);
            return;
        }

        // group が指定されている場合は group が合っている時のみ受け付ける
        if (!data.body.group || data.body.group === MWClient.group) {
            MWClient.onReceiveMsg(data);
        }
    },

    _onHelloResponse: function(hello_data) {
        var status = parseInt(hello_data.status);

        switch (status) {
            case 200:
                console.log('--HELLO successful');
                MWClient.state = MWConnection.CONNECTED;
                MWClient._ticket = hello_data.ticket;
                MWClient.onHello(hello_data);
                break;
            default:
        }
    },

    _onByeResponse: function(bye_data) {
        var status = parseInt(bye_data.status);

        switch (status) {
            case 200:
                console.log('--BYE successful');
                clearInterval(MWClient.bye_interval);
                MWClient._socket.close();
                MWClient.onBye();
                break;
            default:
        }
    },

    _onSendResponse: function(res_data) {
        switch (res_data.status) {
            case 200:
                console.log('--Send successful');
                MWClient.onSendEnd(res_data);
                break;
            default:
        }
    },

    _createMessageObj: function(obj, method, to, group, cast, cheese) {
        var msg_obj = {
            method: method,
            timestamp: null,
            id: null,
            ticket: this._ticket,
            from: this.uuid,
            to: to,
            body: {
                application: this.application,
                group: group || this.group,
                cast: cast,
                message: {
                    text: ""
                }
            },
            cheese: cheese || method
        };

        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                msg_obj.body.message[key] = obj[key];
            }
        }

        return msg_obj;
    }
};

function showAlert($alert_el, html, delay, callback) {
    if (typeof delay === "function") {
        callback = delay;
        delay = null;
    }

    $alert_el.html(html).fadeIn();
    return setTimeout(function() {
        callback = callback || function() { $alert_el.fadeOut() };
        callback();
    }, delay || 3000);
}

function colorObjToRGBA(color) {
    if (!(typeof color === "object" && color.hasOwnProperty("r") && color.hasOwnProperty("g") && color.hasOwnProperty("b"))) {
        return null;
    }
    return "rgba(" + [color.r, color.g, color.b, color.a || 1].join(",") + ")";
}

function colorObjToCode(color) {
    if (!(typeof color === "object" && color.hasOwnProperty("r") && color.hasOwnProperty("g") && color.hasOwnProperty("b"))) {
        return null;
    }
    return "#" + color.r.toString(16) + color.g.toString(16) + color.b.toString(16);
}

function colorCodeToObj(code) {
    if (code.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)) {
        return {
            r: parseInt(RegExp.$1, 16),
            g: parseInt(RegExp.$2, 16),
            b: parseInt(RegExp.$3, 16),
            a: 1
        };
    }
    return null;
}

function rgbaToObj(rgba) {
    if (rgba.match(/^rgba?\(([0-9]+), ([0-9]+), ([0-9]+)(, ([0,1](\.[0-9]+)))?\)/i)) {
        return {
            r: parseInt(RegExp.$1),
            g: parseInt(RegExp.$2),
            b: parseInt(RegExp.$3),
            a: parseFloat(RegExp.$5) || 1
        };
    }
    return null;
}

function sanitizeHTML(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\\/g, "&quot;").replace(/'/g , "&#39;");
}

function saveMessage(key, msg) {
    if (!window.localStorage) {
        return;
    }

    window.localStorage.setItem(key, JSON.stringify(msg));
}

function loadMessage(key) {
    if (!window.localStorage) {
        return null;
    }

    return JSON.parse(window.localStorage.getItem(key));
}
