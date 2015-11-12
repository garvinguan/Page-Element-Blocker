function initBrowserAction(callback) {
    var queryInfo = {
	active: true,
	currentWindow: true
    };

    chrome.tabs.query(queryInfo, function(tabs) {
	var tab = tabs[0];
	var url = tab.url;
	callback(url);
    });
}

var onUpdated = function() {
    var saveButton = document.getElementById('save');
    saveButton.removeAttribute("disabled");
    return saveButton.innerHTML = "Save Changes";
};

function renderStatus(statusText) {
    document.getElementById('status').textContent = statusText;
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
var Options;

document.addEventListener('DOMContentLoaded', function() {
    var saveButton = document.getElementById('save');

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
	var parsedURL = URL.parse(url);
	urlToAdd.value = parsedURL.scheme.text + "://" + parsedURL.host.text + '/*';
	chrome.storage.sync.get(null, function(items){
	    Options = items;
	    if (Object.keys(Options).length > 0)
	    {
		classesToRemove.value = Options.classOptions[urlToAdd.value] ? Options.classOptions[urlToAdd.value] : '';
		idsToRemove.value = Options.idOptions[urlToAdd.value] ? Options.idOptions[urlToAdd.value] : '';
	    }
	    else
	    {
		Options.classOptions = {};
		Options.idOptions = {};
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
