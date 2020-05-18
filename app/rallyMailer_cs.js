function showSelectedArtifacts(selectedArtifacts) {
  chrome.runtime.sendMessage({
    action: "showSelectedArtifacts",
    artifacts: selectedArtifacts,
    activeArtifactOnly: false
  });
}

function showActiveArtifact(activeArtifact) {
  if (activeArtifact) {
    chrome.runtime.sendMessage({
      action: "showSelectedArtifacts",
      artifacts: [activeArtifact],
      activeArtifactOnly: true
    });
  } else {
    chrome.runtime.sendMessage({
      action: "showSelectedArtifacts",
      artifacts: [],
      activeArtifactOnly: false
    });
  }
}

// Creates artifact objects from passed in collection of artifact elements
function mapElementsToArtifactObjects(
  artifactElements,
  artifactLinkSelector,
  artifactNameSelector,
  artifactIdSelector
) {
  return artifactElements.map(function(index, item) {
    var artifactElement = $(item);
    var artifactLink = artifactElement.find(artifactLinkSelector);
    var artifactName = artifactElement.find(artifactNameSelector);

    var artifactLinkElement = artifactLink.get(0);

    return {
      artifactId: artifactIdSelector ? artifactElement.find(artifactIdSelector).text() : artifactLink.text(),
      artifactHref: artifactLinkElement.href,
      artifactName: artifactName.text()
    };
  });
}

// Gets selected artifacts from any part of rally using the newer rally tree grid with built in checkboxes
function getSelectedTreeGridArtifacts() {
  var selectedArtifacts = $(".x4-tree-view.grid-view-bulk-edit .x4-grid-row-selected");
  var artifactLinkSelector = "td[class*=formattedid] a.formatted-id-link:first";
  var artifactNameSelector = "td.name div:first";
  return $.makeArray(mapElementsToArtifactObjects(selectedArtifacts, artifactLinkSelector, artifactNameSelector));
}

// Gets selected artifacts from rally using the new data tables
function getSelectedSmbDataTableArtifacts() {
  var selectedArtifacts = $(".smb-TableCell--checkbox .smb-Checkbox.is-checked").parentsUntil("tbody", "tr");
  var artifactLinkSelector = ".smb-TableCell--formattedID .chr-FormattedId";
  var artifactNameSelector = ".smb-TableCell--name";
  var artifactIdSelector = ".smb-TableCell--formattedID .chr-FormattedId-idText";
  return $.makeArray(
    mapElementsToArtifactObjects(selectedArtifacts, artifactLinkSelector, artifactNameSelector, artifactIdSelector)
  ).reverse();
}

// Gets selected artifacts for search grid in rally (https://rally1.rallydev.com/#/search)
function getSelectedSearchArtifacts() {
  var selectedArtifacts = $(".rally-mailer-search-select:checked").parentsUntil("tbody", "tr");
  var artifactLinkSelector = "td[class*=formattedid] a.formatted-id-link:first";
  var artifactNameSelector = "td.name div:first";

  // Note: reverse is being used here because parentsUntil gets collection bottom up instead of top down
  return $.makeArray(
    mapElementsToArtifactObjects(selectedArtifacts, artifactLinkSelector, artifactNameSelector)
  ).reverse();
}

// Gets selected artifacts for browser table in defect (https://rally1.rallydev.com/#/defects) and task (https://rally1.rallydev.com/#/tasks) views
function getSelectedBrowserArtifacts() {
  var selectedArtifacts = $(".rally-mailer-browser-select:checked").parentsUntil("tbody", "tr");
  var artifactLinkSelector = "td.cn_formattedid0 a:first";
  var artifactNameSelector = "td.cn_name0 a:first";

  // Note: reverse is being used here because parentsUntil gets collection bottom up instead of top down
  return $.makeArray(
    mapElementsToArtifactObjects(selectedArtifacts, artifactLinkSelector, artifactNameSelector)
  ).reverse();
}

// Creates the ui component that will be injected into the dom
function createArtifactUiSelector(selectorClass) {
  var selector = $('<input type="checkbox" />').addClass(selectorClass);
  return selector;
}

