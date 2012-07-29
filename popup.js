var currentTab = "global", currentSite;

const LVL_STRICT = 2, LVL_BASE = 1, LVL_OFF = 0, S_GLOBAL = 0, S_SITE = 1;

var bg = opera.extension.bgProcess;
var whitelist = JSON.parse(widget.preferences["whitelist"]);

HTMLElement.prototype.hide = function() {
	this.style.display = "none";
}

HTMLElement.prototype.show = function(s) {
	s = (s != "") ? "block" : s;
	this.style.display = s;
}

Array.prototype.remove = function(v) {
	for(var i = 0; i < this.length; i++) {
		if(this[i] == v)
			this.splice(i, 1);
	}
}

function ge(id) {
	return document.querySelector(id);
}

function trim(s) {
	return s.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

function gea(id) {
	return Array.prototype.slice.call(document.querySelectorAll(id));
}

function classRemove(e, c) {
	var r = new RegExp(c, 'g');
	e.className = e.className.replace(r, '');
	e.className = trim(e.className);
}

function clearTabs() {
	var o = gea("a.tab");
	for(var i = 0, len = o.length; i < len; i++) {
		classRemove(o[i], 'active');
	}
	o = gea("div.tab-content");
	for(var i = 0, len = o.length; i < len; i++) {
		o[i].hide();
	}
}

function getCurrentSite() {
	var bg = opera.extension.bgProcess;
	var t = bg.getFocusedTab();
	if(t)
		return bg.getDomain(t.url);
	else
		return false
}

function saveSettings(s, v) {
	switch (s) {
		case S_GLOBAL:
			widget.preferences['mode-global'] = v;
			if(v < LVL_STRICT) {
				ge('#tab-site').hide();
			} else {
				ge('#tab-site').show();
			}
			break;
		case S_SITE:
			if(v) {
				delete whitelist[currentSite];
			} else {
				whitelist[currentSite] = true;
			}
			break;
	}
	widget.preferences.whitelist = JSON.stringify(whitelist);
	bg.parseWhitelist();
}

function loadSettings() {
	var o = ge("#mode-g-" + widget.preferences['mode-global']);
	if(o)
		o.checked = true;
	if((widget.preferences['mode-global'] < LVL_STRICT) || (currentSite == false)) {
		ge('#tab-site').hide();
		return;
	}
	ge('#mode-s').checked = (!(whitelist.hasOwnProperty(currentSite)));
}

window.addEventListener('DOMContentLoaded', function() {
	currentSite = getCurrentSite();
	loadSettings();
	ge('#site-domain').innerHTML = (currentSite || "&mdash;");
	var tabs = gea("a.tab");
	for(var i = 0, len = tabs.length; i < len; i++) {
		tabs[i].addEventListener("click", function() {
			clearTabs();
			this.className += ' active';
			var tab = this.getAttribute("data-content");
			ge('#' + tab).show();
		}, false);
	}

	var s = gea("input[name='mode-g']");
	for(var i = 0, len = s.length; i < len; i++) {
		s[i].addEventListener("click", function() {
			if((this.value == 0) && (widget.preferences['mode-global'] != 0)) {
				bg.setRules(false);
			} else if((this.value > 0) && (widget.preferences['mode-global'] == 0)) {
				opera.postError(1);
				bg.setRules(true);
			}
			saveSettings(S_GLOBAL, this.value);
		}, false);
	}

	ge("#mode-s").addEventListener("click", function() {
		saveSettings(S_SITE, this.checked);
	}, false);
}, false);
