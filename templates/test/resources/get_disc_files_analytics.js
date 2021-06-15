/*
COMMON VARS
*/
//getting discName from current url
let pathName = window.location.pathname;
let delimeteredPath = pathName.split('/');
const discName = delimeteredPath[delimeteredPath.length - 3];

//getting start and end date inputs
const start = document.getElementById('start');
const end = document.getElementById('end');

// const vars for disc analytics page
const HOST = 'http://localhost:5000/';
const DISC_TYPE = 'type=disc_info';

console.log(files);

let ulTop = document.getElementById('top');
/*
CHART VARS
*/
//getting canvas elems for download distribution
let canvasDistrib = document.getElementById('distribution');

let dataDistrib = {
    labels: [],
    datasets: [{
      label: 'Кол-во скачиваний',
      data: [],
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

let options = {
    plugins: {
      legend: {
          display: false
      }
    }
}
//create Chart objects for each question
let distribution = new Chart(canvasDistrib, {
    type: 'line',
    data: dataDistrib,
    options: options
});

document.addEventListener('DOMContentLoaded', () => {

  changeFilesDiscInfo(discName, start.value, end.value);

});

const btnAnalyze = document.getElementById('analyze');

btnAnalyze.addEventListener('click', () => {

  changeFilesDiscInfo(discName, start.value, end.value);

});

function changeFilesDiscInfo(discName, start, end) {
  fetch(`${HOST}files?${DISC_TYPE}&disc=${discName}&start=${start}&end=${end}`)
    .then(response => response.json())
    .then(result => {
      console.log(result);
      dataDistrib.labels = Object.keys(result['graph']);
      dataDistrib.datasets[0].data = Object.values(result['graph']);
      distribution.destroy();
      distribution = new Chart(canvasDistrib, {
          type: 'line',
          data: dataDistrib,
          options: options
      });

      createTopList(result['top'], discName, start, end);
    })
    .catch(err => console.log(err));
}


function createTopList(top, discName, start, end) {
  let titleLi = ulTop.firstElementChild;
  ulTop.innerHTML = '';
  ulTop.append(titleLi);

  let li = document.createElement('li');
  li.className = 'list-group-item';

  let rowDiv = document.createElement('div');
  rowDiv.className = 'row';
  let aDiv = document.createElement('a');
  aDiv.className = 'col-6';
  let colDiv = document.createElement('div');
  colDiv.className = 'col-3';

  let colNoneDiv = document.createElement('div');
  colNoneDiv.className = 'col-3 d-none d-md-block';

  for (let elem of top) {
    let curLi = li.cloneNode();
    let curRow = rowDiv.cloneNode();
    let fileDiv = aDiv.cloneNode();
    let href = `/analytics/${discName}/file/${elem.fileID}/?start=${start}&end=${end}`;
    fileDiv.setAttribute('href', href);
    fileDiv.innerHTML = files[elem.fileID] ? files[elem.fileID] : elem.fileID;
    let countDiv = colDiv.cloneNode();
    countDiv.innerHTML = elem.downloads;
    let archiveDiv = colNoneDiv.cloneNode();
    archiveDiv.innerHTML = elem.archive;
    curRow.append(fileDiv);
    curRow.append(countDiv);
    curRow.append(archiveDiv);
    curLi.append(curRow);
    ulTop.append(curLi);
  }
}
