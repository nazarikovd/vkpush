const VKPUSH = require('./vkpush')
const path_for_save = 'save.json';
const fs = require('node:fs');

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
		clients.push({'id':cid, 'client': cl, 'creds': bb.creds, 'token': bb.token})
			
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
	
	let id = req.query.id; let resp
	if(!id){
		resp = events
	}else{
		resp = events.filter((event) => event.id == id)
	}
	
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

app.get('/getClient', function(req, res) {
	
	let id = req.query.id; let resp
	if(!id){
		resp = clients
	}else{
		resp = clients.filter((event) => clients.id == id)
	}
	
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

app.get('/gui', async function(req, res) { // нахуй я сюда пришел???

let commonhtml = await fs.readFileSync('./html/common.html', 'utf8');
let headerhtml = await fs.readFileSync('./html/header.html', 'utf8');
let ctablehtml = await fs.readFileSync('./html/clientable.html', 'utf8');
let etablehtml = await fs.readFileSync('./html/eventable.html', 'utf8');
let crowhtml = await fs.readFileSync('./html/clientrow.html', 'utf8');
let erowhtml = await fs.readFileSync('./html/eventrow.html', 'utf8');
let footerhtml = await fs.readFileSync('./html/footer.html', 'utf8');
let clientshtml = ''

	let resp = commonhtml+headerhtml

	if(!req.query.id){


		if(clients.length < 1){
			clientshtml = `<span class="nav-item" > nothing there <span>`

		}else{

			for (let client of clients){

			clientshtml += crowhtml.replaceAll('%cid%', client.id).replace('%aid%', client.creds.gcm.androidId).replace('%st%', client.creds.gcm.securityToken).replace('%token%', client.token)

			}
			clientshtml = ctablehtml.replace('%clients%', clientshtml)

		}

		


		resp += clientshtml
		resp += footerhtml
 		res.send(resp)
		
	}else{
		
		let id = req.query.id
		let resevent = events.filter((event) => event.id == id)
		let clientshtml = ''

		
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
					message.slice(0, 200).replaceAll('\n', '<br>')+`...`
				break;
				case 'validation':
					img = 'https://sun9-47.userapi.com/qr4lFuc6TeSja5gSB_q-nXPLoF9nbGZcv9IuKw/MBsiALCwZhQ.png'
					title = "Подтверждение"
					message = parsed.info+`<br><br>`+parsed.hash
					message.replaceAll('\n', '<br>')
				break;
				case 'erase_messages':
					img = 'https://sun9-47.userapi.com/qr4lFuc6TeSja5gSB_q-nXPLoF9nbGZcv9IuKw/MBsiALCwZhQ.png'
					title = parsed.title
					message = parsed.message
					message.replaceAll('\n', '<br>')
				break;
			case 'show_message':
					img = 'https://sun9-47.userapi.com/qr4lFuc6TeSja5gSB_q-nXPLoF9nbGZcv9IuKw/MBsiALCwZhQ.png'
					title = parsed.title
					message = parsed.message
					message.slice(0, 200).replaceAll('\n', '<br>')+`...`
				break;
				default:
					img = 'https://sun9-47.userapi.com/qr4lFuc6TeSja5gSB_q-nXPLoF9nbGZcv9IuKw/MBsiALCwZhQ.png'
					title = "Уведомление"
					message = JSON.stringify(event1)
					message.replaceAll('\n', '<br>')
				break;
			}
		clientshtml += erowhtml.replaceAll('%text%', message).replaceAll('%url%', img).replaceAll('%title%', title)
		
		}
		clientshtml = etablehtml.replace('%events%', clientshtml)
		resp += clientshtml
		resp += footerhtml
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

		case 'erase_messages':
			resp.success = true
			resp.type = 'erase_messages'
			resp.title = 'Erase'
			resp.message = 'Удаление уведомления '+normalise.items

			break;
		case 'show_message':
			resp.success = true
			resp.type = 'show_message'
			resp.title = normalise.title
			resp.message = normalise.body

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




