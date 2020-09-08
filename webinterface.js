"use strict";
const dotenv = require('dotenv');
dotenv.config();
const port = process.env.PORT;

var callbacks = {};

var express = require('express');
var app = express();
app.set('view engine', 'pug');

app.get('/', async function (req, res) {
	let all_configs = await callbacks.getConfigs();
	//console.log(all_configs);
	res.render('index', {	title: (global.status.current_config ? "(R) Friend TBot" : "(I) Friend Tbot"),
							message: 'Hello there!',
							configs: all_configs,
							current_config: (global.status.current_config ? global.status.current_config.name : ""),
							current_cron:  (global.status.current_config ? global.status.current_config.cron_string : "")
						})
})

app.use(express.static('static'));
app.use(express.json());

app.post('/api/configs/add', async function (req, res) {

	if(await callbacks.addConfig(req.body)) {
		res.send('{status:"success"}');
	} else {
		res.send('{status:"failed"}');
	}

})

app.get('/api/configs/get', async function (req, res) {
	res.send(await callbacks.getConfigs());
})

app.get('/api/configs/get/:name/', async function (req, res) {
	res.send(await callbacks.getConfig(req.params.name));
})

app.get('/api/configs/del/:name/', async function (req, res) {
	res.send(await callbacks.delConfig(req.params.name));
})

app.get('/api/configs/set/:name/', async function (req, res) {
	res.send(await callbacks.setConfig(req.params.name));
})

app.get('/api/configs/stop/', async function (req, res) {
	res.send(await callbacks.stop());
})

var server = app.listen(port, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Falldeaf TwitBot listening at http://%s:%s", "127.0.0.1", port)
})

module.exports = {
	//Get current configuration to run
	setCallbacks: async function(callback_list){
		callbacks = callback_list;
	}
}