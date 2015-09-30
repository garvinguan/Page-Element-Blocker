var queryInfo = {
    active: true,
    currentWindow: true
};

chrome.storage.sync.get(null, function(options)
			{
			    console.log(options);
			    var classUrls = Object.keys(options.classOptions);
			    var matchedUrl = testUrl(document.URL, classUrls);
			    console.log(matchedUrl);
			    if (matchedUrl)
				deleteElements(options.classOptions[matchedUrl]);

			    var idUrls = Object.keys(options.idOptions);
			    matchedUrl = testUrl(document.URL, classUrls);
			    console.log(matchedUrl);
			    if (matchedUrl)
				deleteElements(options.idOptions[matchedUrl]);
			});

function testUrl(url, urls) {
    var numUrls = urls.length;
    for (var i=0; i<numUrls; i++) {
	var urlMatcher = urlToTest(urls[i]);
	if (urlMatcher(url))
	    return urls[i];
    }
}

function urlToTest(input){
    var count = 0;
    var patched = input.replace(/\*/g, () => {
	count++;
	return 'WILDCARD';
    });

    var parts = URL.parse(patched);

    return function(url2) {
	var parsed2 = URL.parse(url2);
	if (parts.scheme.text !== 'WILDCARD') {
	    var scheme = escapeRegExp(parts.scheme.text).replace(/WILDCARD/g,'.*');
	    var schemeRegex = new RegExp(scheme,"g");
	    if ( !(schemeRegex.test(parsed2.scheme.text)) ) return false;
	}
	if (parts.host.text !== 'WILDCARD') {
	    var host = escapeRegExp(parts.host.text).replace(/WILDCARD/g,'\.*');
	    var hostRegex = new RegExp(host,"g");
	    if ( !(hostRegex.test(parsed2.host.text)) ) return false;
	}
	if (parts.pathname.text !== 'WILDCARD') {
	    var pathname = escapeRegExp(parts.pathname.text).replace(/WILDCARD/g,'\.*');
	    var pathnameRegex = new RegExp(pathname,"g");
	    if ( !(pathnameRegex.test(parsed2.pathname.text)) ) return false;
	}
	if (parts.search.text !== 'WILDCARD') {
	    var search = escapeRegExp(parts.search.text).replace(/WILDCARD/g,'\.*');
	    var searchRegex = new RegExp(search,"g");
	    if ( !(searchRegex.test(parsed2.search.text)) ) return false;
	}
	return true;
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

function escapeRegExp(string){
  return string.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
}
