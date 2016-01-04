function initBrowserAction(initOptions) {
    var queryInfo = {active: true,currentWindow: true };
    chrome.tabs.query(queryInfo, function(tabs) {
	var tab = tabs[0];
	var url = tab.url;
	initOptions(url);
    });
}
function rulesEqual(rule1, rule2) {
    // take 2 JSON objects with classRule and idRule to check if they're equal
    return JSON.stringify(rule1) === JSON.stringify(rule2);
}

function addRuleToOptions(Options,url, classPatterns, idPatterns) {
    var parsedURL = URL.parse(url),
	startOfUrl = parsedURL.scheme.text + "://" + parsedURL.host.text,
	subPath = parsedURL.pathname.text + parsedURL.search.text,
	ruleInfo = {};

    if (subPath == '/')
	subPath = '/*';
    ruleInfo = {"classRule" : classPatterns, "idRule": idPatterns };

    // Option exists already
    if (Options[startOfUrl]) {
	if (Options[startOfUrl][subPath]) {
	    if (!rulesEqual(Options[startOfUrl][subPath],ruleInfo))
		Options[startOfUrl][subPath] = ruleInfo;
	    return; //return if the option  already exists
	}
    }
    else {
	// add a new rule to Options
	Options[startOfUrl] = {};
	Options[startOfUrl][subPath] = ruleInfo;
    }
}

function save_options(errorCallback) {
    var url = urlToAdd.value.replace(/\s+/g, ''),
	classPatterns = classesToRemove.value.replace(/\s+/g, ''),
	idPatterns = idsToRemove.value.replace(/\s+/g, '');

    classPatterns = appendSym(classPatterns, '.');
    idPatterns = appendSym(idPatterns, '#');
    if ( !url )
	return;
    else {
	addRuleToOptions(Options,url,classPatterns, idPatterns);
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
	if (patterns.length < 1) return '';

	var arrayOfPatterns = patterns.split(','),
	    numPatterns = arrayOfPatterns.length;
	for (var i=0; i<numPatterns; i++)
	{
	    if(arrayOfPatterns[i].charAt(0) != sym)
		arrayOfPatterns[i] = sym + arrayOfPatterns[i];
	}
	return arrayOfPatterns.join();
    }
}

function retrieveOption(options, url) {
    console.log(url);
    var urlKeys = options[url.scheme.text + "://" + url.host.text];
    if (urlKeys)
    {
	var subPaths = Object.keys(urlKeys),
	    largestUrlIndex = 0,
	    largestUrlLength = 0;
	for (var i=0; i<subPaths.length; i++) {
	    var urlRegex = new RegExp('^' + subPaths[i].replace(/\*/g,'.*')),
		urlKey = url.pathname.text + url.search.text;
	    console.log("urlRegex.test(urlKey)" + urlRegex.test(urlKey));
	    var subPathMatches = urlRegex.test(urlKey);
	    if (subPathMatches) {
		console.log("what's going on");
		if (largestUrlLength < subPaths[i].length) {
		    largestUrlLength = subPaths[i].length;
		    largestUrlIndex = i;
		}
	    }
	}
	if (largestUrlLength > 0) {
	    var matchingUrl = subPaths[largestUrlIndex],
		rule =  urlKeys[subPaths[largestUrlIndex]];
	    if (rule.idRule.length > 0 || rule.classRule.length > 0)
		return {"url": url.scheme.text + "://" + url.host.text + matchingUrl,
			"rule": rule};
	}
    }
    return {"url": url.scheme.text + "://" + url.host.text + "/*",
	    "rule": {"classRule": '',"idRule": ''}};
}
var Options = {}, urlToAdd, classesToRemove, idsToRemove;

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
	console.log(parsedURL);
	chrome.storage.sync.get(null, function(Options){
	    if (Object.keys(Options).length > 0)
	    {
		// look for the entry in Options.
		var option = retrieveOption(Options,parsedURL);
		urlToAdd.value = option.url;
		classesToRemove.value = option.rule.classRule;
		idsToRemove.value = option.rule.idRule;
	    }
	    else
	    {
		Options = {};
		var urlKey = parsedURL.scheme.text + "://" + parsedURL.host.text;
		console.log(urlKey.value);
		urlToAdd.value = urlKey + "/*";
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
