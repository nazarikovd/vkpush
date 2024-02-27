const VKPUSH = require('./vkpush')
const path_for_save = 'save.json';


const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const jsonfile = require('jsonfile')

let events = []
let clients = [];

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));




app.get('/getPushToken', function(req, res) {
	
	let bb = new VKPUSH(collect)
	bb.init().then((cl) => {

		let cid = bb.id
		clients.push({'id':cid, 'client': cl, 'creds': bb.creds})
			
		res.send({
			
			"success": true,
			"id": bb.id,
			"token":bb.token,
			"creds": {
				"aid": bb.creds.gcm.androidId,
				"st": bb.creds.gcm.securityToken
		}}
			
		);
	}).catch((e) => 
		res.send({
			
			"success": false,
			"error": e
		})
	)
});

app.get('/get', function(req, res) {
	
	let id = req.query.id
	let resp = events.filter((event) => event.id == id)
	if(resp){
		res.send({
			"response": resp
		})
	}else{
		res.send({
			"response": []
		})
	}

})

app.get('/remove', function(req, res) {

	let cid = req.query.id

	resp = clients.find(item => item.id == cid)

	if(resp){
		
		try{
			index = clients.findIndex((item) => item.id == cid)
			resp.client._socket.destroy();
			clients.splice(index, 1)
			
			res.send({
				"response": {'success':true}
			})
			
		}catch(e){
			
			res.send({
				"response": {
					'success':false,
					"error": e  
				}
			})
		
		}
		
	}else{
		res.send({
			"response": {
				'success':false,
				'error': 'Not found'
			}
		})
	}
})

app.get('/addByCreds', function(req, res) {
	
	
	let aId = req.query.aid
	let sT = req.query.st
	if(clients.length > 0){
		
		index = clients.findIndex((item) => item.creds.gcm.androidId == aId)
	
		if(index > -1){
			
			res.send({
				"success": false,
				"error": "This android id already in the list"
			})
			return
		}
	}
	
	let creds = {

            "gcm":
                {
                    "androidId": aId,
                    "securityToken": sT
                },
                
            'keys':
                {
                    "privateKey": '1',
                    "publicKey": '1',
                    "authSecret": '1'
                }

    }
	let bb = new VKPUSH(collect, creds)
		bb.init().then((cl) => {

			let cid = bb.id
			clients.push({'id':cid, 'client': cl, "creds": creds})
			
			res.send({
				"success": true,
				"id": bb.id,
				"creds": {
					"aid": bb.creds.gcm.androidId,
					"st": bb.creds.gcm.securityToken
				}
			});
		})
})
app.get('/save', function(req, res) {
	jsonfile.writeFile(path_for_save, clients, function (err) {
		
		if (err){
			res.send({
				"success": false,
				"error": err
			})
		}else{
			res.send({
				"success": true,
				"path": path_for_save
			})
		}
	})
})
app.get('/restore', function(req, res) {
	
	jsonfile.readFile(path_for_save, clients, function (err, obj) {
		
		if (err){
			res.send({
				"success": false,
				"error": err
			})
		}else{
			for (let client of clients){
				client._socket.destroy();
			}
			clients = []
			let clients2 = obj
			for (let client of clients2){
				let aId = client.creds.gcm.androidId
				let sT = client.creds.gcm.securityToken
					let creds = {

					"gcm":
						{
							"androidId": aId,
							"securityToken": sT
						},
						
					'keys':
						{
							"privateKey": '1',
							"publicKey": '1',
							"authSecret": '1'
						}

					}
					
				let bb = new VKPUSH(collect, creds)
					bb.init().then((cl) => {

					let cid = bb.id
					clients.push({'id':cid, 'client': cl, "creds": creds})
					})
			}
			res.send({
				"success": true,
				"path": path_for_save
			})
		}
	})
})

