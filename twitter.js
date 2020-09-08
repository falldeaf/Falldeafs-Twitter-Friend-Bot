"use strict";

const Twitter = require('twitter-lite');
const delay = require('delay');

const dotenv = require('dotenv');
dotenv.config();
var keys = {
	subdomain: "api",
	consumer_key: process.env.TWIT_CK,
	consumer_secret: process.env.TWIT_CS,
	access_token_key: process.env.TWIT_ATK,
	access_token_secret: process.env.TWIT_ATS
}

module.exports = {
	followUser: async function(handle){
		try {
			const client = new Twitter(keys);
			await client.post("friendships/create", {
				screen_name: handle
			});
		} catch (err) {
			console.log(err);
			return({});
		}
	},

	unfollowUser: async function(handle){
		try{
			const client = new Twitter(keys);
			await client.post("friendships/destroy", {
				screen_name: handle
			});
		} catch (err) {
			console.log(err);
			return({});
		}
	},

	//Accepts an array of strings/names and removes names that are already following us
	removeAlreadyFollowed: async function(screen_names){
		const client = new Twitter(keys);

		//Weird hack alert!! - Had to add a useless twitter handle at the end of the query because the API result drops off the last name for some weird reason
		var url = "friendships/lookup.json?screen_name="+encodeURIComponent(screen_names.join(',')) + "%2CBackstop";
		var json = await client.get(url);

		try{
			for(var user of json) {
				//console.log(user.screen_name);
				if(user.connections.includes("followed_by")) {
					console.log("found follower, remove: " + user.screen_name);
					screen_names.splice(screen_names.indexOf(user.screen_name), 1);
				} else {
					console.log(user.screen_name + " isn't following us");
				}
			}
		} catch(e) {
			console.log("removeAlreadyFollowed() problem:");
			console.log(e);
			return false;
		}

		return true;
	},

	//Pass in a list of screen names and return a hash of the usernames with a true/false value depending on whether they follow us now.
	areFollowersHash: async function(screen_names) {
		const client = new Twitter(keys);

		//Weird hack alert!! - Had to add a useless twitter handle at the end of the query because the API result drops off the last name for some weird reason
		var json = await client.get("friendships/lookup.json?screen_name="+encodeURIComponent(screen_names.join(',')) + "%2CBackstop");

		console.log(json);
		var user_hash = [];

		try{
			for(var user of json) {
				//console.log(user.screen_name);
				if(user.connections.includes("followed_by")) {
					console.log("found follower, remove: " + user.screen_name);
					user_hash.push({name: user.screen_name, follower: true});
				} else {
					console.log(user.screen_name + " isn't following us");
					user_hash.push({name: user.screen_name, follower: false});
				}
			}
			
		} catch(e) {
			console.log("Problem doing Twitter user lookup");
			console.log(e);
			return {status: 'error'};
		}

		return user_hash;
	},

	getViables: async function(search) {
		try {
			const client = new Twitter(keys);
			return await client.get("search/tweets.json?q="+encodeURIComponent(search)+"&result_type=mixed");;
		} catch (err) {
			console.log(err);
			return({});
		}
	},
}