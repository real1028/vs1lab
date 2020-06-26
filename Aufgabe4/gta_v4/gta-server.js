/**
 * Template für Übungsaufgabe VS1lab/Aufgabe3
 * Das Skript soll die Serverseite der gegebenen Client Komponenten im
 * Verzeichnisbaum implementieren. Dazu müssen die TODOs erledigt werden.
 */

/**
 * Definiere Modul Abhängigkeiten und erzeuge Express app.
 */

var http = require('http');
//var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var express = require('express');

var app;
app = express();
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
	extended: false
}));

// Setze ejs als View Engine
app.set('view engine', 'ejs');

/**
 * Konfiguriere den Pfad für statische Dateien.
 * Teste das Ergebnis im Browser unter 'http://localhost:3000/'.
 */


app.use(express.static(__dirname + "/public"));

/**
 * Konstruktor für GeoTag Objekte.
 * GeoTag Objekte sollen min. alle Felder des 'tag-form' Formulars aufnehmen.
 */

function GeoTag(latitude, longitude, name, hashtag, id) {
	this.latitude = latitude;
	this.longitude = longitude;
	this.name = name;
	this.hashtag = hashtag;
	this.id = id;

	this.getLatitude = function () {
		return this.latitude;
	};
	this.getLongitude = function () {
		return this.longitude;
	};
	this.getName = function () {
		return this.name;
	};
	this.getHashtag = function () {
		return this.hashtag;
	};
	this.getId = function (){
		return this.id;
	}
	this.setLatitude = function (latitude) {
		this.latitude = latitude;
	}
	this.setLongitude = function (longitude) {
		this.longitude = longitude;
	}
	this.setName = function (name) {
		this.name = name;
	}
	this.setHashtag = function (hashtag) {
		this.hashtag = hashtag;
	}
}

/**
 * Modul für 'In-Memory'-Speicherung von GeoTags mit folgenden Komponenten:
 * - Array als Speicher für Geo Tags.
 * - Funktion zur Suche von Geo Tags in einem Radius um eine Koordinate.
 * - Funktion zur Suche von Geo Tags nach Suchbegriff.
 * - Funktion zum hinzufügen eines Geo Tags.
 * - Funktion zum Löschen eines Geo Tags.
 */

var InMemory = (function () {
	let tagList = [];
	let id = 0;

	return {
		searchByRadius: function (latitude, longitude, radius) {
			let resultList = tagList.filter(function (entry) {
				return (
					(Math.abs(entry.getLatitude() - latitude) < radius) &&
					(Math.abs(entry.getLongitude() - longitude) < radius)
				);
			});
			return resultList;
		},

		searchByTerm: function (term) {
			let resultList = tagList.filter(function (entry) {
				return (
					entry.getName().toString().includes(term) ||
					entry.getHashtag().toString().includes(term)
				);
			});
			return resultList;
		},

		searchById: function(id){
			return tagList.filter(tag => tag.id == id);
		},

		add: function (GeoTag) {
			tagList.push(GeoTag);
		},
		change: function (latitude, longitude, name, hashtag, id) {
			let tag = GeoTag.searchById(id);
			if(latitude){
				tag.setLatitude(latitude);
			}
			if(longitude){
				tag.setLongitude(longitude);
			}
			if(name){
				tag.setName(name);
			}
			if(hashtag){
				tag.setHashtag(hashtag);
			}
		},
		remove: function (id) {
			tagList.splice(GeoTag.searchById(id), 1);
		},
		getLastElement: function(){
			return tagList[tagList.length];
		}
	}
})();

/**
 * Route mit Pfad '/' für HTTP 'GET' Requests.
 * (http://expressjs.com/de/4x/api.html#app.get.method)
 *
 * Requests enthalten keine Parameter
 *
 * Als Response wird das ejs-Template ohne Geo Tag Objekte gerendert.
 */

app.get('/', function (req, res) {
	let lat = req.body.lat;
	let lon = req.body.lon;
	res.render('gta', {
		taglist: InMemory.searchByRadius(lat, lon, 5),
		lat: lat,
		lon: lon,
		datatags: JSON.stringify(InMemory.searchByRadius(lat, lon, 5))
	});
});

/**
 * Route mit Pfad '/tagging' für HTTP 'POST' Requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests enthalten im Body die Felder des 'tag-form' Formulars.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Mit den Formulardaten wird ein neuer Geo Tag erstellt und gespeichert.
 *
 * Als Response wird das ejs-Template mit Geo Tag Objekten gerendert.
 * Die Objekte liegen in einem Standard Radius um die Koordinate (lat, lon).
 */

app.post('/tagging', function (req, res) {
	let lat = req.body.lat;
	let lon = req.body.lon;
	let name = req.body.myName;
	let hashtag = req.body.myHashtag;

	InMemory.add(new GeoTag(lat, lon, name, hashtag));

	res.render('gta', {
		taglist: InMemory.searchByRadius(lat, lon, 5),
		lat: lat,
		lon: lon,
		datatags: JSON.stringify(InMemory.searchByRadius(lat, lon, 5))
	});
});

/**
 * Route mit Pfad '/discovery' für HTTP 'POST' Requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests enthalten im Body die Felder des 'filter-form' Formulars.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Als Response wird das ejs-Template mit Geo Tag Objekten gerendert.
 * Die Objekte liegen in einem Standard Radius um die Koordinate (lat, lon).
 * Falls 'term' vorhanden ist, wird nach Suchwort gefiltert.
 */

app.post('/discovery', function (req, res) {
	let lat = req.body.hLat;
	let lon = req.body.hLon;
	let term = req.body.searchTerm;

	if (term) {
		res.render('gta', {
			taglist: InMemory.searchByTerm(term),
			lat: lat,
			lon: lon,
			datatags: JSON.stringify(InMemory.searchByTerm(term))
		})
	} else {
		res.render('gta', {
			taglist: InMemory.searchByRadius(lat, lon, 5),
			lat: lat,
			lon: lon,
			datatags: JSON.stringify(InMemory.searchByRadius(lat, lon, 5))
		})
	}
});

/**
 * Aufgabe 4
 */

//get by radius, by term or all
app.get('/geotags', function(req, res){
	let stdRadius = 10;
	let lat = req.query.lat;
	let lon = req.query.lon;
	let term = req.query.term;

	if(term == undefined){
		res.status(200).json(GeoTag.getAll());
	} else if(term == ""){
		res.status(200).json(GeoTag.searchByRadius(lat, lon, stdRadius));
	} else {
		res.status(200).json(GeoTag.searchByTerm(term));
	}
});

//post new resource
app.post('/geotags', function(req, res){
	GeoTag.add(req.body);
	res.status(201).json(GeoTag.getLastElement());
});

//get specific
app.get('/geotags/:id',function(req, res){
	let id = req.params.id;
	res.status(200).json(GeoTag.searchById(id));
});
//put specific
app.put('/geotags/:id',function(req, res){
	let id = req.params.id;
	let longitude = req.params.longitude;
	let latitude = req.params.latitude;
	let name = req.params.name;
	let hashtag = req.params.hashtag;
	GeoTag.change(latitude, longitude, name, hashtag, id);

	res.status(204);
});
//delete specific
app.del('/geotags/:id',function(req, res){
	let id = req.params.id;
	GeoTag.remove(GeoTag.searchById(id));
	res.status(204);
});

/**
 * Setze Port und speichere in Express.
 */

var port = 3000;
app.set('port', port);

/**
 * Erstelle HTTP Server
 */

var server = http.createServer(app);

/**
 * Horche auf dem Port an allen Netzwerk-Interfaces
 */

server.listen(port);
