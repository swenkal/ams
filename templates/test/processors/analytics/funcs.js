const fs = require('fs'),
      path = require('path');

module.exports = {
  getDiscAlliasFromUrl,
  convertDateToString,
  checkDateFormat,
  getDiscAlliasFromDiscFilesUrl,
  getDiscAlliasFromFileUrl,
  getFileIDFromUrl
}

/*COMMON FUNCS*/
function getDiscAlliasFromUrl(clientUrl) {
  let requestedURL = decodeURI(clientUrl);
  const delimeteredURL = requestedURL.split('/');
  return delimeteredURL[delimeteredURL.length - 2];
}

function convertDateToString(date) {
  const year = date.getFullYear();

  let month = date.getMonth() + 1;
  month = month < 10 ? `0${month}` : month;

  let day = date.getDate();
  day = day < 10 ? `0${day}` : day;

  return `${year}-${month}-${day}`;
}

function checkDateFormat(date) {
  const dateRegEx = /^20\d{2}-[0-1]\d-[0-3]\d$/;
  return dateRegEx.test(date);
}

/*FILES analytics FUNCS*/
function getDiscAlliasFromDiscFilesUrl(clientUrl) {
  let requestedURL = decodeURI(clientUrl);
  let delimeteredURL = requestedURL.split('/');
  return delimeteredURL[delimeteredURL.length - 3];
}

/*ONE FILE analytics FUNCS*/
function getDiscAlliasFromFileUrl(clientUrl) {
  let requestedURL = decodeURI(clientUrl);
  let delimeteredURL = requestedURL.split('/');
  return delimeteredURL[delimeteredURL.length - 4];
}

function getFileIDFromUrl(clientUrl) {
  let requestedURL = decodeURI(clientUrl);
  console.log(requestedURL);
  let delimeteredURL = requestedURL.split('/');
  console.log(delimeteredURL);
  return delimeteredURL[delimeteredURL.length - 2];
}
