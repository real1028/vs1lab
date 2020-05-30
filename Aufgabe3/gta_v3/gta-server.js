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

var gtagConstructor = function(name, latitude, longitude, hashtag) {
    return gtag = {
        name: name,
        latitude: latitude,
        longitude: longitude,
        hashtag: hashtag
    }
};


/**
 * Modul für 'In-Memory'-Speicherung von GeoTags mit folgenden Komponenten:
 * - Array als Speicher für Geo Tags.
 * - Funktion zur Suche von Geo Tags in einem Radius um eine Koordinate.
 * - Funktion zur Suche von Geo Tags nach Suchbegriff.
 * - Funktion zum hinzufügen eines Geo Tags.
 * - Funktion zum Löschen eines Geo Tags.
 */

const tagsModule = (function () {

    let taglist = [];

    const distance = function (lon1, lat1, lon2, lat2) {
        var R = 6371; // Radius of the earth in km
        var dLat = (lat2-lat1) * Math.PI / 180;  // Javascript functions in radians
        var dLon = (lon2-lon1) * Math.PI / 180;
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var dist = R * c; // Distance in km
        return dist;
    };

    return {
        addTag: function (gtag) {
            taglist.push(gtag);
        },

        removeTag: function (gtag) {
            for (let i = 0; i < taglist.length; i++) {
                if (taglist[i] === gtag) {
                    taglist.slice(i, 1);
                }
            }
        },
        
        searchTag: function (searchterm) {
            let gtag = [];
            for (let i = 0; i < taglist.length; i++) {
                if (taglist[i].hashtag.includes(searchterm) || taglist[i].name.includes(searchterm)) {
                    gtag.push(taglist[i]);
                }
            }
            return gtag;
        },
        
        searchTagsWithRadius: function (coordinate, radius) {
            let tagsWithRadius = [];
            for (let i = 0; i < taglist.length; i++) {
                if (distance(taglist[i].latitude, taglist[i].longitude, coordinate.latitude, coordinate.longitude) <= radius) {
                    tagsWithRadius.push(taglist[i]);
                }
            }
            return tagsWithRadius;
        },
    };
})();


/**
 * Route mit Pfad '/' für HTTP 'GET' Requests.
 * (http://expressjs.com/de/4x/api.html#app.get.method)
 *
 * Requests enthalten keine Parameter
 *
 * Als Response wird das ejs-Template ohne Geo Tag Objekte gerendert.
 */

app.get('/', function(req, res) {
    res.render('gta', {
        taglist: [],
        coordinates: {
            latitude: '',
            longitude: ''
        }
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

app.post('/tagging', function(req, res) {
    const gtag = gtagConstructor(req.body.name, parseFloat(req.body.latitude), parseFloat(req.body.longitude), req.body.hashtag);
    tagsModule.addTag(gtag);
    const tagsToRender = tagsModule.searchTagsWithRadius({latitude: parseFloat(gtag.latitude), longitude: parseFloat(gtag.longitude)}, 20);
    res.render('gta', {
        taglist: tagsToRender,
        coordinates: {
            latitude: gtag.latitude,
            longitude: gtag.longitude
        }
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

app.post('/discovery', function(req, res) {
    const gtag = tagsModule.searchTag(req.body.searchterm);
    var renderObject = {};
    if (gtag.length !== 0) {
        renderObject = {
            taglist: tagsModule.searchTagsWithRadius({latitude: parseFloat(gtag[0].latitude), longitude: parseFloat(gtag[0].longitude)}, 20),
            coordinates: {
                latitude: parseFloat(gtag[0].latitude),
                longitude: parseFloat(gtag[0].longitude)
            }
        }
    } else {
        renderObject = {
            taglist: tagsModule.searchTagsWithRadius({latitude: parseFloat(req.body.hidden_latitude), longitude: parseFloat(req.body.hidden_longitude)}, 20),
            coordinates: {
                latitude: parseFloat(req.body.hidden_latitude),
                longitude: parseFloat(req.body.hidden_longitude)
            }
        }
    }

    res.render('gta', renderObject);
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
