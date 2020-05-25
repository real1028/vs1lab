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

    return {
        addTag: function (gtag) {
            taglist.push(gtag);
            console.log('tag added', gtag)
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
                console.log(taglist[i]);
                if (taglist[i].hashtag.includes(searchterm)) {
                    gtag.push(taglist[i]);
                }
            }
            return gtag;
        },
        
        searchTagsWithRadius: function (coordinate, radius) {
            let tagsWithRadius = [];
            for (let i = 0; i < taglist.length; i++) {
                if (    taglist[i].latitude >= coordinate.latitude - radius
                    &&  taglist[i].latitude <= coordinate.latitude + radius
                    &&  taglist[i].longitude >= coordinate.longitude - radius
                    &&  taglist[i].longitude <= coordinate.longitude + radius
                ) {
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
    const gtag = gtagConstructor(req.body.name, req.body.latitude, req.body.longitude, req.body.hashtag);
    tagsModule.addTag(gtag);
    const tagsToRender = tagsModule.searchTagsWithRadius({latitude: gtag.latitude, longitude: gtag.longitude}, 10);
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
    res.render('gta', {
        taglist: gtag === undefined
            ? tagsModule.searchTagsWithRadius({latitude: req.body.hidden_latitude, longitude: req.body.hidden_longitude}, 10) // no tag found - take the last one
            : tagsModule.searchTagsWithRadius({latitude: gtag.latitude, longitude: gtag.longitude}, 10), // tag found - take this one
        coordinates: {
            latitude: gtag === undefined ? req.body.latitude : gtag.latitude,
            longitude: gtag === undefined ? req.body.longitude : gtag.longitude
        }
    });
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
