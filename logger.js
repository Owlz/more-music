var amqp = require('amqplib');

const QUEUE = 'iot/logger'

let main = async (ip) => {
	const connection = await amqp.connect(`amqp://guest:guest@${ip}:5672`);
	process.once('SIGINT', () => connection.close());

	const channel = await connection.createChannel();
	await channel.assertQueue(QUEUE,{durable:false});
	await channel.consume(QUEUE, (msg) => {
		if (msg !== null) {
			console.log(`[${new Date().toISOString()}] -> ${msg.content.toString()}`);
			channel.ack(msg);
		}
	});
}

if(process.argv.lenght !== 3 && !/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/.test(process.argv[2])){
	console.log("Usage: node logger.js [ip address]");
	process.exit(1);
}

main(process.argv[2])
	.then((msg) => console.log(`** logging on queue: ${QUEUE}`))
	.catch((err) => console.error(`Error: ${err}`));