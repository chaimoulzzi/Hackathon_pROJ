const blockedSites = ["instagram.com", "facebook.com", "tiktok.com", "reddit.com", "twitter.com"];
const allowedYouTubeChannels = ["UC4a-Gbdw7vOaccHmFo40b9g", "UCX6b17PVsYBQ0ip5gyeme-Q"]; // Example: Khan Academy
const educationalKeywords = ["study", "tutorial", "lecture", "education", "learning"];
const inactivityLimit = 5 * 60 * 1000; // 5 minutes inactivity rule
let tabActivity = {};

// Track tab activity
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        enforceRules(tabId, changeInfo.url);
        tabActivity[tabId] = Date.now();
    }
});

chrome.tabs.onActivated.addListener(activeInfo => {
    tabActivity[activeInfo.tabId] = Date.now();
});

// Close inactive tabs
setInterval(() => {
    const now = Date.now();
    for (let tabId in tabActivity) {
        if (now - tabActivity[tabId] > inactivityLimit) {
            chrome.tabs.remove(parseInt(tabId));
        }
    }
}, 60000);

// Enforce rules
function enforceRules(tabId, url) {
    let isBlocked = blockedSites.some(site => url.includes(site));
    if (url.includes("youtube.com/watch")) {
        fetchYouTubeVideoData(tabId, url);
    } else if (isBlocked) {
        chrome.tabs.remove(tabId);
        alertUser("Blocked site! Stay focused.");
    }
}

// Fetch YouTube video details
function fetchYouTubeVideoData(tabId, url) {
    let videoId = new URL(url).searchParams.get("v");
    fetch(`https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${videoId}&format=json`)
        .then(response => response.json())
        .then(data => {
            if (!isAllowedYouTubeContent(data.author_url, data.title)) {
                chrome.tabs.remove(tabId);
                alertUser("Non-educational YouTube content blocked!");
            }
        })
        .catch(() => chrome.tabs.remove(tabId));
}

// Check if YouTube video is educational
function isAllowedYouTubeContent(channelUrl, title) {
    return allowedYouTubeChannels.some(channel => channelUrl.includes(channel)) ||
           educationalKeywords.some(keyword => title.toLowerCase().includes(keyword));
}

// Alert user
function alertUser(message) {
    chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "Focus Guard",
        message: message
    });
}
