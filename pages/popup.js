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

function save_options(urlToAdd,classesToRemove,idsToRemove) {
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
    var urlKeys = options[url.scheme.text + "://" + url.host.text];
    if (urlKeys)
    {
	var subPaths = Object.keys(urlKeys),
	    largestUrlIndex = 0,
	    largestUrlLength = 0;
	for (var i=0; i<subPaths.length; i++) {
	    var urlRegex = new RegExp('^' + subPaths[i].replace(/\*/g,'.*')),
		urlKey = url.pathname.text + url.search.text;
	    var subPathMatches = urlRegex.test(urlKey);
	    if (subPathMatches) {
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
var Options = {};

function fillTextBoxes(urlToAdd,classesToRemove,idsToRemove) {
    initBrowserAction(function(url) {
	var parsedURL = URL.parse(url);
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
		urlToAdd.value = urlKey + "/*";
	    }
	});
    });

}

function selectThings() {
    function clear(node) {
	while (node.hasChildNodes()) {
	    node.removeChild(node.firstChild);
	}
    }

    function over(e) {
	var cl = e.target.classList[0];
	if (cl !== undefined && cl !== 'lit') {
	    cl = '.' + cl;
	} else if (e.target.id) {
	    cl = '#' + e.target.id;
	} else {
	    cl = e.target.tagName.toLowerCase();
	}

	if (over.last === cl) return;
	over.last = cl;
	var litElements = document.getElementsByClassName('lit');
	while (litElements.length > 0) {
	    litElements[0].classList.remove("lit");
	}
	if (!cl) return;
	var sameClassElements = typeof cl === 'string' ? document.querySelectorAll(cl) : [cl];
	for (var i = 0; i < sameClassElements.length; i++) {
	    sameClassElements[i].classList.add("lit");
	}
	showPopup(e.target);
    }

    function showPopup(e) {
	var messageTemplate = document.getElementById('messageTemplate').content,
	    popup = document.getElementById('popup'),
	    classList = [],
	    idList = [];

	clear(popup);
	popup.style.visibility = 'visible';
	while (e !== document.body) {
	    if (e.classList[0] && e.classList[0] !== 'lit') {
		classList = classList.concat(e.classList[0]);
	    }

	    if (e.id.length > 0)
		idList.push(e.id);
	    e = e.parentNode;
	}
	var length = classList.length;
	// console.log(classList);
	for (var i = 0; i < length; i++) {
	    appendOption('.' + classList[i], popup, messageTemplate);
	}
	length = idList.length;
	for (var j = 0; j < length; j++) {
	    appendOption('#' + idList[j], popup, messageTemplate);
	}
    }

    function appendOption(selector, popup, messageTemplate) {
	var messageNode = document.importNode(messageTemplate, true),
	    message = messageNode.querySelector('.message'),
	    textNode = document.createTextNode(selector);

	message.appendChild(textNode);
	popup.appendChild(messageNode);
    }
    document.body.addEventListener('click', over);
    document.body.addEventListener('mouseover', over);

}

document.addEventListener('DOMContentLoaded', function() {
    var saveButton = document.getElementById('saveOptions'),
	urlToAdd = document.getElementById('urlToAdd'),
	classesToRemove = document.getElementById('classesToRemove'),
	idsToRemove = document.getElementById('idsToRemove'),
	selectorButton = document.getElementsByClassName('includeSelectorButton')[0];

    var onUpdated = function() {
	saveButton.removeAttribute("disabled");
	return saveButton.innerHTML = "Save Changes";
    };

    var saveOptions = function() {
	save_options(urlToAdd,classesToRemove,idsToRemove);
	saveButton.disabled = true;
	return saveButton.innerHTML = "No Changes";
    };
    saveButton.addEventListener("click", saveOptions);

    selectorButton.addEventListener("click", selectThings);

    fillTextBoxes(urlToAdd,classesToRemove,idsToRemove);

    var events = ['input','change'];
    for (var i=0; i<events.length; i++)
    {
	classesToRemove.addEventListener(events[i], onUpdated);
	idsToRemove.addEventListener(events[i], onUpdated);
	urlToAdd.addEventListener(events[i], onUpdated);
    }
});
