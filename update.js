var updater = {};

updater.printLog = function(s) {
	opera.postError("StopSocial: " + s);
}

updater.applyUpdate = function(o) {
	var whitelist = o.siteWhitelist.toObject;
	var userWhitelist = JSON.parse(widget.preferences['whitelist']);
	for (var attrname in userWhitelist) {
		whitelist[attrname] = userWhitelist[attrname];
	}	
	widget.preferences['whitelist'] = JSON.stringify(whitelist);
	widget.preferences['list-version'] = o.version;
	widget.preferences['css-filter'] = o.cssFilter.replace(/(style|script)/gi, "");
	widget.preferences['blocklist'] = JSON.stringify(blocklist);
	widget.preferences['blocklist-names'] = JSON.stringify(o.widgetNames);
	widget.preferences['enable-error-reporting'] = o.enableErrorReporting;
	parseWhitelist();
	parseRules();
	setRules(false);
	setRules(true);
	this.printLog("Update success. Version: " + o.version + ", " + o.blocklist.length + " rules");
}

updater.checkSignature = function(signature, serverResponse) {
	var o;
	try {
		o = JSON.parse(serverResponse);
	} catch (e) {
		this.printLog('Failed to parse server response, are you offline?');
		return;
	}
	if (o.upToDate) {
		this.printLog('Already up to date');
		return;
	}
	if ((!o) || !(o.check(["siteWhitelist", "version", "cssFilter", "blocklist"]))) {
		this.printLog('Failed to parse server response');
		return;
	}
	var hash1 = decryptedString(this.keyPair, signature);
	var hash2 = md5(serverResponse);

	if (hash1 != hash2) {
		this.printLog('RSA signature check failed! ' + hash1 + ' ' + hash2);
		return;
	}
	this.applyUpdate(o);
}



updater.getSignature = function (serverResponse) {
	var z = new XMLHttpRequest();
	z.onreadystatechange = function () {      
		if (z.readyState == 4) {        
			updater.checkSignature(z.responseText, serverResponse);     
		}    
	}
	z.open('GET', this.signatureURL, true);
	z.send(null);
}

updater.start = function () {
	var x = new XMLHttpRequest();
	x.onreadystatechange = function () {        
		if (x.readyState == 4) {        
			updater.getSignature(x.responseText);        
		}    
	}
	x.open('GET', this.updateURL, true);
	x.send(null);
}

setMaxDigits(19);
key = new RSAKeyPair("", "107d97101d36bcc74a1bff3e8d0aba21", "7fc2a3ea1659283a27315514dd063421");

updater.keyPair = key;