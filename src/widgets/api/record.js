exports.record = function (options) {

    options = options || {};

    var iframe = interlace.load({
        container: options.container,
//        container: undefined,
//        container: document.getElementById('containerEl'),
//        container: { // null, element, or object
//            'position': 'absolute',
//            'top': '50px',
//            'left': '50px',
//            'right': '50px',
//            'bottom': '50px',
//            'z-index': 99999
//        },
        url: 'widgets/recorder.html',
//        class: 'shadow',
        params: options.params,
        options: {
//            width: '100%',
//            height: '100%'
        }
    });

    iframe.on('ready', function () {
        exports.fire('record::ready');
//        iframe.send('reveal', { 'message': 'I am your father!' });
    });

//    iframe.on('shout', function (event, data) {
//        console.log('### FROM CHILD ###', data);
//    });
//
    iframe.on('close', function (event, data) {
        iframe.close();
    });

    iframe.on('hide', function (event, data) {
        iframe.hide();
    });

    iframe.on('show', function (event, data) {
        iframe.show();
    });

    return iframe;
};