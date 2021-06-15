/*
COMMON VARS
*/
//getting discName from current url
let pathName = window.location.pathname;
let delimeteredPath = pathName.split('/');
const discName = delimeteredPath[delimeteredPath.length - 4];
const fileID = delimeteredPath[delimeteredPath.length - 2];

//getting start and end date inputs
const start = document.getElementById('start');
const end = document.getElementById('end');

// const vars for disc analytics page
const HOST = 'http://localhost:5000/';
const FILE_TYPE = 'type=file_info';

let ulDetail = document.getElementById('detail');
/*
CHART VARS
*/
//getting canvas elems for download distribution
let canvasPie = document.getElementById('filePie');

let backgroundColor = [
        "#2ecc71",
        "#3498db",
        "#9b59b6",
        "#e74c3c",
        "#f1c40f",
        "#95a5a6"
  /*  'rgba(75, 192, 192, 0.2)',
    'rgba(153, 102, 255, 0.2)',
    'rgba(255, 99, 132, 0.2)',
    'rgba(54, 162, 235, 0.2)',
    'rgba(255, 206, 86, 0.2)',
    'rgba(255, 159, 64, 0.2)'*/
];

let dataPie = {
    labels: [],
    datasets: [{
      label: 'Кол-во скачиваний',
      data: [],
      backgroundColor: backgroundColor,
      hoverOffset: 4
    }]
  };

let options = {
  plugins: {
    legend: {
      position: 'right',
      labels: {
        font: {
          size: 16
        }
      }
    }
  },
  aspectRatio: 3
};
//create Chart objects for each question
let pie = new Chart(canvasPie, {
    type: 'doughnut',
    data: dataPie,
    options: options
});

document.addEventListener('DOMContentLoaded', () => {

  changeFileInfo(discName, start.value, end.value);

});

const btnAnalyze = document.getElementById('analyze');

btnAnalyze.addEventListener('click', () => {

  changeFileInfo(discName, start.value, end.value);

});

function changeFileInfo(discName, start, end) {
  fetch(`${HOST}files?${FILE_TYPE}&disc=${discName}&start=${start}&end=${end}&fileID=${fileID}`)
    .then(response => response.json())
    .then(result => {
      console.log(result);
      let pieLabels = [];
      let pieValues = [];
      for (let elem of result['total']) {
        if (elem['group'] == '') continue;
        pieLabels.push(elem['group']);
        pieValues.push(elem['count']);
      }
      dataPie.labels = pieLabels;
      dataPie.datasets[0].data = pieValues;
      pie.destroy();
      pie = new Chart(canvasPie, {
          type: 'doughnut',
          data: dataPie,
          options: options
      });
      createDetailList(result['total'], result['detailed']);
    })
    .catch(err => console.log(err));
}
function createDetailList(total, detailed) {
  let titleLi = ulDetail.firstElementChild;
  ulDetail.innerHTML = '';
  ulDetail.append(titleLi);

  let li = document.createElement('li');
  li.className = 'list-group-item';

  let rowDiv = document.createElement('div');
  rowDiv.className = 'row';
  let col8Div = document.createElement('div');
  col8Div.className = 'col-8';
  let col4Div = document.createElement('div');
  col4Div.className = 'col-4';

  for (let elem of total) {
    let curLi = li.cloneNode();
    let curRow = rowDiv.cloneNode();
    let curCol8 = col8Div.cloneNode();
    curCol8.innerHTML = elem.group ? elem.group : "Всего";
    let curCol4 = col4Div.cloneNode();
    curCol4.innerHTML = elem.group ? '' : elem.count;
    curRow.append(curCol8);
    curRow.append(curCol4);
    curLi.append(curRow);
    ulDetail.append(curLi);

    for (let obj of detailed) {
      if (elem.group != obj.group) continue;
      curLi = li.cloneNode();
      curRow = rowDiv.cloneNode();
      curCol8 = col8Div.cloneNode();
      curCol8.className = 'col-8 text-center';
      curCol8.innerHTML = obj.ID;
      curCol4 = col4Div.cloneNode();
      curCol4.innerHTML = obj.count;
      curRow.append(curCol8);
      curRow.append(curCol4);
      curLi.append(curRow);
      ulDetail.append(curLi);
    }
  }
}
