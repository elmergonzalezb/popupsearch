import axios from 'axios';
import querystring from 'querystring-browser';
import fastFormat from 'fast-format';

var linkSel = 'h3.r a'
var descSel = 'span.st'
var sublinksSel = 'div.osl';
var itemSel = 'div.g'
var nextSel = 'td.b a span'

var URL = '%s://www.google.%s/search?hl=%s&q=%s&start=%s&sa=N&num=%s&ie=UTF-8&oe=UTF-8&gws_rd=ssl'

var nextTextErrorMsg = 'Translate `google.nextText` option to selected language to detect next results link.'
var protocolErrorMsg = "Protocol `google.protocol` needs to be set to either 'http' or 'https', please use a valid protocol. Setting the protocol to 'https'."

// start parameter is optional
let google = (query, start) => {
  var startIndex = 0
  if (start) {
    startIndex = start
  }
  return igoogle(query, startIndex);
}

google.resultsPerPage = 10
google.tld = 'com'
google.lang = 'en'
google.nextText = 'Next'
google.protocol = 'https'

var igoogle = function (query, start) {
  if (google.resultsPerPage > 100) google.resultsPerPage = 100 // Google won't allow greater than 100 anyway
  if (google.lang !== 'en' && google.nextText === 'Next') console.warn(nextTextErrorMsg)
  if (google.protocol !== 'http' && google.protocol !== 'https') {
    google.protocol = 'https'
    console.warn(protocolErrorMsg)
  }

  // timeframe is optional. splice in if set
  if (google.timeSpan) {
    URL = URL.indexOf('tbs=qdr:') >= 0 ? URL.replace(/tbs=qdr:[snhdwmy]\d*/, 'tbs=qdr:' + google.timeSpan) : URL.concat('&tbs=qdr:', google.timeSpan)
  }
  var newUrl = fastFormat(URL, google.protocol, google.tld, google.lang, querystring.escape(query), start, google.resultsPerPage)

  return axios.get(newUrl).then((resp) => {
    let body = resp.data;
    var $body = $(body);
    var res = {
      url: newUrl,
      query: query,
      start: start,
      links: [],
      startNext: 0
    }

    $body.find(itemSel).each(function() {
      var linkElem = $(this).find(linkSel);
      var descElem = $(this).find(descSel);
      var sublinksElem = $(this).find(sublinksSel);
      var item = {
        title: linkElem.first().text(),
        link: null,
        description: null,
        href: null
      }
      var qsObj = querystring.parse(linkElem.attr('href'))

      if (qsObj['/url?q']) {
        item.link = qsObj['/url?q']
        item.href = item.link
      } else {
        item.link = linkElem.attr('href')
        item.href = item.link
      }
      var $date = descElem.find('span.f');
      if ($date.length > 0) {
        $date.addClass('date');
      }

      item.description = descElem.html()
      if (sublinksElem.length > 0) {
        item.description = `<div>${item.description}</div><div>${sublinksElem.html()}</div>`;
      }

      if (item.href && item.title) {
        res.links.push(item)
      }
    })

    if ($body.find(nextSel).last().text() === google.nextText) {
      res.startNext = start + res.links.length;
    }

    return res;
  }, (error) => {
    return new Error('Error on response' + (error.response ? ' (' + error.response.status + ')' : '') + ':' + error.message);
  });
}

export default google;
