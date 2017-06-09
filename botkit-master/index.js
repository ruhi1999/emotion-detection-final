var Botkit = require('./lib/Botkit.js');


//token is 'xoxb-111013972483-d3wIz5aO4u3gIRM9F9NUN36e'

if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.env['token'] = 'xoxb-111013972483-Q0XYREX2X1lZtI7XzmX3eYhK';
    //process.exit(1);
}

var Botkit = require('./lib/Botkit.js');
var os = require('os');

var controller = Botkit.slackbot({
    debug: false
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM(); 


console.log('Env token '+process.env.token);
console.log('Bot token '+bot.token);


var http = require('http');
var httpserver = require('http').createServer();
var ioserver = require('socket.io')(httpserver);

httpserver.listen(3001, function(){
    console.log('stub server listening on *:3001');
});



ioserver.on('connection', function(socket){
	console.log('an emotion client connected');
	//stubsockets.add(socket);
	socket.on('emote', function(data) {
        //parse Json data
        if (data) {
            console.log('incoming emote all data *** ' + data);
            console.log('incoming emote *** ' + data.response);
            var emotionResponse = JSON.parse(data.response);
            if (data.response.code != "RateLimitExceeded") {
                addEntry(data.time, data.channel, emotionResponse[0].scores);
                console.log('added entry:: '+ 'timeStamp:'+ data.time + 'channel:' + data.channel + 'scores' + emotionResponse[0].scores);
            } 
            else {
                console.log('RateLimitExceeded!!!')
            }

        }
	});

    
	socket.on('disconnect', function(){
		console.log('emotion client disconnected');
		stubsockets.delete(socket);
	});

});


//handle failure
ioserver.on('connect_failed', function() {
    console.log('connection_failed on *&&& ***:3000');
});
		
function sendMessage(ts, ch){
    console.log('**** &&&&& ***** sendMessage called');
    var msg = 'Ruhi';
   //d = new Date();
    if(msg) {
        ioserver.emit('message', {time: ts, channel: ch});
        console.log('emit: message');
    } else { 
            console.log('error: **** &&&&& ***** ioserver emit not called'); 
    }
};



controller.on('ambient', function(bot, message) {
	console.log("On");
    
    console.log(message.ts, message.channel);
    
	/*bot.api.reactions.add({
			timestamp: message.ts,
			channel: message.channel,
			name: 'grinning',
		}, function(err, res) {
			if (err) {
				bot.botkit.log('Failed to add emoji reaction :(', err);
			}
		});*/
	sendMessage(message.ts, message.channel);
});

/*
controller.hears('ambient', function(bot, message) {
	//time = message.ts;
	//console.log(time);
	console.log('**** &&& **** ambient detected');
	//console.log(message.ts, message.channel);
	bot.api.reactions.add({
			timestamp: message.ts,
			channel: message.channel,
			name: 'grinning',
		}, function(err, res) {
			if (err) {
				bot.botkit.log('Failed to add emoji reaction :(', err);
			}
		});
});*/
//test code to call swift emotion detection

function call_emotion(){
    httpserver.listen(3001, function(){
        console.log('stub server listening on *:3001');
        setTimeout(function(){
            sendMessage(Date.now(),"Ruhi");
        }, 20000);

        //add this code to the controller.hears(['emotion' ... after sendMessage
        //wait for 10 miliseconds
        setTimeout(function(){
            var max = 0;
            //check index for number of entries, average, pick dominant emotion score and respond with corresponding emoji
            
            //reset the index of the gloabl scores array to 0
        }, 10000);

    });
} 

call_emotion();


//move all code below to the slack_bot
var emotionResults = [];

// TODO: call addEntry every time there is an emotion dataPoint in the controller handler
function addEntry(ts, ch, sc) //(timeStamp, channel, scores) 
{
    var indexFound = 0;
    var addedEntry = false;
    console.log('in addEntry function');

    //check if inputs are valid
    if(ts === undefined || ch == undefined || sc == undefined) {
        console.log('entry empty, not added');
        return;
    }

    //first check if we already have an entry with the same timeStamp & channel
    if(emotionResults.length>0){

        //indexFound = emotionResults.indexOf.timeStamp(ts);
        for (var i = 0; i < emotionResults.length; i++) {
        
            if (emotionResults[i].timeStamp == ts && emotionResults[i].channel == ch){
                indexFound = i;
                break;
            }
        }
       
        if (indexFound != -1) {

                //add the scores together for this entry & the new data, keeping a running sum
                emotionResults[indexFound].scores.anger += sc.anger;
                emotionResults[indexFound].scores.contempt += sc.contempt;
                emotionResults[indexFound].scores.disgust += sc.disgust;
                emotionResults[indexFound].scores.fear += sc.fear;
                emotionResults[indexFound].scores.happiness += sc.happiness;
                emotionResults[indexFound].scores.neutral += sc.neutral;
                emotionResults[indexFound].scores.sadness += sc.sadness;
                emotionResults[indexFound].scores.surprise += sc.surprise; 
                
                //increment the count emotion dataPoints
                emotionResults[indexFound].dataPoints ++;
                addedEntry = true;
                console.log('updated existing entry');
                console.log('entry:' + emotionResults[indexFound]);
                //If reached 10 data points, compute & send the emotion
                if (emotionResults[indexFound].dataPoints == 10) {
                    
                    computeAndSendEmotion(emotionResults[indexFound]);
                    
                    //remove this result from the array, it is processed.
                    emotionResults.splice(indexFound, 1);
            }
        }
     }
     if (!addedEntry) {
        //add to the array, set dataPoints to 1
          emotionResults.push({
                timeStamp: ts,
                channel: ch,
                scores: sc,
                dataPoints: 1        
            });
        console.log('added new entry');
        console.log('entry:' + emotionResults[indexFound]);
    }
    
}  

var emotionResults = [];
//array maintenance 
//check if there are old emotions left around, that didnt reach 10 dataPoints
//if so, convert to emotion and send
//remove that data from array
function maintainResults(msec) //this is the time we will use as threshold
{
   var tsNow = new Date().getTime();
   console.log('in maintainResults function');
   emotionResults.forEach(function(entry, index){
        if(entry.timeStamp + msec < tsNow) {
            //compute & send the emotion
            computeAndSendEmotion(entry);
            //remove this result from the array, it is processed.
            emotionResults.splice(pos, index);
        }
   
   });
   //this makes the maintenance fucntion call again after the timeout
   setTimeout(maintainResults, msec); 
}

// boot up the first call to maintain the array
//msec=5000 for 5 seconds
//change the 5000 below if you need this more/less frequent
//maintainResults(5000);


//ToDO: write this function
function computeAndSendEmotion(emotionEntry) {
    //TODO: pick max of running sum among the emotionEntry.scores.* 
    
    var maxscore = emotionEntry.scores.anger;
    var dominantEmotion = 'rage';

    if (emotionEntry.scores.contempt > maxscore) {
        maxscore = emotionEntry.scores.contempt;
        dominantEmotion = 'unamused';
    }
    if (emotionEntry.scores.disgust > maxscore) {
        maxscore = emotionEntry.scores.disgust;
        dominantEmotion = 'confounded';
    }
    if (emotionEntry.scores.fear > maxscore) {
        maxscore = emotionEntry.scores.fear;
        dominantEmotion = 'flushed';
    }
    if (emotionEntry.scores.happiness > maxscore) {
        maxscore = emotionEntry.scores.happiness;
        dominantEmotion = 'grinning';
    }
    if (emotionEntry.scores.neutral > maxscore) {
        maxscore = emotionEntry.scores.neutral;
        dominantEmotion = 'neutral_face';
    }
    if (emotionEntry.scores.sadness > maxscore) {
        maxscore = emotionEntry.scores.sadness;
        dominantEmotion = 'sadness';
    }
    if (emotionEntry.scores.surprise > maxscore) {
        maxscore = emotionEntry.scores.surprise;
        dominantEmotion = 'open_mouth';
    }

    console.log('in computeAndSendEmotion function');
    console.log('emotion is ' + dominantEmotion);
    //TODO: send the dominant emotion to the emotionEntry.channel
    //if (dominantEmotion = 'happiness') {
  
    //}
        bot.api.reactions.add({
                timestamp: emotionEntry.timeStamp,
                channel: emotionEntry.channel,
                name: dominantEmotion,
            }, function(err, res) {
                if (err) {
                    bot.botkit.log('Failed to add emoji reaction :(', err);
                }
         });
    
}
