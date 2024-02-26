const VKPUSH = require('./vkpush')
const axios = require('axios');

const express = require('express');
const app = express();
const events = []
let clients = [];
const bodyParser = require('body-parser');
const jsonfile = require('jsonfile') 
const path_for_save = 'save.json';

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
	<head>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
	<script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
	<script src="https://cdn.jsdelivr.net/npm/popper.js@1.12.9/dist/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
	<script src="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>

	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
	<title> vkpush </title>
	</head><body>
	<ul class="list-group">`
	
	if(!req.query.id){
		for (let client of clients){
			resp = resp + 
			`<li class="list-group-item"> Client ID: `+client.id+`<br> AndroidID: `+client.creds.gcm.androidId+`<br> secutityToken: `+client.creds.gcm.androidId+`<div class="dropdown show"><a class="btn btn-secondary dropdown-toggle" href="#" role="button" id="dropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">...</a>
			<div class="dropdown-menu" aria-labelledby="dropdownMenuLink">
			<a class="dropdown-item" href="/remove?id=`+client.id+`">remove</a>
			<a class="dropdown-item" href="/gui?id=`+client.id+`">read</a>
			</div></div></li>`
		}
		resp = resp + `</ul>`
		res.send(resp)
		
	}else{
		
		let id = req.query.id
		let resevent = events.filter((event) => event.id == id)
			
		for (let event1 of resevent){
			let dat = event1.notification.notification.appData
			let img
			let title
			let body
			
			var op = {year: 'numeric',month: 'numeric',day: 'numeric',weekday: 'short',hour: 'numeric',minute: 'numeric'};
			let sent = new Date(Number(event1.notification.notification.sent))
			sent = sent.toLocaleString("ru", op)

			for (let key of dat){
				
				if(key.key == 'image'){
					img = JSON.parse(key.value)[0].url
				}
				if(key.key == 'title'){
					title = key.value
				}
				if(key.key == 'body'){
					body = key.value


				}
				
			}
			if(!body){
				resp = resp + ''
			}else{
				
				resp = resp + 
					`
					<li class="list-group-item"> <div class="toast-header">
						<img class="bd-placeholder-img rounded me-2" width="20" height="20" preserveAspectRatio="xMidYMid slice" focusable="false" src="`+img+`"></img>

						<strong class="me-auto">`+title+`</strong>
						<small>`+sent+`</small>
					</div>
					<div class="toast-body">
						`+body.slice(0, 200).replaceAll('\n', '<br>')+`...
					</div></li>`
			}
			
		}
		resp = resp + `</ul>`
		res.send(resp)
		
	}
		
	
})

async function collect(data){
	let id = data.fromID
	let notification = data.notification
	events.push({"id":id, "notification":notification})
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




