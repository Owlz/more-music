const amqp = require('amqplib');
const https = require('https')


const QUEUE_LOGGER = 'iot/logger';
const IP = process.env.IP;
const API_KEY_LASTFM = process.env.API_KEY_LASTFM;
const API_KEY_YOUTUBE = process.env.API_KEY_YOUTUBE;
const API_KEY_IFTTT = process.env.API_KEY_IFTTT;


let buildRequest = function(url, data) {
	const params = typeof data == 'string' ? data : Object.keys(data).map(
		x => `${encodeURIComponent(x)}=${encodeURIComponent(data[x])}`
	).join('&');

	return `${url}?${params}`;
}


let sendRequest = async function(reqUrl, parameters) {
	return new Promise(function(resolve, reject) {
		https.get(buildRequest(reqUrl, parameters), function(resource) {
			body = ""
			resource.setEncoding('utf8');

			resource.on('end', () => {
				resolve(body);
			});

			resource.on('data', (data) => {
				body += data;
			});


		}).on('error', (err) => {
			reject(err.message);
		})
	})
}

let fetchAPIs = async function(song) {
	try {
		const songsFound = await searchLastFM(song);
		const linksFound = await searchYouTube(songsFound);
		return linksFound;
	} catch (e) {
		sendFeedback(`Error while fetching`)
		throw (`Error during the fetchAPIs call: ${e}`);
	}
}

let sendIFTTT = async function(links) {
	let eventName = "moremusic";
	let reqUrl = `https://maker.ifttt.com/trigger/${eventName}/with/key/${API_KEY_IFTTT}`

	let promisesMade = [];
	for (var i = 0; i < links.length; i++) {
		let parameters = {};
		parameters[`value1`] = links[i]["name"];
		parameters[`value2`] = links[i]["link"];
		parameters[`value3`] = `${i+1}/${links.length}`;
		promisesMade.push(sendRequest(reqUrl, parameters));
	}

	await sendFeedback(`IFTTT done`)

	return await Promise.all(promisesMade);
}

let searchLastFM = async function(song) {
	let parameters = {
		api_key: API_KEY_LASTFM,
		artist: song[0],
		track: song[1],
		method: "track.getsimilar",
		format: "json"
	};

	let reqUrl = "https://ws.audioscrobbler.com/2.0/";

	let req = await sendRequest(reqUrl, parameters);
	let jResponse;
	try {
		jResponse = JSON.parse(req).similartracks;
	} catch (e) {
		throw (`Youtube parsing exception: ${e}\n\nBody of the request: ${req}`);
	}
	let songs = [];
	for (let i = 0; i < 5; i++) {
		songs.push(`${jResponse.track[`${i}`].artist.name} - ${jResponse.track[`${i}`].name}`)
	}

	await sendFeedback(`LastFM done`)
	return songs;
}

let searchYouTube = async function(songNames) {
	let parameters = {
		key: API_KEY_YOUTUBE,
		part: "snippet",
		q: ""
	};

	let reqUrl = "https://www.googleapis.com/youtube/v3/search";

	let links = [];
	for (var i = 0; i < songNames.length; i++) {
		parameters.q = songNames[i];
		let req = await sendRequest(reqUrl, parameters);

		let parsed;
		try {
			parsed = JSON.parse(req)
		} catch (e) {
			throw (`Youtube parsing exception: ${e}\n\nBody of the request: ${req}`);
		}

		let l = parsed.items[0].id.videoId;
		links.push({
			"name": songNames[i],
			"link": `https://youtu.be/${l}`
		});
	}

	await sendFeedback(`Youtube done`)
	return links;

}

let sendFeedback = async (msg) => {
	const connection = await amqp.connect(`amqp://guest:guest@${IP}:5672`);
	const ch = await connection.createChannel()
	await ch.assertQueue(QUEUE_LOGGER, {durable: false});
	await ch.sendToQueue(QUEUE_LOGGER, Buffer.from(msg));
}

exports.handler = function(context, event) {
	let _event = JSON.parse(JSON.stringify(event));
	let _data = String.fromCharCode(..._event.body.data);

	const song = _data.split('-').map(x => x.trim());

	if (song.length != 2) {
		sendFeedback(`Error while loading the song, ${_data} is not valid`)
			.then(x => x)
		return
	}else{
		sendFeedback(`Song loaded: ${song.join(' - ')}`)
			.then(x => x)
	}

	fetchAPIs(song)
		.then(links => sendIFTTT(links))
		.then(output => context.callback("Done"))
		.catch(err => context.callback("Error: ", err));

}