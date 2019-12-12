console.log('Loading arte-downloader add-on');

onUrlChange(update);

function update() {
  const webUrl = document.URL;
  const name = webUrl.split('/').filter(str => !!str).pop();
  const videoId = webUrl.replace(/.*\/videos\/(.*?)\/.*/, '$1');
  console.log(`Initialize arte-downloader add-on for ${name}`);
  initializeMainElement(name);
  initializeContent(name, videoId).catch(err => console.error(err));
}

async function initializeContent(name, videoId) {
  appendHeader(name);
  const data = await getJson(`https://api.arte.tv/api/player/v1/config/de/${videoId}?autostart=1&lifeCycle=1`);
  const vdata = data.videoJsonPlayer;
  const versions = Object.keys(vdata.VSR)
    .map(key => vdata.VSR[key])
    .filter(version => version.mediaType === 'mp4');
  versions.sort(compareVersions);
  for (const version of versions) {
    appendVersion(name, version);
  }
}

function appendHeader(name) {
  const element = createElement(`<div><b>${name}</b></div>`);
  document.getElementById('arte-downloader-content').append(element);
}

function appendVersion(name, version) {
  const filename = `${name}.${version.mediaType}`;
  const text = `${version.versionLibelle} ${version.width}x${version.height} ${version.mediaType}`;
  const link = createElement(`<div><a>${text}</a></div>`);
  link.onclick = () => download(version.url, filename);
  document.getElementById('arte-downloader-content').append(link);
}

function download(url, filename) {
  browser.runtime.sendMessage({ topic: 'download', url, filename }).catch(console.error);
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }
  return await response.json();
}

function initializeMainElement() {
  const mainElement = getMainElement();
  while (mainElement.firstChild) {
    mainElement.removeChild(mainElement.firstChild);
  }
  const toggleButton = createElement('<div id="arte-downloader-toggle"><a>…</a></div>');
  const contentDiv = createElement('<div id="arte-downloader-content"></div>');
  contentDiv.hidden = true;
  toggleButton.firstChild.onclick = () => contentDiv.hidden = !contentDiv.hidden;
  mainElement.append(toggleButton, contentDiv);
}

function getMainElement() {
  const existingElement = document.getElementById('arte-downloader');
  if (existingElement) {
    return existingElement;
  }
  const style = 'position: absolute; top: 0; left: 0; background-color: white; color: black; padding: 10px; z-index: 100000';
  const newElement = createElement(`<div id="arte-downloader" style="${style}"><div>`);
  document.body.appendChild(newElement);
  return newElement;
}

function compareVersions (a, b) {
  if (a.versionLibelle < b.versionLibelle) {
    return -1;
  }
  if (a.versionLibelle > b.versionLibelle) {
    return 1;
  }
  if (a.width < b.width) {
    return -1;
  }
  if (a.width > b.width) {
    return 1;
  }
  return 0;
}

function createElement(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

function onUrlChange(fn) {
  function detectChange() {
    if (document.URL !== detectChange.currentUrl) {
      detectChange.currentUrl = document.URL;
      fn.call();
    }
    setTimeout(detectChange, 1000);
  }
  detectChange();
}
