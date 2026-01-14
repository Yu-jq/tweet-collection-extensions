chrome.action.onClicked.addListener(async e=>{e.id&&await chrome.sidePanel.open({tabId:e.id})});
