const LVL_STRICT = 2, LVL_BASE = 1, LVL_OFF = 0;

Storage.prototype.set = function(o) {
	for (var i = 0, c = o.length; i < c; i++) {
		this[o[i][0]] = o[i][1];
	}
}

Array.prototype.toObject = function() {
	var o = {};
	for (var i = 0; i < this.length; i++) {
		o[this[i]] = '';
	}
	return o;
}

Object.prototype.check = function(a) {
	var c = a.length;
	for (var i = 0; i < c; i++) {
		if (this[a[i]] == undefined)
			return false;
	}
	return true;
}
function parseWhitelist() {
	whitelist = JSON.parse(widget.preferences["whitelist"]);
}

function parseRules() {
	rules = [];
	var blocklist = JSON.parse(widget.preferences["blocklist"]);
	var blocklistDisabled = JSON.parse(widget.preferences["blocklist-disabled"]);
	for (var i = 0, c = blocklist.length; i < c; i++) {
		if (!blocklistDisabled.hasOwnProperty(i))
			rules.push(blocklist[i].p);
	}
}

var theButton;

var rules, currentSite, whitelist = {};

var filter = opera.extension.urlfilter;
function getDomain(url) {
	var t = url.match(/:\/\/(.[^/]+)/);
	if (t)
		return t[1];
	else
		return false;
}

function getFocusedTab() {
	return opera.extension.tabs.getFocused();
}

function checkLevel(level, s) {
	if (whitelist.hasOwnProperty(s)) {
		return (level <= LVL_BASE);
	} else {
		return (level <= widget.preferences['mode-global']);
	}
}

function setRules(state) {
	if (state)
		for (var i = 0, len = rules.length; i < len; i++) {
			filter.block.add(rules[i]);
		}
	else
		for (var i = 0, len = rules.length; i < len; i++) {
			filter.block.remove(rules[i]);
		}
}

function toolbarButton(b) {
	if (b) {
		opera.contexts.toolbar.addItem(theButton);
	} else {
		opera.contexts.toolbar.removeItem(theButton);
	}
}

function setupConnection() {
	opera.extension.onconnect = function(event) {
		event.source.postMessage({
			topic : "getDomain"
		});
	}
	opera.extension.onmessage = function(event) {
		var s = event.data;
		var d = (checkLevel(LVL_STRICT, s)) ? widget.preferences['css-filter'] : false;
		event.source.postMessage({
			topic : "insertCss",
			data : d
		});
	}
}

var errorReport = {};

errorReport.handlerURL = "http://resetnow.ru/stopsocial/error";
errorReport.send = function(data) {
	var x = new XMLHttpRequest();
	x.open('POST', this.handlerURL, true);
	var postData = 'e=' + encodeURIComponent(JSON.stringify(data));
	x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	x.setRequestHeader('Custom-request-source', 'StopSocial');
	x.send(postData);
}

function main() {
	if (!(widget.preferences.check(['list-version', 'update-url', 'blocklist-disabled']))) {
		widget.preferences.set([['css-filter', ''], ['show-icon', '1'], ['enable-update', '1'], ['blocklist', '[]'], ['blocklist-disabled', '{}'], ['whitelist', '{}'], ['list-version', '-1'], ['update-url', 'http://resetnow.ru/stopsocial/update'], ['sign-url', 'http://resetnow.ru/stopsocial/signature'], ['mode-global', '2']]);
	}
	updater.updateURL = "http://resetnow.ru/stopsocial/update?v=" + widget.preferences['list-version'] + '&w=' + widget.version;
	updater.signatureURL = "http://resetnow.ru/stopsocial/signature?w=" + widget.version";
	try {
		parseRules();
		parseWhitelist();
	} catch (e) {
		rules = [];
		whitelist = {};
	}
	var ToolbarUIItemProperties = {
		disabled : false,
		title : 'StopSocial',
		icon : 'icons/icon-18.png',
		popup : {
			href : 'popup.html',
			width : 300,
			height : 215
		}
	}
	theButton = opera.contexts.toolbar.createItem(ToolbarUIItemProperties);
	if (widget.preferences['show-icon'])
		toolbarButton(true);
	if (checkLevel(LVL_BASE, "global"))
		setRules(true);
	if (widget.preferences['enable-update']) {
		setTimeout('updater.start()', 3000);
	} else {
		opera.postError("StopSocial: update disabled")
	}
}

window.addEventListener("load", setupConnection, false);

window.addEventListener('DOMContentLoaded', function() {
	var v = parseFloat(opera.version());
	var enableErrorReporting = false
	if (widget.preferences['enable-error-reporting'] == "true")
		enableErrorReporting = true;
	if (v >= 11.60) {
		if (enableErrorReporting)
			window.onerror = function(message, url, linenumber) {
				errorReport.send({
					"version" : widget.version,
					"message" : message,
					"line" : linenumber
				});
			}
		main();
	} else {
		try {
			main();
		} catch (e) {
			if (!enableErrorReporting)
				return;
			errorReport.send({
				"version" : widget.version,
				"messsage" : e.message
			});
		}
	}
}, false);
