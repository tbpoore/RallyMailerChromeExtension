var copyHelper = {
    selectText: function(containerId) {
        if (document.selection) {
            var range = document.body.createTextRange();
            range.moveToElementText(document.getElementById(containerId));
            range.select();
        } else if (window.getSelection) {
            window.getSelection().removeAllRanges();
            var range = document.createRange();
            range.selectNode(document.getElementById(containerId));
            window.getSelection().addRange(range);
        }
    },

    clearSelection: function() {
        if (window.getSelection) {
            if (window.getSelection().empty) {  // Chrome
                window.getSelection().empty();
            }
        } 
    }
};

var actions = {
    getSelectedArtifacts: function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedArtifacts' });
        });
    },

    sendEmail: function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'sendEmail' });
            window.close();
        });
    },

    copyToClipboard: function() {
        copyHelper.selectText('artifactsTable');
        var succeeded;
        try {
            succeeded = document.execCommand('copy');
        }
        catch (err) {
            succeeded = false;
        }

        copyHelper.clearSelection();

        return succeeded;
    },

    copyTextToClipboard: function(text) {
        var fakeElem = document.createElement('textarea');
        fakeElem.style.position = 'absolute';
        fakeElem.style.left = '-9999px';
        fakeElem.style.top = (window.pageYOffset || document.documentElement.scrollTop) + 'px';
        fakeElem.setAttribute('readonly', '');
        fakeElem.value = text;

        document.body.appendChild(fakeElem);

        fakeElem.focus();
        fakeElem.select();

        var succeeded;
        try {
            succeeded = document.execCommand('copy');
        }
        catch (err) {
            succeeded = false;
        }

        if (fakeElem) {
            document.body.removeChild(fakeElem);
            fakeElem = null;
        }

        return succeeded;
    }

}

function activateActionButton(actionButton) {
    var action = actionButton;
    action
        .velocity({
            scale: 0
        }, 0)
        .velocity({
            properties: {
                scale: 1
            },
            options: {
                duration: 200,
                display: 'block',
                complete: function() {
                    action.tooltip({ delay: 50 });
                }
            }
        });
}

function activateEmailAction() {
    $('#copyToClipboard')
        .velocity({
            properties: {
                scale: 0,
            },
            options: {
                delay: 200,
                duration: 200,
                display: 'none',
                complete: function() {
                    activateActionButton($('#sendEmail'));
                }
            }
        });
}

function showSelectedArtifacts(artifacts, activeArtifactOnly) {
    /* When no artifacts are checked in rally show no artifacts message */
    if (!artifacts || artifacts.length === 0) {
        $('#noArtifactsSelected').show();
        return;
    }

    var artifactsTableBody = $('#artifactsTableBody');
    artifactsTableBody.empty();

    artifacts.forEach(function (artifact) {
        var artifactLink = '<a class="artifact-link" href="' + artifact.artifactHref + '">' + artifact.artifactId + '</a>';
        var artifactRow = '<tr><td>' + artifactLink + '</td><td>' + artifact.artifactName + '</td></tr>';
        artifactsTableBody.append(artifactRow);
    });

    if (activeArtifactOnly) {
        $('.artifacts-header').text('Active Artifact');
    } else {
        $('.artifacts-header').text('Selected Artifacts');
    }

    // When artifact link is clicked copy the artifact as a visual studio commit comment
    // Eg: [artifactId] artifactName
    $('.artifact-link').click(function () {
        var artifactId = $(this).text();
        var artifactName = $(this).parent().next().text();
        var artifactComment = '[' + artifactId + '] ' + artifactName;

        var succeeded = actions.copyTextToClipboard(artifactComment);

        if (succeeded) {
            var artifactCommentToast = 'Copied ' + artifactId + ' to Clipboard';
            Materialize.toast(artifactCommentToast, 3000);
        }
    });

    $('#artifacts').show();
    activateActionButton($('#copyToClipboard'));
}

function registerActionEvents() {
    $('#sendEmail').click(function () {
        if ($(this).hasClass('disabled')) return;

        actions.sendEmail();
    });

    $('#copyToClipboard').click(function () {
        if ($(this).hasClass('disabled')) return;

        var succeeded = actions.copyToClipboard();

        if (succeeded) {
            $('#copiedBadge').velocity({ opacity: 1 }, { display: 'block' });
            activateEmailAction();
        }
    });

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.action === 'showSelectedArtifacts') {
            showSelectedArtifacts(request.artifacts, request.activaeArtifactOnly);
        }
    });
}

$(function () {
    /* Initialize */
    actions.getSelectedArtifacts();
    registerActionEvents();
});

