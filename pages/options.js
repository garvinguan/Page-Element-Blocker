function add_pattern(rule, identifier) {
    if (identifier==='includeClassRules')
	add_pattern_row(rule,identifier,['classURLpattern','classToRemove']);
    else
	add_pattern_row(rule,identifier,['idURLpattern','idToRemove']);

}

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

function save_options() {
    var templateInstances = document.querySelectorAll('.includeClassRuleTemplateInstance'),
	idUrl, idPatterns, classUrl, classPatterns, options = {}, idOptions = {}, classOptions = {};

    for(var i=0;i<templateInstances.length; i++){
	classUrl = templateInstances[i].getElementsByClassName('classURLpattern')[0].value;
	classPatterns = templateInstances[i].getElementsByClassName('classToRemove')[0].value.replace(/\s+/g, '');
	if(classPatterns.length < 1) continue;
	classPatterns = classPatterns.split(',');
	var classPattern = "";
	var numPatterns = classPatterns.length-1;
	for (var j=0;j<numPatterns; j++){
	    if (classPatterns[j].substring(0,1) !== '.')
		classPattern+='.' + classPatterns[j] + ',';
	    else
		classPattern+= classPatterns[j] + ',';
	}
	if (classPatterns[numPatterns].substring(0,1) !== '.')
	    classPattern+='.' + classPatterns[numPatterns];
	else
	    classPattern+= classPatterns[numPatterns];

	classOptions[classUrl]=classPattern;
    }

    templateInstances = document.querySelectorAll('.includeIDRuleTemplateInstance');
    for(i=0;i<templateInstances.length; i++){
	idUrl = templateInstances[i].getElementsByClassName('idURLpattern')[0].value;
	idPatterns = templateInstances[i].getElementsByClassName('idToRemove')[0].value.replace(/\s+/g, '');
	if(idPatterns.length < 1) continue;
	idPatterns = idPatterns.split(',');
	var idPattern = "";
	numPatterns = idPatterns.length-1;
	for (j=0;j<numPatterns; j++){
	    if (idPatterns[j].substring(0,1) !== '#')
		idPattern += '#' + idPatterns[j] + ',';
	    else
		idPattern += idPatterns[j] + ',';
	}
	if (idPatterns[numPatterns].substring(0,1) !== '#')
	    idPattern+='#' + idPatterns[numPatterns];
	else
	    idPattern+= idPatterns[numPatterns];

	idOptions[idUrl] = idPattern;
    }
    options['idOptions']=idOptions;
    options['classOptions']=classOptions;
    console.log('saving options');
    console.log(options);
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
	    classToRemove: items.classOptions[allKeys[i]]
	},'includeClassRules');
    }

    allKeys = Object.keys(items.idOptions);
    for ( i=0; i<allKeys.length; i++)
    {
	add_pattern({
	    idURLpattern: allKeys[i],
	    idToRemove: items.idOptions[allKeys[i]]
	},'includeIDRules');
    }
}

function restore_options() {
    chrome.storage.sync.get(null, function(items){
	console.log("restoring options");
	console.log(items);
	restoreOptionRows(items);
    });
};

initOptionsPage = function() {
    restore_options();
    var saveButton = document.getElementById('save');

    onUpdated = function() {
        saveButton.removeAttribute("disabled");
        return saveButton.innerHTML = "Save Changes";
    };

    saveOptions = function() {
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

document.addEventListener("DOMContentLoaded", initOptionsPage);
