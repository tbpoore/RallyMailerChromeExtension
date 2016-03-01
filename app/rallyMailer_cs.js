chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action == "getSelectedArtifacts") {
        var activeArtifactOnly = false;
        var selectedArtifacts = $('.x4-grid-row-selected');

        var artifactObjects = selectedArtifacts.map(function(index, item) {
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

        var artifactsArray = $.makeArray(artifactObjects);

        // When no artifacts have been checked then try to get the current artifact's detail page being shown
        if (artifactsArray.length === 0) {
            var artifactId = $('.formatted-id');
            var artifactName = $('.detailFieldContainer input.simpleTextDetailField');

            if (artifactId.length && artifactName.length) {
                activeArtifactOnly = true;
                artifactsArray.push({
                    artifactId: artifactId.text(),
                    artifactHref: document.location.href,
                    artifactName: artifactName.val()
                });
            }
        }

        chrome.runtime.sendMessage({
            action: "showSelectedArtifacts",
            artifacts: artifactsArray,
            activeArtifactOnly: activeArtifactOnly
        });
    }


    if (request.action == "sendEmail") {
        document.location.href = 'mailto:';
    }
});

chrome.runtime.sendMessage({ action: "show" });