const VISIT_TIME_MS = 15 * 1000, //after 30 minutes visitID will delete
  IDLE_TIMEOUT_SEC = 10, //idleTimeoutInSeconds
  ANALYTICS_HOST = 'http://localhost:5000',
  PAGE_INFO_URL = `${ANALYTICS_HOST}pages`,
  VISIT_INFO_URL = `${ANALYTICS_HOST}visits`;


let startIdleMs = 0;
/*declare class instances*/
let pageInfo, visit;

window.addEventListener('load', grabKnowning);
window.addEventListener('beforeunload', sendPageInfo);

class Visit {

  constructor(uniqueID, visitID, cookieAgree) {
    this.uniqueID = uniqueID;
    this.visitID = visitID;
    this.cookieAgree = cookieAgree;
    this.browser = this.defineBrowser();
    this.screenWidth = this.getScreenWidth();
    this.screenHeight = this.getScreenHeight()
    this.createDate = Date.now();
  }

  set newVisitID(value) {
    this.visitID = value;
    this.createDate = Date.now();
  }

  getScreenWidth() {
    return window.screen.width;
  }

  getScreenHeight() {
    return window.screen.height;
  }

  defineBrowser() {
    const usrAg = navigator.userAgent;
    let browser = "Some browser";

    //обычные браузеры
    if (usrAg.search(/Safari/) > 0) browser = 'Safari' ;
    if (usrAg.search(/Firefox/) > 0) browser = 'Firefox';
    if (usrAg.search(/MSIE/) > 0 ||
        usrAg.search(/NET CLR /) > 0) browser = 'IE PC';
    if (usrAg.search(/Chrome/) > 0) browser = 'Google Chrome';
    if (usrAg.search(/YaBrowser/) > 0) browser = 'Yandex Browser';
    if (usrAg.search(/OPR/) > 0) browser = 'Opera PC';
    if (usrAg.search(/Konqueror/) > 0) browser = 'Konqueror';
    if (usrAg.search(/Iceweasel/) > 0) browser = 'Debian Iceweasel';
    if (usrAg.search(/SeaMonkey/) > 0) browser = 'SeaMonkey';
    if (usrAg.search(/Edge/) > 0) browser = 'MS Edge (Old)';
    if (usrAg.search(/Edg/) > 0) browser = 'MS Edge (Chrome Engine)';

    //мобильные браузеры
    if (usrAg.search(/UCBrowser/i) > 0) browser = 'UC Browser';
    if (usrAg.search(/Opera Mini/i) > 0) browser = 'Opera Mini';
    if (usrAg.search(/iPhone|iPad|iPod/i) > 0) browser = 'Apple iOS';
    if (usrAg.search(/BlackBerry/i) > 0) browser = 'Blackberry Device';
    if (usrAg.search(/IEMobile/i) > 0) browser = 'IE Mobile';
    if (usrAg.search(/Android/i) > 0) browser = 'Android Device';
    if (usrAg.search(/Samsung/i) > 0) browser = 'Samsung Internet';

    return browser;
  }
}

class PageInfo {

  constructor(uniqueID, visitID) {
    this.uniqueID = uniqueID;
    this.visitID = visitID;
    this.loadTime = this.getPageLoadTime();
    this.pathName = this.getPagePath();
    this.referrer = this.getPageReferrer();
    this.hitDate = Date.now();
    this.activeTime = 0;
  }

  set newVisitID(value) {
    this.visitID = value;
    this.hitDate = Date.now();
    this.activeTime = 0;
  }

  set newActiveTime(activeTime) {
    this.activeTime = activeTime;
  }

  getPageReferrer() {
    return document.referrer;
  }

  getPagePath() {
    return window.location.pathname;
  }

  getPageLoadTime() {
    const timing = window.performance.timing;
    const loadTime = timing.domContentLoadedEventEnd - timing.navigationStart;
    return loadTime;
  }
}


