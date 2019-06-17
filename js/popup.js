const itemBaseUrl = "https://news.ycombinator.com/item?id=";
const userBaseUrl = "https://news.ycombinator.com/user?id=";
const searchApiBaseUrl = "http://hn.algolia.com/api/v1/search?restrictSearchableAttributes=url&hitsPerPage=50&query=";
const searchBaseUrl = "http://hn.algolia.com/?restrictSearchableAttributes=url&hitsPerPage=50&query=";
const hnApiBaseUrl = "https://api.hackerwebapp.com/item/";
const submitBaseUrl = "https://news.ycombinator.com/submitlink?u=";

function renderComment(comments) {
  var body = "";
  for (let comment of comments) {
    body += "<details open>";
    body += "<summary><a href='"+userBaseUrl+comment.user+"'>"+comment.user+"</a> "+comment.time_ago+"</summary>";
    body += "<div class='comment-body'>"+comment.content+"</div>";
    if (comment.comments.length > 0) {
      body += "<div class='comment-child'>";
      body += renderComment(comment.comments);
      body += "</div>";
    }
    body += "</details>";
  }
  return body;
}

$(function () {
  chrome.tabs.getSelected(null, function(tab) {
    const queryUrl = encodeURIComponent(tab.url.replace(/^https?:\/\//, ""));
    fetch(searchApiBaseUrl+queryUrl).then(function(searchResponse) {
      if (!searchResponse.ok) {
        throw new Error();
      };
      return searchResponse.json();
    }).then(function(json) {
      if (json.nbHits > 0) {
        var tsNow = Math.round((new Date()).getTime() / 1000);
        var hits = json.nbHits;
        var points = json.hits[0].points;
        var itemUrl = itemBaseUrl+json.hits[0].objectID;
        var authorName = json.hits[0].author;
        var numComments = json.hits[0].num_comments;
        chrome.browserAction.setBadgeText({text:String(points)});
        chrome.storage.local.set({[queryUrl]: points+":"+tsNow}, function() {});
        $('#search').html("<a href='"+searchBaseUrl+queryUrl+"'>"+hits + " item(s) found</a>");
        $('#title').html("<a href='"+itemUrl+"'>"+json.hits[0].title+"</a>");
        $('#url').html("<a href='"+json.hits[0].url+"'>"+json.hits[0].url+"</a>");
        $('#item-info').html(points+" points by <a href='"+userBaseUrl+authorName+"'>"+authorName+"</a> "+timeago.format(json.hits[0].created_at)+" | "+numComments+" comments");

        fetch(hnApiBaseUrl+json.hits[0].objectID).then(function(response) {
          return response.json();
        }).then(function(itemJson) {
          if (itemJson.comments.length > 0) {
            $('.body').html(renderComment(itemJson.comments));
          } else {
            $('.body').text("No comments added.");
          }
        });
      } else {
        chrome.browserAction.setBadgeText({text:String(0)});
        chrome.storage.local.set({[queryUrl]: points+":"+tsNow}, function() {});
        $('#search').text("0 item found");
        var msg = "No item found for this page.";
        msg += "<p><a href='"+submitBaseUrl+tab.url+"&t="+tab.title+"'>Submit this page to Hacker News.</a></p>";
        $('.body').html(msg);
      }
    }).catch(function(error) {
      $('.body').text("Failed to get data.");
    });
  });
});
