const database = require('./database');
const twitter = require('./twitter');
const delay = require('delay');

module.exports = {

	unfollowTask: async function() {

		var users = await database.timesUp();
		console.log(users);

		if(users <= 0) return;

		var screen_names = [];
		for(var user of users) {
			screen_names.push(user.name);
		}

		var hash = await twitter.areFollowersHash(screen_names);
		if(hash.status === 'error') return; //API failed, probably a rate limit issue

		for(var user of hash) {
			if(user.follower) {
				await database.setFollowerStatus(user.name, 1);
			} else {
				await twitter.unfollowUser(user.name);
				await database.setFollowerStatus(user.name, 2);
			}
		}

		//Update stats for each config
		await database.getFollowersForConfigs();
	},

	followTask: async function(search, ratio, viable_users_count, max_attempts, grace){
		try{

			//default ratios
			var low_ratio = 0;
			var high_ratio = 500;


			var string_ratio = ratio.toString();
			if(string_ratio.includes(',')) {
				var ratios = string_ratio.split(',');
				low_ratio = parseFloat(ratios[0]);
				high_ratio = parseFloat(ratios[1]);
			} else {
				low_ratio = ratio;
			}

			console.log(low_ratio);
			console.log(high_ratio);

			var viable_users_array = [];

			for(var i = 0; i <= 2; i++) {
				for(var i = 0; i <= max_attempts; i++) {
					//const client = new Twitter(keys);
					//var json = await client.get("search/tweets.json?q="+encodeURIComponent(search)+"&result_type=mixed");
					var json = await twitter.getViables(search);

					for(var tweet of json.statuses) {
						var name = tweet.user.screen_name;
						var prot = tweet.user.protected;
						var following = tweet.user.following;
						var actual_ratio = tweet.user.friends_count / tweet.user.followers_count;
						var sensative = tweet.possibly_sensitive;
						var viable = (actual_ratio > low_ratio && actual_ratio < high_ratio && !sensative && !following && !prot);
						console.log(`Viable?: ${viable} Name: ${name} following: ${following} prot: ${prot} friends/followers ${tweet.user.friends_count}/${tweet.user.followers_count} ratio: ${actual_ratio} sensative: ${sensative}`);
						if(viable && !viable_users_array.includes(name) && viable_users_array.length < viable_users_count) viable_users_array.push(name);
					}

					console.log(viable_users_array.length + " viable users");
					if(viable_users_array.length >= viable_users_count) {
						console.log("We've got enough users (inner loop)");
						break;
					}

					await delay(30000);

				}

				await twitter.removeAlreadyFollowed(viable_users_array);
				await database.hasInteracted(viable_users_array);
				if(viable_users_array.length >= viable_users_count) {
					console.log("We've got enough users (outer loop)");
					break;
				}
			}

			console.log(viable_users_array);

			//If we're manually running instead of using a config, set the config_name to manual
			var config_name = (global.status.current_config !== null ? global.status.current_config.name : "manual");
			await database.addRunToConfig(config_name);

			for(var user of viable_users_array) {
				//TODO: Check if follow worked before updating DB
				await twitter.followUser(user);

				await database.followedNew({name: user, config_name: config_name, grace: grace});
			}

			//return viable_users_array;
			//TODO Add run to current config
		} catch(e) {
			console.log("Problem during follow task:");
			console.log(e);
			return {status: 'error'};
		}
	}
	
}