app.get('/gui', function(req, res) { // нахуй я сюда пришел???

	let resp = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
    <title>vkpush</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/material-design-icons/3.0.1/iconfont/material-icons.min.css">
</head>
<body>
    <h1 style="color: var(--bs-gray-100);background: var(--bs-gray-800);font-size: 20.18px;text-align: left;padding-top: 8px;padding-right: 8px;padding-bottom: 15px;padding-left: 15px;">vkpush</h1>
    <div class="card-group" style="position: relative;overflow: visible;">



`
	
	if(!req.query.id){
		for (let client of clients){
			resp = resp + 
			`
			<div class="card" style="min-width: 400px;max-width: 400px;min-height: 150px;max-height: 150px;box-shadow: 0px 0px 4px 0px;">
            <div class="card-body">
                <div class="col" style="padding: 8px;">
                    <div class="row">
                        <div class="col"><code>ClientID: `+client.id+`</code></div>
                    </div>
                    <div class="row">
                        <div class="col"><code>AndroidID: `+client.creds.gcm.androidId+`</code></div>
                        <div class="col"><code>securityToken: `+client.creds.gcm.androidId+`</code></div>
                    </div>
                    <div class="row">
                        <div class="col text-end"><a href="/gui?id=`+client.id+`">read</a> <a href="/remove?id=`+client.id+`">remove</a></div>
                    </div>
                </div>
            </div>
        </div>`
		}
		resp = resp + `</div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>`
		res.send(resp)
		
	}else{
		
		let id = req.query.id
		let resevent = events.filter((event) => event.id == id)
			
		for (let event1 of resevent){
			let parsed = event1.parsed
			let img
			let title
			let body
			let op = {year: 'numeric',month: 'numeric',day: 'numeric',weekday: 'short',hour: 'numeric',minute: 'numeric'};
			let sent = new Date(Number(event1.notification.notification.sent))
			sent = sent.toLocaleString("ru", op)

			switch (parsed.type){
				case 'message':
					img = parsed.img.url
					title = parsed.title
					message = parsed.message
					resp = resp + 
	`
	<div class="card" style="min-width: 300px;max-width: 300px;min-height: 150px;max-height: 400px;box-shadow: 0px 0px 4px 0px;">
	    <div class="card-body">
	        <div class="col" style="padding: 8px;">
	            <div class="row">
	                <div class="col" style="padding: 8px;"><img style="width: 20px;height: 20px;" src="`+img+`"/><strong style="padding: 8px;">`+title+`</strong><small class="d-xxl-flex" style="padding-left: 32px;">`+sent+`</small></div>
	            </div>
	            <div class="row">
	                <div class="col" style="padding-top: 8px;">
	                    <p>
							`+message.slice(0, 200).replaceAll('\n', '<br>')+`...
						</p>
	                </div>
	            </div>
	        </div>
	    </div>
	</div>
	`			
				break;
				case 'validation':
					img = 'https://sun9-47.userapi.com/qr4lFuc6TeSja5gSB_q-nXPLoF9nbGZcv9IuKw/MBsiALCwZhQ.png'
					title = "Подтверждение"
					message = parsed.info+`<br><br>`+parsed.hash
					resp = resp + 
	`
	<div class="card" style="min-width: 300px;max-width: 300px;min-height: 150px;max-height: 400px;box-shadow: 0px 0px 4px 0px;">
	    <div class="card-body">
	        <div class="col" style="padding: 8px;">
	            <div class="row">
	                <div class="col" style="padding: 8px;"><img style="width: 20px;height: 20px;" src="`+img+`"/><strong style="padding: 8px;">`+title+`</strong><small class="d-xxl-flex" style="padding-left: 32px;">`+sent+`</small></div>
	            </div>
	            <div class="row">
	                <div class="col" style="padding-top: 8px;">
	                    <p>
							`+message.replaceAll('\n', '<br>')+`
						</p>
	                </div>
	            </div>
	        </div>
	    </div>
	</div>
	`			
				break;
			}
			
			
		}

		resp = resp + `</div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>`
		res.send(resp)
		
	}
		
	
})

async function collect(data){
	let id = data.fromID
	let notification = data.notification
	events.push({"id":id, "notification":notification, "parsed": parse(notification)})
}

function orange (data){
	return '\x1b[33m'+data+'\x1b[0m'
}
function green (data){
	return '\x1b[32m'+data+'\x1b[0m'
}

function red (data){
	return '\x1b[91m'+data+'\x1b[0m'
}

function parse(message){
try{	
	let resp = {}
	let notification = message.notification
	if(!isset(() => notification)){
		resp.success = false
		resp.error = '[notification] empty'
		resp.type = 'unknown'
		return resp
	}
	let appData = notification.appData
	if(!isset(() => appData)){
		resp.success = false
		resp.error = '[appData] empty'
		resp.type = 'unknown'
		return resp
	}
	let app = notification.category
	let normalise = {}
	for(let keys of appData){
		normalise[keys.key] = keys.value
	}
	let type = normalise.type

	switch(type){
		case 'msg':
			resp.success = true
			resp.type = 'message'
			resp.from_id = normalise.from_id
			resp.to_id = normalise.to_id
			resp.message = normalise.body
			resp.title = normalise.title
			resp.img = JSON.parse(normalise.image)[0]
			resp.url = normalise.url
			resp.msgid = JSON.parse(normalise.context).msg_id
			break;

		case 'validate_action':
			resp.success = true
			resp.type = 'validation'
			resp.hash = JSON.parse(normalise.context).confirm_hash
			resp.info = JSON.parse(normalise.context).confirm
			break;

		default:
			resp.success = false
			resp.error = 'type unknown'
			resp.type = 'unknown'
	}



	return resp
}
catch(e){
	resp.success = false
	resp.error = 'parse error'
	resp.type = 'unknown'
	return resp
}
}

function isset (accessor) {
  try {
    // Note we're seeing if the returned value of our function is not
    // undefined or null
    return accessor() !== undefined && accessor() !== null
  } catch (e) {
    // And we're able to catch the Error it would normally throw for
    // referencing a property of undefined
    return false
  }
}














app.listen(3000);
console.clear()
console.log(orange('vkpush on ')+green('localhost:3000'))
console.log(' ')
console.log(orange('GET /getPushToken'))

console.log('get push token, android credentials, clientID and start listen for notifications')

console.log(' ')


console.log(orange('GET /addByCreds?aid=[')+green('androidId')+orange(']&st=[')+green('securityToken')+orange(']'))

console.log('get clientID and start listen for notifications by android credentials')

console.log(' ')


console.log(orange('GET /get?id=[')+green('clientID')+orange(']'))

console.log('json list of notifications')

console.log(' ')


console.log(orange('GET /remove?id=[')+green('clientID')+orange(']'))

console.log('remove listener')

console.log(' ')


console.log(orange('GET /save'))
console.log('save all clients to save.json')

console.log(' ')


console.log(orange('GET /restore'))

console.log('restore all clients from save.json'+red('	[!] it will destroy all current clients'))

console.log(' ')


console.log(orange('GET /gui'))

console.log('simple gui for what???')

console.log(' ')




