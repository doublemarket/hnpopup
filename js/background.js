const itemBaseUrl = "https://news.ycombinator.com/item?id=";
const userBaseUrl = "https://news.ycombinator.com/user?id=";
const apiBaseUrl = "http://hn.algolia.com/api/v1/search_by_date?restrictSearchableAttributes=url&hitsPerPage=50&query=";
const cacheTtl = 3600*12;

function setBadgeUsingCache(url) {
  const queryUrl = encodeURIComponent(url.replace(/^https?:\/\//, ""));
  chrome.storage.local.get(queryUrl, function(r) {
    var tsNow = Math.round((new Date()).getTime() / 1000);
    var result = r[queryUrl]
    if (Object.keys(r).length > 0 && result.split(":")[1] > (tsNow - cacheTtl)) {
      var points = result.split(":")[0];
      chrome.action.setBadgeText({text:String(points)});
    } else {
      fetch(apiBaseUrl+queryUrl).then(function(response) {
        if (!response.ok) {
          throw new Error();
        };
        return response.json();
      }).then(function(json) {
        var points;
        if (json.nbHits > 0) {
          points = json.hits[0].points;
        } else {
          points = 0;
        }
        chrome.action.setBadgeText({text:String(points)});
        chrome.storage.local.set({[queryUrl]: points+":"+tsNow}, function() {
        });
      }).catch(function(error) {
        console.log(error);
      });
    }
  });
}

chrome.action.setBadgeBackgroundColor({color:"#ff742b"});

chrome.tabs.onActivated.addListener(function(tabId, windowId) {
  chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
    setBadgeUsingCache(tabs[0].url);
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.url !== undefined && tab.active) {
    setBadgeUsingCache(tab.url);
  }
});
