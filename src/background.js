
browser.runtime.onMessage.addListener(handleMessage);

function handleMessage(request) {
  if (request.topic === 'download') {
    download(request.url, request.filename);
  }
}

function download(url, filename) {
  browser.downloads.download({ url, filename, saveAs: true })
    .then(id => console.log('downloading', id))
    .catch(err => console.error('Error: ', err));
}
