function onUpdated() {
    saveButton.removeAttribute("disabled");
    return saveButton.innerHTML = "Save Changes";
};

function create_rule(rule, ruleTemplate,ref) {
    var content, row, field, element, ref1, event;
    var includeRulesTable = document.getElementById(template);
    row = document.importNode(ruleTemplate, true);
    for (var i = 0, len = ref.length; i < len; i++) {
	field = ref[i];
	element = row.querySelector("." + field);
	element.value = rule[field];
	ref1 = ["input", "change"];
	for (var j = 0, len1 = ref1.length; j < len1; j++) {
	    event = ref1[j];
	    element.addEventListener(event, onUpdated);
	}
    }
    row.querySelector(".includeRemoveButton").addEventListener("click", (function(event) {
	rule = event.target.parentNode.parentNode;
	rule.parentNode.removeChild(rule);
	onUpdated();
    }));
    includeRulesTable.appendChild(row);
}

function restore_rules(rules, ruleTemplate) {
    // for each rule (second part of the url) add event handlers and create a rule section
    var allUrls = Object.keys(rules),
	numUrls = allUrls.length,
	template = document.querySelector('#'+ruleTemplate).content;

    // add a rule for each url
    for (var i = 0; i<numUrls; i++) {
	var allPaths = Object.keys(rules[allUrls[i]]);
	var numPaths = allPaths.length;
	for (var j = 0; j<numPaths; j++) {
	    create_rule(allUrls[i],rules[allUrls[i]][allPaths[j]],template,['url','classToRemove','idToRemove']);
	}
    }
}

function concatenatePatterns(patterns, selector) {
    if(patterns.length < 1) return ''; // if there are no patterns just return empty string
    patterns = patterns.split(',');
    var pattern = "";
    var numPatterns = patterns.length-1;
    // start appending the selector to each of the patterns
    for (var j=0;j<numPatterns; j++){
	if (patterns[j].substring(0,1) !== selector)
	    pattern+=selector + patterns[j] + ',';
	else
	    pattern+= patterns[j] + ',';
    }
    if (patterns[numPatterns].substring(0,1) !== selector)
	pattern+=selector + patterns[numPatterns];
    else
	pattern+= patterns[numPatterns];

    return pattern;
}
function storeRulesInArray(rules){
    var options = {}, url, rest_of_the_url = {}, urlparts, rule, classRule, idRule;
    for(var i=0;i<rules.length; i++){
	urlparts = URL.parse(rules[i].getElementsByClassName('url')[0].value.replace(/\*/g,'WILDCARD'));
	classRule = concatenatePatterns(rules[i].getElementsByClassName('classToRemove')[0].value.replace(/\s+/g, ''),'.');
	idRule = concatenatePatterns(rules[i].getElementsByClassName('idToRemove')[0].value.replace(/\s+/g, ''),'#');
	url = urlparts.scheme.text + "://" + urlparts.host.text;
	rest_of_the_url[(urlparts.pathname.text + urlparts.search.text).replace(/WILDCARD/g,'*')] =
	    {
		"classRule": classRule,
		"idRule": idRule
	    };
	if (options[url])
	    options[url].push(rest_of_the_url);
	else
	    options[url] = [rest_of_the_url];
    }
    console.log(options);
    return options;
}
function save_options() {
    var options = {}, idOptions = {}, classOptions = {};
    // get the input boxes with the options and store them
    options = storeRulesInArray(document.querySelectorAll('.rule'));

    // chrome.storage.sync.set(options, function() {
    //     // Update status to let user know options were saved.
    //     var status = document.getElementById('status');
    //     status.textContent = 'Options saved.';
    //     setTimeout(function() {
    //         status.textContent = '';
    //     }, 750);
    // });
}

function restoreOptions(options) {
    restore_rules(options,'ruleTemplate');
}

function restore_options() {
    chrome.storage.sync.get(null, function(options){
	if (Object.keys(options).length !== 0)
	    restoreOptions(options);
    });
};

function initOptionsPage() {
    // restore_options();
    var saveButton = document.getElementById('saveOptions');
    saveButton.disabled = false;

    var saveOptions = function() {
	save_options();
	saveButton.disabled = true;
	return saveButton.innerHTML = "No Changes";
    };
    saveButton.addEventListener("click", saveOptions);

    // var addClassPatternButton = document.getElementById("includeRuleAddButton");
    // addClassPatternButton.addEventListener("click", function() {
    // 	add_pattern({
    // 	    classURLpattern: "",
    // 	    classToRemove: ""
    // 	},'includeClassRules');
    // });

    document.addEventListener("keyup", function(event) {
	var ref1;
	if (event.ctrlKey && event.keyCode === 13) {
	    if (typeof document !== "undefined" && document !== null ? (ref1 = document.activeElement) != null ? ref1.blur : void 0 : void 0) {
		document.activeElement.blur();
	    }
	    saveOptions();
	}
    });
};

initOptionsPage();
