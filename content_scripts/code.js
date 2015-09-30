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
			    matchedUrl = testUrl(document.URL, idUrls);
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
    var patched = input.replace(/\*/g, 'WILDCARD');

    var parts = URL.parse(patched);

    function makeTest(str){
        if (str === 'WILDCARD') return function(){ return true; };
        var pattern = escapeRegExp(str).replace(/WILDCARD/g,'.*');
        var regex = new RegExp('^' + pattern + '$', 'g');
        return function(target){ return regex.test(target); };
    }

    var tests = {
        scheme: makeTest(parts.scheme.text),
        host: makeTest(parts.host.text),
        pathname: makeTest(parts.pathname.text),
        search: makeTest(parts.search.text)
    };

    return function(url2) {
	var parsed2 = URL.parse(url2);
        return (
            tests.scheme(parsed2.scheme.text) &&
            tests.host(parsed2.host.text) &&
            tests.pathname(parsed2.pathname.text) &&
		tests.search(parsed2.search.text)
        );
    };
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
