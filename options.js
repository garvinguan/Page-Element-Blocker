// Saves options to chrome.storage
function save_options() {
  var color = document.getElementById('color').value;
  var likesColor = document.getElementById('like').checked;
  chrome.storage.sync.set({
    favoriteColor: color,
    likesColor: likesColor
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    favoriteColor: 'red',
    likesColor: true
  }, function(items) {
    document.getElementById('color').value = items.favoriteColor;
    document.getElementById('like').checked = items.likesColor;
  });
}

function add_pattern() {
    content = document.querySelector('#includeRuleTemplate').content;
    row = document.importNode(content, true);
    ref = ["pattern", "passKeys"];
    for (i = 0, len = ref.length; i < len; i++) {
	field = ref[i];
	element = row.querySelector("." + field);
	element.value = rule[field];
	ref1 = ["input", "change"];
	for (j = 0, len1 = ref1.length; j < len1; j++) {
            event = ref1[j];
            element.addEventListener(event, this.onUpdated);
	}
    }
    this.getRemoveButton(row).addEventListener("click", (function(_this) {
	return function(event) {
            rule = event.target.parentNode.parentNode;
            rule.parentNode.removeChild(rule);
            return _this.onUpdated();
	};
    })(this));
    this.element.appendChild(row);
    return this.element.children[this.element.children.length - 1];
}

initOptionsPage = function() {
    var activateHelpDialog, element, i, len, maintainAdvancedOptions, maintainLinkHintsView, name, onUpdated, ref, saveOptions, toggleAdvancedOptions, type;
    onUpdated = function() {
      $("saveOptions").removeAttribute("disabled");
      return $("saveOptions").innerHTML = "Save Changes";
    };

    saveOptions = function() {
      Option.saveOptions();
      $("saveOptions").disabled = true;
      return $("saveOptions").innerHTML = "No Changes";
    };
    $("saveOptions").addEventListener("click", saveOptions);
    ref = document.getElementsByClassName("nonEmptyTextOption");
    for (i = 0, len = ref.length; i < len; i++) {
      element = ref[i];
      element.className = element.className + " example info";
      element.innerHTML = "Leave empty to reset this option.";
    }
    window.onbeforeunload = function() {
      if (!$("saveOptions").disabled) {
        return "You have unsaved changes to options.";
      }
    };
    document.addEventListener("keyup", function(event) {
      var ref1;
      if (event.ctrlKey && event.keyCode === 13) {
        if (typeof document !== "undefined" && document !== null ? (ref1 = document.activeElement) != null ? ref1.blur : void 0 : void 0) {
          document.activeElement.blur();
        }
        return saveOptions();
      }
    });

};

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);

document.addEventListener("DOMContentLoaded", function() {
    var xhr;
    xhr = new XMLHttpRequest();
    xhr.open('GET', chrome.extension.getURL('pages/exclusions.html'), true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        $("exclusionScrollBox").innerHTML = xhr.responseText;
        switch (location.pathname) {
          case "/pages/options.html":
            return initOptionsPage();
          case "/pages/popup.html":
            return initPopupPage();
        }
      }
    };
    return xhr.send();
});
