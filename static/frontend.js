//////////UI/////////////////////////

//CRON Expression helper
var cronstrue = window.cronstrue;
var cron_input = document.querySelector('input[name="cron_string"]');
cron_input.addEventListener('input', function(change){
	try {
		cron_input.classList.remove('is-invalid');
		cron_input.classList.add('is-valid');
		document.getElementById('cron-description').innerHTML = cronstrue.toString(cron_input.value);
	} catch {
		cron_input.classList.remove('is-valid');
		cron_input.classList.add('is-invalid');
		document.getElementById('cron-description').innerHTML = "Improper Cron Syntax";
	}
});

window.addEventListener("load", function(){
	//Update the next run field every minute
	var current_cron = document.getElementById('next_run').getAttribute('cron_string');
	document.getElementById('next_run').innerHTML = prettyCron.getNext(current_cron);
	setInterval(function updateCronNext(){
		document.getElementById('next_run').innerHTML = prettyCron.getNext(current_cron);
	},60000);
});

//Test twitter search
document.getElementById('test-twitter-search').addEventListener('click', function() {
	url = "https://twitter.com/search?q=" + encodeURIComponent(document.querySelector('input[name="search_string"]').value);
	console.log('url:' + url);
	window.open(url,'_blank');
});

////////API to Backend//////////////

var getone_url = "/api/configs/get/"
var update_url = "/api/configs/add/";
var delete_url = "/api/configs/del/";
var set_url    = "/api/configs/set/";
var stop_url   = "/api/configs/stop/";

///////ADD/////////////
//Open the modal dialoge with a blank, new form
//Post form data for a new or updatged config to the server
document.getElementById('config-new-button').addEventListener('click', function(){
	var url = update_url + "NewConfig";
	var form = document.getElementById('config-form');
	//let form_data = Object.values(form).reduce((obj,field) => { obj[field.name] = field.value; return obj }, {});
	form.reset();
	form.querySelector('input[name="name"').value = "NewConfig";
});


///////EDIT////////////
//This function is called when any edit button is pressed, and using the name of the config
//does an api request to get the full data for that config and pre-fills out the form
Array.from(document.getElementsByClassName("action_edit")).forEach(function(element) {
	element.addEventListener('click', function(){
		var attribute = this.getAttribute("uid");
		console.log("edit " + attribute);
		document.getElementById('config-modal-title').innerHTML = "Add/Edit <b>" + attribute + "</b>";
		var cbody = document.getElementById('config-modal-body');
		//cbody.innerHTML = "Settings for " + attribute + " go here.";
		cbody.setAttribute("config-name", attribute);
		fetch(getone_url + attribute + "/")
		.then(res => res.json())
		.then((out) => {
			for (const [key, value] of Object.entries(out)) {
				var el = document.querySelector('#config-form input[name="'+ key +'"]');
				if(el) el.value = value;
			}
		}).catch(err => console.error(err));
	});
});

//Post form data for a new or updatged config to the server
document.getElementById('config-save').addEventListener('click', function(){
	var url = update_url + document.getElementById('config-modal-body').getAttribute('config-name')
	var form = document.getElementById('config-form');
	let form_data = Object.values(form).reduce((obj,field) => { obj[field.name] = field.value; return obj }, {});

	fetch(update_url, {
		method: "POST", 
		body: JSON.stringify(form_data),
		headers: { 'Content-Type': 'application/json' }
	  }).then(res => {
		console.log("Request complete! response:", res);
		location.reload();
	  });
	console.log(url);
});

///////DELETE////////////
Array.from(document.getElementsByClassName("action_del")).forEach(function(element) {
	element.addEventListener('click', function(){
		var attribute = this.getAttribute("uid");
		console.log("delete " + attribute);
		document.getElementById('modal-confirm-title').innerHTML = "Delete " + attribute;
		var cbody = document.getElementById('modal-confirm-body');
		cbody.innerHTML = "Do you want to delete " + attribute + "? (This is not reversable)";
		cbody.setAttribute("config-name", attribute);

		var btn1 = makeButton("close", "secondary");
		var btn2 = makeButton("DELETE", "danger");
		document.getElementById('modal-footer-confirm').appendChild(btn1);
		document.getElementById('modal-footer-confirm').appendChild(btn2);
		btn2.addEventListener('click', function(){
			var url = delete_url + document.getElementById('modal-confirm-body').getAttribute('config-name');
			callAPI(url);
		});
	});
});

///////////////SET//////////////
Array.from(document.getElementsByClassName("action_set")).forEach(function(element) {
	element.addEventListener('click', function(){
		var attribute = this.getAttribute("uid");
		console.log("set " + attribute);
		document.getElementById('modal-confirm-title').innerHTML = "Run " + attribute;
		var cbody = document.getElementById('modal-confirm-body');
		cbody.innerHTML = "Do you want to run " + attribute + "?";
		cbody.setAttribute("config-name", attribute);

		var btn1 = makeButton("close", "secondary");
		var btn2 = makeButton("RUN", "success");
		document.getElementById('modal-footer-confirm').appendChild(btn1);
		document.getElementById('modal-footer-confirm').appendChild(btn2);
		btn2.addEventListener('click', function(){
			var url = set_url + document.getElementById('modal-confirm-body').getAttribute('config-name');
			callAPI(url);
		});
	});
});

///////////////STOP//////////////
Array.from(document.getElementsByClassName("action_stop")).forEach(function(element) {
	element.addEventListener('click', function(){
		if(this.classList.contains('disabled')) return;
		var attribute = this.getAttribute("uid");
		console.log("set " + attribute);
		document.getElementById('modal-confirm-title').innerHTML = "STOP ALL!";
		var cbody = document.getElementById('modal-confirm-body');
		cbody.innerHTML = "Do you want to stop ALL tasks?";
		cbody.setAttribute("config-name", attribute);

		var btn1 = makeButton("close", "secondary");
		var btn2 = makeButton("STOP", "warning");
		document.getElementById('modal-footer-confirm').appendChild(btn1);
		document.getElementById('modal-footer-confirm').appendChild(btn2);
		btn2.addEventListener('click', function(){
			callAPI(stop_url);
		});
	});
});


////////////HELPERS//////////////////
function makeButton(text, color){
	var btn = document.createElement("BUTTON");
	btn.innerHTML = text;
	btn.setAttribute("class", "btn btn-" + color);
	btn.setAttribute("data-dismiss", "modal");
	return btn;
}

function callAPI(url) {
	fetch(url)
		.then(response => response.text())
		.then((response) => {
			console.log(response);
			location.reload();
		})
		.catch(err => console.log(err))
}

//Delete dynamic confirm modal buttons (must be jquery to attach to modal close event)
//https://stackoverflow.com/questions/24211185/twitter-bootstrap-why-do-modal-events-work-in-jquery-but-not-in-pure-js
$('#modal-confirm').on('hidden.bs.modal', function (e) {
	document.getElementById('modal-footer-confirm').innerHTML = "";
});