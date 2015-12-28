function onUpdated() {
        saveButton.removeAttribute("disabled");
        return saveButton.innerHTML = "Save Changes";
};

function add_pattern_row(rule, identifier,ref) {
    var content, row, field, element, ref1, event;
    var includeRulesTable = document.getElementById(identifier);
    content = document.querySelector('#'+identifier+'Template').content;
    row = document.importNode(content, true);
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

function add_pattern(rule, identifier) {
    if (identifier==='includeClassRules')
	add_pattern_row(rule,identifier,['classURLpattern','classToRemove']);
    else
	add_pattern_row(rule,identifier,['idURLpattern','idToRemove']);
}

function storeOptionsInArray(elements, selector, urls, rules){
    var options = {}, url, patterns;
    for(var i=0;i<elements.length; i++){
	url = elements[i].getElementsByClassName(urls)[0].value;
	patterns = elements[i].getElementsByClassName(rules)[0].value.replace(/\s+/g, '');
	if(patterns.length < 1) continue;
	patterns = patterns.split(',');
	var pattern = "";
	var numPatterns = patterns.length-1;
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

	options[url]=pattern;
    }
    return options;
}
function save_options() {
    var options = {}, idOptions = {}, classOptions = {};

    // store options in array
    // get the input boxes with class options
    var templateInstances = document.querySelectorAll('.includeClassRuleTemplateInstance');
    classOptions = storeOptionsInArray(templateInstances, '.', 'classURLpattern','classToRemove');

    // get the input boxes with id options
    templateInstances = document.querySelectorAll('.includeIDRuleTemplateInstance');
    idOptions = storeOptionsInArray(templateInstances, '#', 'idURLpattern', 'idToRemove');

    // store class options and id options in options for storage
    options['idOptions']=idOptions;
    options['classOptions']=classOptions;
    chrome.storage.sync.set(options, function() {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);
    });
}

function restoreOptionRows(items) {
    var allKeys;
    allKeys = Object.keys(items.classOptions);
    for (var i=0; i<allKeys.length; i++)
    {
	add_pattern({
	    classURLpattern: allKeys[i],
	    classToRemove: items.classOptions[allKeys[i]].replace(/\./g, '')
	},'includeClassRules');
    }

    allKeys = Object.keys(items.idOptions);
    for ( i=0; i<allKeys.length; i++)
    {
	add_pattern({
	    idURLpattern: allKeys[i],
	    idToRemove: items.idOptions[allKeys[i]].replace(/#/g, '')
	},'includeIDRules');
    }
}

function restore_options() {
    chrome.storage.sync.get(null, function(items){
	if (Object.keys(items).length !== 0)
	    restoreOptionRows(items);
    });
};

function initOptionsPage() {
    restore_options();
    saveButton = document.getElementById('saveOptions');

    var saveOptions = function() {
	save_options();
        saveButton.disabled = true;
        return saveButton.innerHTML = "No Changes";
    };
    saveButton.addEventListener("click", saveOptions);

    var addClassPatternButton = document.getElementById("includeClassAddButton");
    addClassPatternButton.addEventListener("click", function() {
	add_pattern({
	    classURLpattern: "",
	    classToRemove: ""
	},'includeClassRules');
    });

    var addIDPatternButton = document.getElementById("includeIDAddButton");
    addIDPatternButton.addEventListener("click", function() {
	add_pattern({
	    idURLpattern: "",
	    idToRemove: ""
	},'includeIDRules');
    });

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
