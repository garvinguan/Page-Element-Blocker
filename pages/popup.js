function initBrowserAction(initOptions) {
    var queryInfo = {active: true,currentWindow: true };
    chrome.tabs.query(queryInfo, function(tabs) {
	var tab = tabs[0];
	var url = tab.url;
	initOptions(url);
    });
}

function save_options(errorCallback) {
    var url = urlToAdd.value.replace(/\s+/g, '');
    var classPatterns = classesToRemove.value.replace(/\s+/g, '');
    var idPatterns = idsToRemove.value.replace(/\s+/g, '');

    if ( !url )
	return;
    else {
	if (classPatterns !== Options.classOptions[url]) {
	    if (classPatterns) {
		classPatterns = appendSym(classPatterns,'.');
		Options.classOptions[url] = classPatterns;
	    }
	    else {
		delete Options.classOptions[url];
	    }
	}
	if (idPatterns !== Options.idOptions[url]) {
	    if (idPatterns) {
		idPatterns = appendSym(idPatterns,'#');
		Options.idOptions[url] = idPatterns;
	    }
	    else {
		delete Options.idOptions[url];
	    }
	}
	chrome.storage.sync.set(Options, function() {
            // Update status to let user know options were saved.
            var status = document.getElementById('status');
            status.textContent = 'Options saved.';
            setTimeout(function() {
		status.textContent = '';
            }, 750);
	});
    }
    function appendSym(patterns,sym) {
	var arrayOfPatterns = patterns.split(',');
	var numPatterns = arrayOfPatterns.length;
	for (var i=0; i<numPatterns; i++)
	{
	    if(arrayOfPatterns[i].charAt(0) != sym)
	    {
		arrayOfPatterns[i] = sym + arrayOfPatterns[i];
	    }
	}
	return arrayOfPatterns.join();
    }
}

function retrieveOption(option, url) {
    var urlKeys = Options[option][url.scheme.text + "://" + url.host.text];
    if (urlKeys)
    {
	var allKeys = Object.keys(urlKeys),
	    largestUrlIndex = 0,
	    largestUrlLength = 0;
	for (var i=0; i<allKeys.length; i++) {
	    var urlRegex = new RegExp('^' + allKeys[i] + '$','g'),
		urlKey = url.pathname.text + url.search.text;
	    if (urlRegex.test(urlKey)) {
		if (largestUrlLength < urlKey.length) {
		    largestUrlLength = urlKey.length;
		    largestUrlIndex = i;
		}
	    }
	}
	if (largestUrlLength > 0) {
	    var matchingUrl = allKeys[largestUrlIndex],
		rule =  Options[option][allKeys[largestUrlIndex]];
	    return {"url": matchingUrl, "rule": rule};
	}
    }
    return {"url": url.scheme.text + "://" + url.host.text, "rule": ''};
}
var Options, urlToAdd, classesToRemove, idsToRemove;

document.addEventListener('DOMContentLoaded', function() {
    var saveButton = document.getElementById('saveOptions');

    var onUpdated = function() {
        saveButton.removeAttribute("disabled");
        return saveButton.innerHTML = "Save Changes";
    };

    var saveOptions = function() {
	save_options();
        saveButton.disabled = true;
        return saveButton.innerHTML = "No Changes";
    };
    saveButton.addEventListener("click", saveOptions);

    urlToAdd = document.getElementById('urlToAdd');
    classesToRemove = document.getElementById('classesToRemove');
    idsToRemove = document.getElementById('idsToRemove');
    initBrowserAction(function(url) {
	console.log("in initBrowserAction");
	var parsedURL = URL.parse(url);
	// TODO: query in storage to get the url in storage
	chrome.storage.sync.get(null, function(items){
	    Options = items;
	    if (Object.keys(Options).length > 0)
	    {
		// look for the entry in Options.
		var options = retrieveOption(parsedURL);
		classesToRemove.value = retrieveOption('classOptions', parsedURL);
		idsToRemove.value = retrieveOption('idOptions',parsedURL);
	    }
	    else
	    {
		Options.classOptions = {};
		Options.idOptions = {};
		var urlKey = parsedURL.scheme.text + "://" + parsedURL.host.text;
		console.log(urlKey.value);
		urlToAdd.value = urlKey;
	    }
	});
    });

    var events = ['input','change'];
    for (var i=0; i<events.length; i++)
    {
	classesToRemove.addEventListener(events[i], onUpdated);
	idsToRemove.addEventListener(events[i], onUpdated);
	urlToAdd.addEventListener(events[i], onUpdated);
    }
});
