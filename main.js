const 
	LVL_STRICT = 2, 
	LVL_BASE = 1, 
	LVL_OFF = 0;

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
			rules = rules.concat(blocklist[i].p);
	}
}

var theButton, rules, currentSite, whitelist = {};

var filter = opera.extension.urlfilter;
function getDomain(url) {
	var t = url.match(/:\/\/(.[^/]+)/);
	if (t)
		return t[1];
	else
		return false;
}

var capability = (function(v, n) {
	var t = {}, version = parseFloat(opera.version());
	for (var i = 0, l = v.length; i < l; i++) {
		t[n[i]] = (v[i] <= version);
	}
	return t;
})([11.60, 12.10], ["WINDOW_ONERROR", "URLFILTER_V2"]);

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

var errorReport = {
	handlerURL : "http://resetnow.ru/stopsocial/error",
	send : function(data) {
		var x = new XMLHttpRequest();
		x.open('POST', this.handlerURL, true);
		var postData = 'e=' + encodeURIComponent(JSON.stringify(data));
		x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		x.setRequestHeader('Custom-request-source', 'StopSocial');
		x.send(postData);
	}
}

var stopSocial = {
	state : {
		enableURLFilter : true,
		enableCSSFilter : true
	},
	settings : widget.preferences,
	start : function() {
		this.initStorage();
		this.readSettings();
	},
	update : function() {
		updater.start();
	},
	readSettings : function() {
		rules = [];
		var blocklist = JSON.parse(this.settings["url-filter"]);
		var blocklistDisabled = JSON.parse(this.settings["url-disabled"]);
		for (var i = 0, c = blocklist.length; i < c; i++) {
			if (!blocklistDisabled.hasOwnProperty(i))
				rules = rules.concat(blocklist[i].p);
		}
		this.setState({
			enableURLFilter : this.settings['enable-url-filter'],
			enableCSSFilter : this.settings['enable-css-filter']
		});
	},
	initStorage : function() {
		(function(data){
			for (a in data) {
				if (this.settings[a[0]] == undefined) {
					for (b in data)
						this.settings[b[0]] = b[1];
					return;
				}
			}
		})([
			['css-filter', ''],
			['css-whitelist', ''],
			['url-disabled', '{}'], 
			['show-icon', '1'], 
			['enable-update', '1'], 
			['url-filter', '[]'], 
			['url-whitelist', '{}'],
			['url-disabled', '{}'],
			['list-version', '-1'], 
			['enable-url-filter', 1],
			['enable-css-filter', 1]
		]);
		}
	},
	URLFilter : {
		list : [],
		exludeDomains : []
	},
	CSSFilter : {
		code : "",
		exludeDomains : []
	},
	setDomainState : function(domain, state) {

	},
	setState : function(state) {

	}
};

function main() {
	updater.updateURL = "http://resetnow.ru/stopsocial/update2?v=" + widget.preferences['list-version'] + '&w=' + widget.version;
	updater.signatureURL = "http://resetnow.ru/stopsocial/signature2";
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
	if (capability.WINDOW_ONERROR) {
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
