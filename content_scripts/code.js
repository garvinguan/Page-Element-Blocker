function deleteElements(selector) {
    // in case the content script was injected before the page is partially loaded
    if (!selector) return;
    doDelete(document.querySelectorAll(selector));

    var mo = new MutationObserver(process);
    mo.observe(document, {subtree:true, childList:true});
    document.addEventListener('DOMContentLoaded', function() {
	setTimeout(function() {
	    mo.disconnect();
	}, 5000);
    });

    function process(mutations) {
        for (var i = 0; i < mutations.length; i++) {
            var nodes = mutations[i].addedNodes;
            for (var j = 0; j < nodes.length; j++) {
                var n = nodes[j];
                if (n.nodeType != 1) // only process Node.ELEMENT_NODE
                    continue;
                doDelete(n.matches(selector) ? [n] : n.querySelectorAll(selector));
            }
        }
    }
    function doDelete(nodes) {
        [].forEach.call(nodes, function(node) { node.remove(); });
    }
}

function getRule(options, url) {
    var urls = Object.keys(options),
	numUrls = urls.length,
	parsedURL = URL.parse(url);

    for (var i = 0; i<numUrls; i++) {
	// check url against every url in options
	var key = urls[i].replace(/\*/g,'.*');
	var testKey = new RegExp('^' + key, 'g');
	if (testKey.test(url)) {
	    var subPath = Object.keys(options[urls[i]]);
	    for (var j = 0; j<subPath.length; j++) {
		var subPathKey = new RegExp('^' + subPath[j].replace(/\*/g,'.*')),
		    parsedSubPath = parsedURL.pathname.text + parsedURL.search.text;
		if (subPathKey.test(parsedSubPath)) {
		    var comma = '';
		    if (options[urls[i]][subPath[j]].classRule.length > 0 &&
			options[urls[i]][subPath[j]].idRule.length > 0)
			comma = ',';
		    return options[urls[i]][subPath[j]].classRule + comma + options[urls[i]][subPath[j]].idRule;
		}
	    }
	}
    }
    return null;
}

chrome.storage.sync.get(null, function(options) {
    if (Object.keys(options).length>0)
    {
	var urls = Object.keys(options);
	var pattern = getRule(options, document.URL);
	if (pattern)
	{
	    deleteElements(pattern);
	}
    }
});
