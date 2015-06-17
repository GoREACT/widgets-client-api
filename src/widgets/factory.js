var factory = (function () {

    var exports = {};
    var prefix = 'widget_';
    var className = 'widget';
    var loadIndicatorClassName = 'widget-load-indicator';
    var count = 0;

    /**
     * Load widget
     *
     * @param url
     * @param options
     * @returns {Object}
     */
    exports.load = function (url, options) {

	    if(!utils.isObject(auth)) {
		    throw new Error('The "authorize" method must be called first');
	    }

	    var widget = {},
		    element = document.createElement('div'),
            display = '';

	    // Loading content
	    var loadingDiv, loadingStyle;

	    // Params to be passed along with view requests
	    var params = utils.clone(options) || {};
	    delete params.container;

	    // element properties
	    element.className = className;
	    element.style.position = "relative";
	    element.style.width = '100%';
	    element.style.height = '100%';

	    // add event dispatcher behavior to widget
	    dispatcher(widget);

		// Initially show loading indicator
	    showLoadingIndicator(true);

	    // Load widget content.
	    // We can't load the content until authorization is successful
	    if(auth.isPending()) {
		    auth.once('success', function success() {
			    loadContent(url, utils.extend(params, auth.data));
		    });
		    auth.once('error', function() {
			    showLoadingIndicator(false);
		    });
	    } else if(auth.isSuccess()) {
		    loadContent(url, utils.extend(params, auth.data));
	    } else {
		    showLoadingIndicator(false);
	    }

        /**
         * Show the widget
         */
        widget.show = function () {
            if (widget.element.parentNode.style.display === 'none') {
	            widget.element.parentNode.style.display = display;
            }
            widget.fire('shown');
        };

        /**
         * Hide the widget
         */
        widget.hide = function () {
            if (!display) {
                display = widget.element.parentNode.style.display;
	            widget.element.parentNode.style.display = 'none';
            }
            widget.fire('hidden');
        };

        /**
         * Destroy the widget
         */
        widget.destroy = function () {
	        widget.element.parentNode.removeChild(element);
            widget.fire('destroyed');
        };

	    /**
	     * Widget ready event handler
	     */
	    widget.on("ready", function() {
		    showLoadingIndicator(false);
	    });

        /**
         * Widget destroyed event handler
         */
        widget.on("destroyed", function() {
	        showLoadingIndicator(false);
            widget.off();
        });

        // resolve container
        var container = options.container;
        if (!utils.isElement(container)) {
            if (!container) { // null or undefined
                container = document.createElement('div');
                container.setAttribute('style', 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:99999');
                document.body.appendChild(container);
            } else if (typeof container === 'object') { // container is acting as a set of style options
                container = document.createElement('div');
                container.setAttribute('style', utils.styleToString(options.container));
                document.body.appendChild(container);
            }
        }

        // clear container content
        while (container.firstChild) {
            var el = container.firstChild;
	        el.widget.destroy();
        }

        // add element to container
        container.appendChild(element);

	    // expose element on widget
	    widget.element = element;

	    // add a reference from the element back to the widget
	    widget.element.widget = widget;

	    /**
	     * Load widget content
	     *
	     * @param url
	     * @param params
	     */
	    function loadContent(url, params) {

		    params = params || {};

		    if(!utils.isEmptyObject(params)) {
			    url += (url.indexOf("?") === -1 ? "?" : "&") + utils.serialize(params);
		    }

		    // make request for view
		    utils.sendRequest("GET", url, {}, function(status, html) {

			    var tElement = document.createElement('div');
			    tElement.innerHTML = html;

			    // clone and remove scripts for later insert
			    // so that they will get executed by the browser
			    var clonedScripts = [];
			    var scripts = tElement.getElementsByTagName('script');
			    var i = scripts.length;

			    while (i--) {
				    var script = document.createElement("script");
				    var props = ['type', 'src', 'text'];
				    for(var k = 0; k < props.length; k++) {
					    var prop = props[k];
					    if(scripts[i][prop]) {
						    script[prop] = scripts[i][prop];
					    }
				    }
				    clonedScripts.unshift(script);

				    // remove script
				    scripts[i].parentNode.removeChild(scripts[i]);
			    }

			    // Insert template element children
			    for(i = 0 ; i < tElement.children.length ; i++) {
				    element.appendChild(tElement.children[i]);
			    }

			    // insert scripts
			    for(i = 0; i < clonedScripts.length; i++) {
				    element.lastChild.appendChild(clonedScripts[i]);
			    }

			    widget.fire('loaded');
		    });
	    }

	    /**
	     * Show loading indicator
	     *
	     * @param value
	     */
	    function showLoadingIndicator(value) {
		    if(value) {
			    // create loading style
			    loadingStyle = document.createElement('style');
			    loadingStyle.type = 'text/css';
			    loadingStyle.innerHTML = '@@loadingStyle';
			    element.appendChild(loadingStyle);

			    // create loading dev
			    loadingDiv = document.createElement('div');
			    loadingDiv.className = loadIndicatorClassName;
			    utils.forEach([
				    'G', 'N', 'I', 'D', 'A', 'O', 'L'
			    ], function(letter) {
				    var letterDiv = document.createElement('div');
				    letterDiv.innerText = letter;
				    loadingDiv.appendChild(letterDiv);
			    });
			    element.appendChild(loadingDiv);
		    } else {
			    if(loadingDiv) {
				    loadingDiv.parentElement.removeChild(loadingDiv);
			    }
			    if(loadingStyle) {
				    loadingStyle.parentElement.removeChild(loadingStyle);
			    }
			    loadingDiv = false;
			    loadingStyle = false;
		    }
	    }

        return widget;
    };

    dispatcher(exports);

    return exports;
})();