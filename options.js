var bg = opera.extension.bgProcess;

function ge(s) {
	return document.querySelector(s);
}

function gea(s) {
	return document.querySelectorAll(s);
}

function saveBlocklist() {
	setRules(false);
	var t = {};
	ge("#blocklist-saved").style.opacity = 1;
	setTimeout(function() {
		ge("#blocklist-saved").style.opacity = 0
	}, 2000);
	var e = gea('div#blocklist-editor input:not(:checked)');
	for (var b = 0, c = e.length - 1; b <= c; b++) {
		var index = e[b].getAttribute('data-index');
		t[index] = true;
	}
	widget.preferences['blocklist-disabled'] = JSON.stringify(t);
	parseRules();
	setRules(true);
}

document.addEventListener('DOMContentLoaded', function() {
	var storage = widget.preferences;
	var glue = '\n';
	var formElements = document.querySelectorAll('input,select,textarea');
	var skip = hash('hidden,submit,image,reset,button');
	var multipleValues = hash('checkbox,select-multiple');
	var checkable = hash('checkbox,radio');
	// string to hash
	function hash(str, glue) {
		var obj = {};
		var tmp = str.split(glue || ',');
		while (tmp.length)
		obj[tmp.pop()] = true;
		return obj;
	}

	function setText(id, txt) {
		var e = document.getElementById(id);
		if (e) {
			e.textContent = txt;
		}
	}

	setText('widget-version', widget.version);

	function walkElements(callback) {
		var obj = [];
		for (var i = 0, element = null; element = formElements[i++]; ) {
			var type = element.type.toLowerCase();
			var name = element.name || '';
			if (skip[type] === true || name == '')
				continue;
			var tmp = callback(element, name, type);
			if (tmp != null)
				obj.push(tmp);
		}
		return obj;
	}

	function toolbarButton() {
		if (this.checked)
			bg.toolbarButton(true);
		else
			bg.toolbarButton(false);
	}

	var e = document.getElementById("check-icon");
	e.addEventListener('click', toolbarButton, false);

	function changedElement(e) {
		var element = e.currentTarget || e;
		var type = element.type.toLowerCase();
		var name = element.name || '';

		var value = multipleValues[type] !== true ? (element.value ? element.value : element.innerHTML) : walkElements(function(e, n, t) {
			if (n == name && e.options) {
				var tmp = [];
				for (var j = 0, option = null; option = e.options[j++]; ) {
					if (option.selected) {
						tmp.push(option.value);
					}
				}
				return tmp.join(glue);
			} else if (n == name && checkable[t] === true && e.checked) {
				return e.value;
			}
		}).join(glue);
		storage.setItem(name, value);
	}

	walkElements(function(element, name, type) {
		var value = storage[name] !== undefined ? storage.getItem(name) : element.value;
		var valueHash = hash(value, glue);
		if (element.selectedOptions) {
			for (var j = 0, option = null; option = element.options[j++]; ) {
				option.selected = valueHash[option.value] === true;
			}
		} else if (checkable[type] === true) {
			element.checked = valueHash[element.value] === true;
		} else {
			element.value = value;
		}
		if (storage[name] == undefined) {
			changedElement(element);
		}
		element.addEventListener('input', changedElement, true);
	});

	var 
		blocklist = JSON.parse(widget.preferences["blocklist"]),
		blocklistDisabled = JSON.parse(widget.preferences["blocklist-disabled"]),
		e = ge("#blocklist-editor");
	 
	for (var b = 0, c = blocklist.length - 1; b <= c; b++) {
		var id = "blocklist-item-" + b;
		var name = (blocklist[b].i == -1) ? _l["Other"] : blocklistNames[blocklist[b].i];
		var state = blocklistDisabled.hasOwnProperty(b);
		state = (state) ? '' : ' checked';
		e.innerHTML += '<div class="list-item"><input type="checkbox" data-index="' + b + '" id="' + id + '"' + state + '/><label for="' + id + '">' + name + '</label></div>';
	}

	ge('#blocklist-save').addEventListener('click', saveBlocklist);

}, false);
