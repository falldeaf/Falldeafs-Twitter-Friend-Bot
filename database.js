"use strict";

	/*
	//SAMPLE CONFIG
	var test_config = {
		name: "test1",
		max_per_run: 10,
		wait_random_minutes_before_start: 30,
		cron_string: "0 0 7-21 ? * * *",
		follow_ratio: 0.8,
		search_string: "#indiedev",
		bot_check: false,
		runs: 200
	}

	//SAMPLE USERS
	var users = {
		name: "falldeaf",
		date_followed: "[timestamp]",
		status: 0, //0:pending 1:success 2:fail
		config_name: "test1"
	}
	*/

const dotenv = require('dotenv');
dotenv.config();
var mongouser = process.env.DB_USER;
var mongopw = process.env.DB_PASS;

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://"+ mongouser +":"+ mongopw +"@cluster0.7cl2y.mongodb.net/twitdb?retryWrites=true&w=majority";
const mongoops = { useNewUrlParser: true, useUnifiedTopology: true };

module.exports = {

	//Get current configuration to run
	getConfigs: async function(){
		try {
			const client = await MongoClient.connect(uri, mongoops).catch(err => { console.log(err); });
			let collection = await client.db("twitdb").collection('config')
			let res = await collection.find({}).toArray();
			await client.close();
			return(res);
		} catch (err) {
			console.log(err);
			return({});
		}
	},

	getConfig: async function(config_name){
		try {
			const client = await MongoClient.connect(uri, mongoops).catch(err => { console.log(err); });
			let collection = await client.db("twitdb").collection('config')
			let res = await collection.findOne({name: config_name});
			await client.close();
			return(res);
		} catch (err) {
			console.log(err);
			return({});
		}
	},

	addConfig: async function(config_options){
		try {
			const client = await MongoClient.connect(uri, mongoops).catch(err => { console.log(err); });
			let collection = await client.db("twitdb").collection('config');
			let res = await collection.updateOne(
				{ name: config_options.name },
				{ $set: config_options },
				{ upsert: true }
			);
			await client.close();
			return(true);
		} catch (err) {
			console.log(err);
			return(false);
		}
	},

	delConfig: async function(config_name) {
		try {
			const client = await MongoClient.connect(uri, mongoops).catch(err => { console.log(err); });
			await client.db("twitdb").collection('config').deleteOne({name: decodeURI(config_name)});
			await client.close();
			return(true);
		} catch (err) {
			console.log(err);
			return(false);
		}
	},

	//Check if we've interacted with this user in the past, already
	hasInteracted: async function(screen_names){
		try {
			const client = await MongoClient.connect(uri, mongoops).catch(err => { console.log(err); });
			const collection = client.db("twitdb").collection('users');


			for(var screen_name of screen_names) {
				if( await collection.countDocuments({name: screen_name}, { limit: 1 }) ) {
					screen_names.splice(screen_names.indexOf(screen_name), 1);
				}
			}
			await client.close();
		} catch (err) {
			console.log(err);
		}
	},

	//Followed a new user, add their name to the DB
	//arguments: user [object] contains:
	//    -name [string] (a twitter user handle minus @)
	//    -config_name [string] (configuration profile name that created this follow)
	//    -grace [int] (the grace period to allow before followback must occur, in days)
	followedNew: async function(user) {
		var today = new Date();
		var tomorrow = new Date();
		tomorrow.setDate(today.getDate()+user.grace);

		try {
			const client = await MongoClient.connect(uri, mongoops).catch(err => { console.log(err); });
			let collection = await client.db("twitdb").collection('users');
			let res = await collection.insertOne({
				name: user.name,
				date_followed: today,
				date_expires: tomorrow,
				status: 0, //0:pending 1:success 2:fail
				config_name: user.config_name
			});
			await client.close();
			return(true);
		} catch (err) {
			console.log(err);
			return(false);
		}
	},

	//Check for users that I follow, but don't follow back and have expired their wait time
	timesUp: async function(whitelist) {
		try {
			const client = await MongoClient.connect(uri, mongoops).catch(err => { console.log(err); });
			let collection = await client.db("twitdb").collection('users');

			var current_date = new Date();
			let res = await collection.find({status: 0, date_expires: {$lte: current_date}}).limit(50).toArray();

			await client.close();
			return(res);
		} catch (err) {
			console.log(err);
			return(false);
		}
	},

	setFollowerStatus: async function(screen_name, following) {
		try {
			const client = await MongoClient.connect(uri, mongoops).catch(err => { console.log(err); });
			let collection = await client.db("twitdb").collection('users');

			var query = { name: screen_name };
			var newvalues = { $set: {status: following} };
			let res = await collection.updateOne(query, newvalues);

			await client.close();
			return(res);
		} catch (err) {
			console.log(err);
			return(false);
		}
	},

	getFollowersForConfigs: async function() {
		try {
			const client = await MongoClient.connect(uri, mongoops).catch(err => { console.log(err); });

			let collection_config = await client.db("twitdb").collection('config');

			let collection_users = await client.db("twitdb").collection('users');

			let configs = await collection_config.find().toArray();
			for(var config of configs) {
				let fcount = await collection_users.find({config_name: config.name, status: 1}).toArray();
				let ucount = await collection_users.find({config_name: config.name, status: 2}).toArray();

				var query = { name: config.name};
				var newvalues = { $set: {follows: await fcount.length, unfollows: await ucount.length} };
				console.log(`Config: ${query.name} f:${newvalues.$set.follows} u:${newvalues.$set.unfollows}`);
				let res = await collection_config.updateOne(query, newvalues);
			}


			await client.close();
			return(true);
		} catch (err) {
			console.log(err);
			return(false);
		}
	},

	addRunToConfig: async function(config_name) {
		try {
			const client = await MongoClient.connect(uri, mongoops).catch(err => { console.log(err); });
			let collection = await client.db("twitdb").collection('config');

			var query = { name: config_name };
			var newvalues = { $inc: { runs: 1 } };
			let res = await collection.updateOne(query, newvalues);

			await client.close();
			return(res);
		} catch (err) {
			console.log(err);
			return(false);
		}
	}
}