// Gets all injectable artifact elements
function getInjectableArtifactElements(artifactElementSelector) {
  var allInjectableElements = $(artifactElementSelector);

  // Filter out injectable elements that already contain injected selector
  var injectableElements = allInjectableElements.filter(function(index, element) {
    return (
      $(element)
        .find(".rally-mailer-select")
        .first().length === 0
    );
  });

  return injectableElements;
}

// Adds artifact ui selector for search grid in rally (https://rally1.rallydev.com/#/search)
function injectSearchArtifactSelectors() {
  var artifactUiSelector = createArtifactUiSelector("rally-mailer-select rally-mailer-search-select");
  var artifactElementSelector = ".x4-tree-view:not(.grid-view-bulk-edit) .x4-grid-data-row td:first-child";
  var injectableElements = getInjectableArtifactElements(artifactElementSelector);
  injectableElements.prepend(artifactUiSelector);
}

// Adds artifact ui selector for browser table in defect (https://rally1.rallydev.com/#/defects) and task (https://rally1.rallydev.com/#/tasks) views
function injectBrowserArtifactSelectors() {
  var artifactUiSelector = createArtifactUiSelector("rally-mailer-select rally-mailer-browser-select");
  var artifactElementSelector = ".browser > tbody > tr > td:first-child";
  var injectableElements = getInjectableArtifactElements(artifactElementSelector);
  injectableElements.prepend(artifactUiSelector);
}

var rallyArtifactHelper = {
  // Gets all artifacts that selected in the dom
  getAllSelectedArtifacts: function() {
    var smbDataTableArtifacts = getSelectedSmbDataTableArtifacts();
    var treeGridArtifacts = getSelectedTreeGridArtifacts();
    var searchArtifacts = getSelectedSearchArtifacts();
    var browserArtifacts = getSelectedBrowserArtifacts();

    return [].concat.apply([], [smbDataTableArtifacts, treeGridArtifacts, searchArtifacts, browserArtifacts]);
  },

  // Gets the artifact details from the current Detail Page being shown
  getDetailPageArtifact: function() {
    var artifactId = $(".chr-QuickDetailFormattedId-panelTitle");
    var artifactName = $(".smb-TextInput-renderedText");
    if (artifactId.length && artifactName.length) {
      return {
        artifactId: artifactId.text(),
        artifactHref: document.location.href,
        artifactName: artifactName.text()
      };
    } else {
      return null;
    }
  },

  // Gets the artifact details from the current quick page details pupup shown
  getQuickDetailPageArtifact: function() {
    var artifactId = $(".chr-QuickDetailFormattedId-panelTitle");
    var artifactIdLink = $(".chr-QuickDetailFormattedId-link");
    var artifactName = $(".chr-QuickDetailAttributeEditorWrapper--name .smb-TextInput-input");
    if (artifactId.length && artifactName.length) {
      return {
        artifactId: artifactId.text(),
        artifactHref: `${document.location.origin}/${artifactIdLink.attr("href")}`,
        artifactName: artifactName.val()
      };
    } else {
      return null;
    }
  },

  // Adds ui selectors to rally artifact views that don't contain a selection mechanism
  injectArtifactUiSelectors: function() {
    injectSearchArtifactSelectors();
    injectBrowserArtifactSelectors();
  }
};

function poll() {
  setTimeout(checkForLegacyGrid, 3000);
}

function checkForLegacyGrid() {
  rallyArtifactHelper.injectArtifactUiSelectors();
  poll();
}

$(function() {
  poll();
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "getSelectedArtifacts") {
    var selectedArtifacts = rallyArtifactHelper.getAllSelectedArtifacts();

    // When no artifacts have been checked then try to get the current artifact's detail page being shown
    if (selectedArtifacts.length === 0) {
      var activeArtifact = rallyArtifactHelper.getQuickDetailPageArtifact();
      if (!activeArtifact) {
        activeArtifact = rallyArtifactHelper.getDetailPageArtifact();
      }
      showActiveArtifact(activeArtifact);
    } else {
      showSelectedArtifacts(selectedArtifacts);
    }
  }

  if (request.action === "sendEmail") {
    document.location.href = "mailto:";
  }
});

chrome.runtime.sendMessage({ action: "showRallyMailerIcon" });
