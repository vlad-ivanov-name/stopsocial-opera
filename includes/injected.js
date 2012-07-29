opera.extension.onmessage = function(event) {
	var message = event.data;
	switch (message.topic) {
		case 'getDomain':
			event.source.postMessage(document.domain);
			break;
		case 'insertCss':
			if(event.data.data) {
				var css = event.data.data;
				var style = document.createElement('style');
				style.setAttribute('type', 'text/css');
				style.appendChild(document.createTextNode(css));
				var refNode = document.getElementsByTagName('head')[0].firstChild;
				document.getElementsByTagName('head')[0].insertBefore(style, refNode);
			}
			opera.extension.onmessage = null;
			break;
	}
}