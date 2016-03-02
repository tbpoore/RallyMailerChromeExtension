function showSelectedArtifacts(selectedArtifacts) {
    chrome.runtime.sendMessage({
        action: 'showSelectedArtifacts',
        artifacts: selectedArtifacts,
        activeArtifactOnly: false
    });
}

function showActiveArtifact(activeArtifact) {
    if (activeArtifact) {
        chrome.runtime.sendMessage({
            action: 'showSelectedArtifacts',
            artifacts: [activeArtifact],
            activeArtifactOnly: true
        });
    } else {
        chrome.runtime.sendMessage({
            action: 'showSelectedArtifacts',
            artifacts: [],
            activeArtifactOnly: false
        });
    }
}

var rallyArtifactHelper = {
    getSelectedArtifacts: function() {
        var selectedArtifacts = $('.x4-grid-row-selected');

        var artifactObjects = selectedArtifacts.map(function (index, item) {
            var itemRow = $(item);
            var artifactLink = itemRow.find('td[class*=formattedid] a.formatted-id-link:first');
            var artifactName = itemRow.find('td.name div:first');

            var artifactLinkElement = artifactLink.get(0);

            return {
                artifactId: artifactLink.text(),
                artifactHref: artifactLinkElement.href,
                artifactName: artifactName.text()
            };
        });

        return $.makeArray(artifactObjects);
    },

    // Gets the artifact details from the current Detail Page being shown
    getDetailPageArtifact: function() {
        var artifactId = $('.formatted-id');
        var artifactName = $('.detailFieldContainer input.simpleTextDetailField');
        if (artifactId.length && artifactName.length) {
            return {
                artifactId: artifactId.text(),
                artifactHref: document.location.href,
                artifactName: artifactName.val()
            };
        } else {
            return null;
        }
    }
};


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'getSelectedArtifacts') {
        var selectedArtifacts = rallyArtifactHelper.getSelectedArtifacts();

        // When no artifacts have been checked then try to get the current artifact's detail page being shown
        if (selectedArtifacts.length === 0) {
            var activeArtifact = rallyArtifactHelper.getDetailPageArtifact();
            showActiveArtifact(activeArtifact);
        } else {
            showSelectedArtifacts(selectedArtifacts);
        }
    }

    if (request.action === 'sendEmail') {
        document.location.href = 'mailto:';
    }
});

chrome.runtime.sendMessage({ action: 'showRallyMailerIcon' });