function add_rule(ruleData, ruleTemplate,ref) {
    var content, rule, field, element, event, ref1 = ["input", "change"],
	rulesArea = document.getElementById('rules'),
	ruleHtml = document.querySelector('#'+ruleTemplate).content;

    rule = document.importNode(ruleHtml, true);
    for (var i = 0, len = ref.length; i < len; i++) {
	field = ref[i];
	element = rule.querySelector("." + field);
	element.value = ruleData[field];
	for (var j = 0, len1 = ref1.length; j < len1; j++) {
	    event = ref1[j];
	    element.addEventListener(event, onUpdated);
	}
    }
    rule.querySelector(".includeRemoveButton").addEventListener("click", (function(event) {
	rule = event.target.parentNode.parentNode.parentNode;
	rule.parentNode.remove();
	onUpdated();
    }));
    rulesArea.appendChild(rule);
}

function restore_rules(rules, ruleTemplate) {
    // for each rule (second part of the url) add event handlers and create a rule section
    var allUrls = Object.keys(rules),
	numUrls = allUrls.length;

    // add a rule for each url
    for (var i = 0; i<numUrls; i++) {
	var allSubPaths = Object.keys(rules[allUrls[i]]);
	var numPaths = allSubPaths.length;
	for (var j = 0; j<numPaths; j++) {
	    var url = allUrls[i] + allSubPaths[j],
		patterns = rules[allUrls[i]][allSubPaths[j]],
		rule = {'url': url,
			'classToRemove': patterns.classRule,
			'idToRemove': patterns.idRule};
	    if (patterns.idRule.length > 0 || patterns.classRule.length > 0)
		add_rule(rule,ruleTemplate,['url','classToRemove','idToRemove']);
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
    var options = {}, url, urlparts, rule, classRule, idRule;
    for(var i=0;i<rules.length; i++){
	var rest_of_the_url = {};
	urlparts = URL.parse(rules[i].getElementsByClassName('url')[0].value);
	classRule = concatenatePatterns(rules[i].getElementsByClassName('classToRemove')[0].value.replace(/\s+/g, ''),'.');
	idRule = concatenatePatterns(rules[i].getElementsByClassName('idToRemove')[0].value.replace(/\s+/g, ''),'#');
	url = urlparts.scheme.text + "://" + urlparts.host.text;
	rest_of_the_url = urlparts.pathname.text + urlparts.search.text;

	if (!options[url])
	    options[url] = {};

	options[url][rest_of_the_url] = {"classRule": classRule, "idRule": idRule };
    }
    console.log(options);
    return options;
}
function save_options() {
    var options = {}, idOptions = {}, classOptions = {};
    // get the input boxes with the options and store them
    options = storeRulesInArray(document.querySelectorAll('.rule'));

    chrome.storage.sync.clear(function () {
	chrome.storage.sync.set(options, function() {
	    // Update status to let user know options were saved.
	    var status = document.getElementById('status');
	    status.textContent = 'Options saved.';
	    setTimeout(function() {
		status.textContent = '';
	    }, 750);
	});
    });
}

function restoreOptions(options) {
    restore_rules(options,'ruleTemplate');
}

function restore_options() {
    chrome.storage.sync.get(null, function(options){
	console.log(options);
	if (Object.keys(options).length !== 0)
	    restoreOptions(options);
    });
};

var saveButton = document.getElementById('saveOptions');

function onUpdated() {
    saveButton.removeAttribute("disabled");
    return saveButton.innerHTML = "Save Changes";
};

function initOptionsPage() {
    restore_options();
    saveButton.disabled = false;

    var saveOptions = function() {
	save_options();
	saveButton.disabled = true;
	return saveButton.innerHTML = "No Changes";
    };
    saveButton.addEventListener("click", saveOptions);

    var addPatternButton = document.getElementById('includeRuleAddButton');
    addPatternButton.addEventListener("click", function() {
	add_rule({
	    'url': "",
	    'classToRemove': "",
	    'idToRemove' : ""
	},'ruleTemplate', ['url','classToRemove','idToRemove']);
	// focus on the newly added rule
	var rulesArea = document.getElementById('rules');
	rulesArea.lastElementChild.querySelector('input').focus();
    });
};

initOptionsPage();