function grabKnowning() {

  TimeMe.initialize({
    idleTimeoutInSeconds: IDLE_TIMEOUT_SEC, // stop recording time due to inactivity
  });

  let sendVisitInfo = false
  if (getCookie('visitID') === undefined) sendVisitInfo = true;

  /*common metrics*/
  const uniqueID = getUniqueID();
  const visitID = getVisitID();

  /*visit metrics*/
  const cookieAgree = getCookieAgreement();

  /*create visit example*/
  visit = new Visit(uniqueID, visitID, cookieAgree);
  console.log(`Visit class: ${JSON.stringify(visit)}`);
  if (sendVisitInfo) navigator.sendBeacon(`${ANALYTICS_HOST}/visits`, JSON.stringify(visit));

  pageInfo = new PageInfo(uniqueID, visitID);
  console.log(`PageInfo class: ${JSON.stringify(pageInfo)}`);

  TimeMe.callWhenUserLeaves(() => {
    startIdleMs = Date.now();
  });

  // Executes every time a user returns
  TimeMe.callWhenUserReturns(() => {
    let idleMs = Date.now() - startIdleMs;

    if (idleMs > VISIT_TIME_MS) {

      visit.newVisitID = generateVisitID()
      setCookie('visitID', visit.visitID);
      pageInfo.newActiveTime = TimeMe.getTimeOnCurrentPageInMilliseconds();
      navigator.sendBeacon(`${ANALYTICS_HOST}/pages`, JSON.stringify(pageInfo));
      navigator.sendBeacon(`${ANALYTICS_HOST}/visits`, JSON.stringify(visit))
      TimeMe.resetRecordedPageTime(TimeMe.currentPageName);
      TimeMe.startTimer();
      pageInfo.newVisitID = visit.visitID;
      console.log(JSON.stringify(visit));
      console.log(JSON.stringify(pageInfo));
    }

    startIdleMs = 0;
  });
}

function sendPageInfo() {
  pageInfo.newActiveTime = TimeMe.getTimeOnCurrentPageInMilliseconds();
  navigator.sendBeacon(`${ANALYTICS_HOST}/pages`, JSON.stringify(pageInfo));
}

//TODO: add modal window with accepting cookie
function getCookieAgreement(){
  return true;
}

/* get unique ID from cookies,
   or generate new unique ID and set cookiest*/
function getUniqueID() {
  let uniqueID = getCookie('uniqueID');

  if (uniqueID === undefined) {
    uniqueID = generateUniqueID();
    setCookie('uniqueID', uniqueID, { 'Max-Age': 86400 * 30 })
  }

 // console.log('uniqueID: ' + uniqueID);
  return uniqueID;
}

function generateUniqueID() {
  const milisec = Date.now();
  const randomInt = Math.floor(Math.random() * 90000) + 10000;
  return `${randomInt}${milisec}`;
}


/*CHECK visit ID and SET if not exist*/
function getVisitID() {
  let visitID = getCookie('visitID');
  console.log(document.cookie);
  console.log(`VisitID from cookies: ${visitID}`);
  if (visitID === undefined) {
    visitID = generateVisitID();
    setCookie('visitID', visitID);
  }

  //console.log('visitID: ' + visitID);
  return visitID;
}

function generateVisitID() {
  const milisec = Date.now();
  const randomInt = Math.floor(Math.random() * 90000) + 10000;
  return `${milisec}${randomInt}`;
}

// возвращает куки с указанным name,
// или undefined, если ничего не найдено
function getCookie(name) {
  let matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

function setCookie(name, value, options = {}) {

  options = {
    path: '/',
    // при необходимости добавьте другие значения по умолчанию
    ...options
  };

  if (options.expires instanceof Date) {
    options.expires = options.expires.toUTCString();
  }

  let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

  for (let optionKey in options) {
    updatedCookie += "; " + optionKey;
    let optionValue = options[optionKey];
    if (optionValue !== true) {
      updatedCookie += "=" + optionValue;
    }
  }

  document.cookie = updatedCookie;
}

function deleteCookie(name) {
  setCookie(name, "", {
    'max-age': -1
  })
}
