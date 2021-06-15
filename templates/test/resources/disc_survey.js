

// Get the button that opens the modal
//let btn = document.getElementById("btnSurvey");

// When the user clicks anywhere outside of the modal, close it

/*window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}*/
const surveyData = {
	"surveyID": 1,
	"page": window.location.pathname,
	"action": "http://localhost:5000/surveys",
	"title": "Страничный опрос",
	"questions": [
		{
		"question": "Насколько были <b>понятны</b> материалы данной дисциплины?",
		"name": "q1",
		"type": "radio",
		"output": "inline",
		"answers": ["1", "2", "3", "4", "5"]
		},
		{
		"question": "Какой информации по дисциплине Вам не хватает?",
		"name": "q2",
		"type": "radio",
		"output": "block",
		"answers": ["Примеров решения", "Практических материалов",
					"Теоретических материалов", "Требований к дисциплине",
					"Другое"]
		},
		{
		"question": "Встретились ли Вам ошибки/недочеты на данной странице?",
		"name": "q3",
		"type": "radio",
		"output": "inline",
		"answers": ["0", "1"]
		},
		{
		"question": "Подскажите, что можно исправить/улучшить на данной странице?",
		"name": "q4",
		"type": "textarea",
		"output": "block"
		}
	]
}

function surveyBuilder(survey) {
	// Create the button that opens the modal
	let btnOpen = document.createElement('button');
	btnOpen.innerHTML = 'ПРОЙТИ ОПРОС';
	btnOpen.setAttribute('id', 'btnSurvey');
	document.body.prepend(btnOpen);

	//create root modal element
	let modalSurvey = document.createElement('div');
	modalSurvey.setAttribute('id', 'modalSurvey');
	modalSurvey.className = 'modal';

	//create modal content element
	let modalContent = document.createElement('form');
	modalContent.className = 'modal-content';
	//modalContent.setAttribute('method', 'POST');
	//modalContent.setAttribute('action', survey.action);
	modalSurvey.append(modalContent);

	//create hidden surveyID input
	let surveyID = document.createElement('input');
	surveyID.setAttribute('type', 'input');
	surveyID.setAttribute('name', 'surveyID');
	surveyID.setAttribute('hidden', 'true');
	surveyID.setAttribute('value', survey['surveyID']);
	modalContent.append(surveyID);

	//create hidden page path input
	let page = document.createElement('input');
	page.setAttribute('type', 'input');
	page.setAttribute('name', 'page');
	page.setAttribute('hidden', 'true');
	page.setAttribute('value', survey['page']);
	modalContent.append(page);

	// create close span and append to modalContent
	let clsSurvey = document.createElement('span');
	clsSurvey.setAttribute('id', 'clsSurvey');
	clsSurvey.className = "close";
	clsSurvey.innerHTML = "&times;";
	modalContent.append(clsSurvey);

	//append survey title for modal
	let title = document.createElement('h3');
	title.innerHTML = survey.title;
	modalContent.append(title);


	//for each question in survey
	for (let quest of survey.questions) {

		let ask = document.createElement('p');
		ask.innerHTML = quest.question;
		modalContent.append(ask);
		let answer;
		if (quest.type == 'radio') {
			answer = document.createElement('input');
			answer.setAttribute('type', 'radio');
			answer.setAttribute('name', quest.name);
			answer.setAttribute('required', 'true');

			if (quest.output == 'block') {

				for (let value of quest.answers) {
					let div = document.createElement('div');
					let clone = answer.cloneNode();
					clone.setAttribute('value', value);
					div.append(clone);
					div.append(value);
					modalContent.append(div);
				}

			} else {
				let div = document.createElement('div');
				for (let value of quest.answers) {
					let clone = answer.cloneNode();
					clone.setAttribute('value', value);
					div.append(clone);
					div.append(value);
				}
				modalContent.append(div);
			}

		}

		if (quest.type == 'textarea') {
			let div = document.createElement('div');
			answer = document.createElement('textarea');
			answer.setAttribute('rows', '3');
			answer.setAttribute('name', quest.name);
			div.append(answer);
			modalContent.append(div);
		}

	}

	let pButtons = document.createElement('p');
	let btnReset = document.createElement('button');
	btnReset.setAttribute('type', 'reset');
	btnReset.innerHTML = 'Очистить';
	pButtons.append(btnReset);

	let btnSubmit = document.createElement('button');
	btnSubmit.setAttribute('type', 'submit');
	btnSubmit.setAttribute('id', 'btnSubmit');
	btnSubmit.innerHTML = 'Отправить'
	pButtons.append(btnSubmit);

	modalContent.append(pButtons);
	document.body.append(modalSurvey);

	btnOpen.addEventListener('click', () => {
		modalSurvey.style.display = "block";
	});

	clsSurvey.addEventListener('click', () => {
		modalSurvey.style.display = "none";
	});

	// When the user clicks anywhere outside of the modalContent, close it
	window.addEventListener('click', () => {
		if (event.target == modalSurvey) modalSurvey.style.display = "none";
	});

	modalContent.addEventListener('submit', (e) => {
		e.preventDefault();
		const xhr = new XMLHttpRequest();

    	// Bind the FormData object and the form element
    	let FD = new FormData(modalContent);

    	//TEMPORALLY
    	FD.append('uniqueID', '1');

    	// Define what happens on successful data submission
    	xhr.addEventListener( "load", (event) => {
     	 console.log( event.target.responseText );
    	});

	    // Define what happens in case of error
	    xhr.addEventListener("error", (event) => {
	      console.log( 'Oops! Something went wrong.' );
	    });

    	// Set up our request
   		 xhr.open( "POST", "http://localhost:5000/surveys" );

    	// The data sent is what the user provided in the form
   		 xhr.send( FD );

		modalContent.innerHTML = '<h2>Ваш ответ отправлен.<br>Спасибо за участие!</h2>';
		setTimeout(() => {
			modalSurvey.style.display = "none";
			btnOpen.style.display = "none";
		}, 1000)

	});
}
//TODO: check uniqueID add
function checkUniqueID() {
	const uniqueID = getCookie('uniqueID');
	if (uniqueID == undefined) {
		uniqueID = localStorage.getItem('uniqueID');
	}
}
//
function getCookie(name) {
  let matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

/*LAUNCH SURVEY*/
surveyBuilder(surveyData);
