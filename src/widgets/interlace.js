var interlace = (function () {

    var exports = {};
    var prefix = 'interlace-';
    var count = 0;

    function isElement(o) {
        return (
                typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
            o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName === "string"
            );
    }

    var hashToParams = function (hash) {
        var search = hash ? '?' : '';
        for (var k in hash) {
            if (hash[k].isArray) {
                for (var i = 0; i < hash[k].length; i++) {
                    search += search === '?' ? '' : '&';
                    search += encodeURIComponent(k) + '=' + encodeURIComponent(hash[k][i]);
                }
            } else {
                search += search === '?' ? '' : '&';
                search += encodeURIComponent(k) + '=' + encodeURIComponent(hash[k]);
            }
        }
        return search;
    };

    var getParam = function (name, from) {
        from = from || window.location.search;
        var regexS = '[?&]' + name + '=([^&#]*)';
        var regex = new RegExp(regexS);
        var results = regex.exec(from);
        if (results === null) {
            return '';
        }
        return decodeURIComponent(results[1].replace(/\+/g, ' '));
    };

    var styleToString = function (obj) {
        var str = '';
        for (var e in obj) {
            if (obj.hasOwnProperty(e)) {
                str += e + ':' + obj[e] + ';';
            }
        }
        return str;
    };

    exports.load = function (payload) {
        var frameId = prefix + (count += 1);
        var iframe = document.createElement('iframe');

        var params = payload.params || {};
        params.interlace = frameId;

        var url = payload.url + hashToParams(params);

        // Append the initial width as a querystring parameter, and the fragment id
        iframe.id = frameId;
        iframe.src = url;

        // Set some attributes to this proto-iframe.
        iframe.setAttribute('width', typeof payload.options.width === 'undefined' ? '100%' : payload.options.width);
        iframe.setAttribute('height', typeof payload.options.height === 'undefined' ? '100%' : payload.options.height);
        iframe.setAttribute('scrolling', 'no');
        iframe.setAttribute('marginheight', '0');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowtransparency', 'true');
        iframe.setAttribute('style', 'display:none');

        iframe.send = function (event, data) {
            exports.send(iframe, event, data);
        };

        iframe.onload = function () {
            iframe.removeAttribute('style');
            if (payload.class) {
                iframe.setAttribute('class', payload.class);
            }
            iframe.fire('ready');
        };

        // Append the iframe to our element.
        var container = payload.container;
        if (isElement(container)) {
            container.setAttribute('data-ic', 'container-' + frameId);
        } else if (typeof container === 'object') { // container is acting as a set of style options
            container = document.createElement('div');
            container.setAttribute('data-ic', 'container-' + frameId);
            container.setAttribute('style', styleToString(payload.container));
            document.body.appendChild(container);
        } else if (typeof container === 'undefined') { // default element
            container = document.createElement('div');
            container.setAttribute('data-ic', 'container-' + frameId);
            container.setAttribute('style', 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:99999');
            document.body.appendChild(container);
        }

        container.appendChild(iframe);

//        window.addEventListener('resize', function() {
//            that.sendWidth();
//        });

        dispatcher(iframe);

        return iframe;
    };

    exports.send = function (target, event, data) {
        debugger;
        data = data || {};
        data.$$id = target.id || getParam('interlace');
        data.$$event = event;
        var json = JSON.stringify(data);

        var targetWindow = target.contentWindow || target;
        targetWindow.postMessage(json, '*');
    };

    dispatcher(exports);

    window.addEventListener('message', function (evt) {
        var data = JSON.parse(evt.data);
        var interlaceId = data.$$id;
        var interlaceEvent = data.$$event;
        delete data.$$id;
        delete data.$$event;
        console.log('message received', data);

        var iframe = document.getElementById(interlaceId);
        if(iframe) { // we are the parent
            iframe.fire(interlaceEvent, data);
        } else { // we are the child
            exports.fire(interlaceEvent, data);
        }
    });

//    var interlaceId = getParam('interlace');
//    if (interlaceId) { // this file has been loaded into an iframe by interlace
//        exports.send(parent, 'ready', { message: 'from your child'});
//    }

    return exports;

})();