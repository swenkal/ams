/*
COMMON VARS
*/
//getting discName from current url
let pathName = window.location.pathname;
let delimeteredPath = pathName.split('/');
const discName = delimeteredPath[delimeteredPath.length - 2];

//getting start and end date inputs
const start = document.getElementById('start');
const end = document.getElementById('end');

// const vars for disc analytics page
const HOST = 'http://localhost:5000/';
const COMMON_TYPE = 'type=common_info';

/*
SURVEY VARS
*/
//getting canvas elems for each question
let canvasQ1 = document.getElementById('q1');
let canvasQ2 = document.getElementById('q2');
let canvasQ3 = document.getElementById('q3');

//getting ul elem for insert 5 last suggests
let suggest = document.getElementById('suggest');

// color of the columns for chart's
let backgroundColor = [
    'rgba(255, 99, 132, 0.2)',
    'rgba(54, 162, 235, 0.2)',
    'rgba(255, 206, 86, 0.2)',
    'rgba(75, 192, 192, 0.2)',
    'rgba(153, 102, 255, 0.2)',
    'rgba(255, 159, 64, 0.2)'
];

//template for all chart's
const dataTemplate = {
      labels: [],
      datasets: [{
          label: '',
          data: [],
          backgroundColor: backgroundColor
      }]
  };

//initialize data for chart's from template
let dataQ1 = jsonCopy(dataTemplate);
dataQ1.datasets[0].label = 'Оценка понятности';

let dataQ2 = jsonCopy(dataTemplate);
dataQ2.datasets[0].label = 'Чего не хватает';


let dataQ3 = jsonCopy(dataTemplate);
dataQ3.datasets[0].label = 'Ошибки';
dataQ3.labels = ["Да", "Нет"];

function jsonCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

//initialize options for chart's
const commonOptions = {
  plugins: {
    legend: {
        display: false
    }
  },
    scales: {
        y: {
            beginAtZero: true
        },
        x: {
          ticks: {
            stepSize: 1
          }
        }
    },
    indexAxis: 'y'
};
const optionsQ3 = {
    plugins: {
      legend: {
          display: false
      }
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
        }
    }
};

//create Chart objects for each question
let q1 = new Chart(canvasQ1, {
    type: 'bar',
    data: dataQ1,
    options: commonOptions
});

let q2 = new Chart(canvasQ2, {
    type: 'bar',
    data: dataQ2,
    options: commonOptions
});

let q3 = new Chart(canvasQ3, {
    type: 'bar',
    data: dataQ3,
    options: optionsQ3
});

//get analytics info for default interval when DOMContent is Loaded
document.addEventListener('DOMContentLoaded', () => {

  changePagesCommonInfo(discName, start.value, end.value);

  changeDownloadsCommonInfo(discName, start.value, end.value);

  changeSurveysCommonInfo(discName, start.value, end.value, 1);

  changeDownloadsLink(discName, start.value, end.value);
});

//getting button for change analytics info
const btnAnalyze = document.getElementById('analyze');

btnAnalyze.addEventListener('click', () => {

  changePagesCommonInfo(discName, start.value, end.value);

  changeDownloadsCommonInfo(discName, start.value, end.value);

  changeSurveysCommonInfo(discName, start.value, end.value, 1);

  changeDownloadsLink(discName, start.value, end.value);
});


function changePagesCommonInfo(discName, start, end) {
  //TODO check response status and code
  fetch(`${HOST}pages?${COMMON_TYPE}&pathName=/disciplines/${discName}/&start=${start}&end=${end}`)
    .then(response => response.json())
    .then(result => {
      console.log(result);
      let unique = document.getElementById('unique');
      unique.innerHTML = result.unique;
      let bounce = document.getElementById('bounce');
      bounce.innerHTML = result.bounceRate + '%';
      let views = document.getElementById('views');
      views.innerHTML = result.visits;
    })
    .catch(err => console.log(err));
}

function changeDownloadsCommonInfo(discName, start, end) {
  fetch(`${HOST}files?${COMMON_TYPE}&disc=${discName}&start=${start}&end=${end}`)
    .then(response => response.json())
    .then(result => {
      console.log(result);
      let downloads = document.getElementById('downloads');
      downloads.innerHTML = result.downloads;
    })
    .catch(err => console.log(err));
}

function changeSurveysCommonInfo(discName, start, end, id) {
  fetch(`${HOST}surveys?${COMMON_TYPE}&pathName=/disciplines/${discName}/&start=${start}&end=${end}&surveyID=${id}`)
    .then(response => response.json())
    .then(result => {
      console.log(result);
      console.log(Object.keys(result['q1']));
      console.log(Object.values(result['q1']));
      dataQ1.labels = Object.keys(result['q1']);
      dataQ1.datasets[0].data = Object.values(result['q1']);
      q1.destroy();
      q1 = new Chart(canvasQ1, {
          type: 'bar',
          data: dataQ1,
          options: commonOptions}
      );
      dataQ2.labels = Object.keys(result['q2']);
      dataQ2.datasets[0].data = Object.values(result['q2']);
      q2.destroy();
      q2 = new Chart(canvasQ2, {
          type: 'bar',
          data: dataQ2,
          options: commonOptions}
      );
      dataQ3.datasets[0].data = [result['q3']['1'], result['q3']['0']];
      q3.destroy();
      q3 = new Chart(canvasQ3, {
          type: 'bar',
          data: dataQ3,
          options: optionsQ3}
      );
      suggest.innerHTML = '';
      let li = document.createElement('li');
      li.className = 'list-group-item';
      for (let value of result['q4']) {
        let curLi = li.cloneNode();
        curLi.innerHTML = value;
        suggest.append(curLi);
      }
    })
    .catch(err => console.log(err));
}

function changeDownloadsLink(discName, start, end) {
  let filesLink = document.getElementById('filesLink');
  let link = `/analytics/${discName}/files/?start=${start}&end=${end}`;
  filesLink.setAttribute('href', link);
}
