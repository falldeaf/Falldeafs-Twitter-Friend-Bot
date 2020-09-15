"use strict";

const cron = require('node-cron');
const database = require('./database');
const tasks = require('./tasks');
const delay = require('delay');

global.status = {
	running: false,
	main_task: null,
	current_config: null
}

//Create and init the webinterface
var webinterface = require('./webinterface');
const { getConfig } = require('./database');
webinterface.setCallbacks({
	getConfigs: database.getConfigs,
	getConfig: database.getConfig,
	setConfig: setConfig,
	addConfig: database.addConfig,
	delConfig: database.delConfig,
	stop: stopProcess,
});

//Stop the current config
async function stopProcess() { 
	status.main_task.stop(); 
	global.status.current_config = null;
}

//Start the following routine for the given config
async function setConfig(name) { 
	//global.status.current_config_name = name; 
	var config = await database.getConfig(name);
	global.status.current_config = config;

	if(status.main_task !== null) status.main_task.destroy();

	//https://crontab.guru/
	status.main_task = cron.schedule(config.cron_string, async () => {
		//Set delay
		var random = Math.floor(Math.random() * Math.floor(config.wait_random_minutes_before_start));
		console.log(`Waiting ${random} minutes before launch`);
		if(random > 0) await delay(random*60000);//Wait up to 30 minutes before starting

		tasks.followTask(config.search_string, config.follow_ratio, config.max_per_run, 6, config.grace);
	});

}

//Every day at third hour at the 30 min mark, run the cleanup routine to check for twitter users that didn't follow back after the time limit
cron.schedule("30 */3 * * *", async () => {
	tasks.unfollowTask();
});

//tasks.followTask("#indiedev", 0.5, 5, 6);
//tasks.unfollowTask();

//database.overrideGrace(1);
//database.getFollowersForConfigs();