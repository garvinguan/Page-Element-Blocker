var queryInfo = {
    active: true,
    currentWindow: true
};
var urlParser = require('./url');

chrome.tabs.query(queryInfo, function(tabs) {
    var tab = tabs[0];
    var url = tab.url;

    console.assert(typeof url == 'string', 'tab.url should be a string');
    console.log('url');
    console.log(url);
    chrome.storage.sync.get(null, function(options)
			    {
				console.log(options);
				var classUrls = Object.keys(options.classOptions);
				testUrl(url, classUrls);
				var idUrls = Object.keys(options.idOptions);
				deleteElements(options.classesToRemove.toString());
			    });
});

function testUrl(url, urls) {
    var numUrls = urls.length;
    for (var i=0; i<numUrls; i++) {
	var urlMatcher = urlToTest(urls[i]);
	if (urlMatcher(url))
	    return url;
    }
}

function urlToTest(input){
    var count = 0;
    var patched = input.replace(/\*/g, () => {
	count++;
	return 'WILDCARD';
    });

    var parts = urlParser.parse(patched);

    return function(url2) {
	var parsed2 = urlParser.parse(url2);
	if (parts.scheme.text !== 'WILDCARD') {
	    if (parsed2.scheme.text !== parts.scheme.text) return false;
	}
	if (parts.host.text !== 'WILDCARD') {
	    if (parsed2.host.text !== parts.host.text) return false;
	}
	if (parts.pathname.text !== 'WILDCARD') {
	    if (parsed2.scheme.text !== parts.pathname.text) return false;
	}
	if (parts.search.text !== 'WILDCARD') {
	    if (parsed2.search.text !== parts.search.text) return false;
	}
	if (parts.scheme.text !== 'WILDCARD') {
	    if (parsed2.hash.text !== parts.hash.text) return false;
	}
    }
}

function deleteElements(selector) {
    // in case the content script was injected after the page is partially loaded
    doDelete(document.querySelectorAll(selector));

    var mo = new MutationObserver(process);
    mo.observe(document, {subtree:true, childList:true});
    document.addEventListener('DOMContentLoaded', function() { mo.disconnect(); });

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
