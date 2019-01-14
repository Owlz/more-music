# More Music
Finding a good song is harder than it looks; usually we must go trough tons of different tracks just to get something similiar to what we're looking for. Through an MQTT-based android application (or simply by the Nuclio Dashboard) we send a message made of "author" and "song title" (e.g. "Elephant Gym - Underwater") to the function and we get back 5 similiar tracks. To recive the results we use an IFTTT applet which gets triggered by a webhook and can forward the data to any device compatible with IFTTT such as smart speaker, social networks and streaming services.

More Music is a simple function made for [Nuclio](https://nuclio.io), an open source and managed serverless platform that we can run on our home server. It uses [RabbitMQ](https://www.rabbitmq.com/) as broker to share MQTT messages around.

### Prerequisites
- [Docker](https://www.docker.com/)
- [Node.js](https://nodejs.org/) if you want to run the `logger.js` otherwise is not necessary

### How to use it
Clone this repository:
```
$ git clone https://github.com/JustAnOwlz/more-music.git
$ cd more-music
```
Start up a docker instance of Nuclio:
```
$ sudo docker run -p 8070:8070 -v /var/run/docker.sock:/var/run/docker.sock -v /tmp:/tmp nuclio/dashboard:stable-amd64
```
Start up a docker instance of RabbitMQ:
```
$ sudo docker run -p 9000:15672  -p 1883:1883 -p 5672:5672  cyrilix/rabbitmq-mqtt
```

Make an applet on [IFTTT](https://ifttt.com/) to forward the songs found to Telegram or any smart speaker such as Alexa or Google Home.
Obtain an API key from the Last.fm's API and Youtube's Data API and place them inside `moremusic.yaml`. Remember to add your IP in the right spot

Browse to http://localhost:8070, create a project, load the `moremusic.yaml` file and deploy it. Anything should work just fine.

#### How to run the logger.js
Open a terminal, browse to the more-music folder and install the dependencies:
```
$ npm install
```
Run the file logger.js and specify your IP:
```
$ npm logger.js 192.168.1.1 # put your own ip
```


### Technology used
- [Nuclio](https://nuclio.io)
- [RabbitMQ](https://www.rabbitmq.com/)
- [IFTTT](https://ifttt.com/)
- [MQTT client](https://play.google.com/store/apps/details?id=in.dc297.mqttclpro): a general purpose MQTT client for Android devices

Also APIs from:
- [Last.fm](https://www.last.fm/)
- [Youtube](https://www.youtube.com/)