/* Dieses Skript wird ausgeführt, wenn der Browser index.html lädt. */

// Befehle werden sequenziell abgearbeitet ...

/**
 * "console.log" schreibt auf die Konsole des Browsers
 * Das Konsolenfenster muss im Browser explizit geöffnet werden.
 */
console.log("The script is going to start...");

/**
 * Ajax für Aufgabe 4
 */
//init
var ajax = new XMLHttpRequest();

//Tagging Button
document.getElementById("tag-form button").on("click", function(event){

	ajax.open("POST", "/geotags" , true);
	ajax.setRequestHeader("Content-Type", "application/json");
	ajax.responseType = "json";

	let lat = document.getElementById("latitude").value
	let lon = document.getElementById("longitude").value
	let name = document.getElementById("hidden_latitude",).value
	let hashtag = document.getElementById("hidden_longitude").value

	ajax.send(JSON.stringify(new GeoTag(lat, lon, name, hashtag)));

});
//Discovery Button
document.getElementById("filter-form button").on("click", function(event){

	let latURL = "?lat="+document.getElementById("hidden_latitude").value();
	let lonURL = "&lon="+document.getElementById("hidden_longitude").value();
	let termURL = "&term="+document.getElementById("search term").value();

	ajax.open("GET", "/geotags"+latURL+lonURL+termURL, true);
	ajax.responseType = "json";
	ajax.send(null);
});

//Refresh

ajax.onreadystatechange = function() {

	if(ajax.readyState == 4){
		console.log(ajax.response);
		let resultArray = ajax.response;
		let results = "";

		resultArray.forEach(function(tag){
			results += "<li>";
			results += (tag.name+" ("+tag.latitude+", "+tag.longitude+") "+tag.hashtag);
			results += "</li>";
		});

		document.getElementById("results").html(results);
		gtaLocator.updateLocation();
	}
}

// Es folgen einige Deklarationen, die aber noch nicht ausgeführt werden ...

// Hier wird die verwendete API für Geolocations gewählt
// Die folgende Deklaration ist ein 'Mockup', das immer funktioniert und eine fixe Position liefert.
GEOLOCATIONAPI = {
	getCurrentPosition: function (onsuccess) {
		onsuccess({
			"coords": {
				"latitude": 49.013790,
				"longitude": 8.390071,
				"altitude": null,
				"accuracy": 39,
				"altitudeAccuracy": null,
				"heading": null,
				"speed": null
			},
			"timestamp": 1540282332239
		});
	}
};

// Die echte API ist diese.
// Falls es damit Probleme gibt, kommentieren Sie die Zeile aus.
GEOLOCATIONAPI = navigator.geolocation;

/**
 * GeoTagApp Locator Modul
 */
var gtaLocator = (function GtaLocator(geoLocationApi) {

	// Private Member

	/**
	 * Funktion spricht Geolocation API an.
	 * Bei Erfolg Callback 'onsuccess' mit Position.
	 * Bei Fehler Callback 'onerror' mit Meldung.
	 * Callback Funktionen als Parameter übergeben.
	 */
	var tryLocate = function (onsuccess, onerror) {
		if (geoLocationApi) {
			geoLocationApi.getCurrentPosition(onsuccess, function (error) {
				var msg;
				switch (error.code) {
					case error.PERMISSION_DENIED:
						msg = "User denied the request for Geolocation.";
						break;
					case error.POSITION_UNAVAILABLE:
						msg = "Location information is unavailable.";
						break;
					case error.TIMEOUT:
						msg = "The request to get user location timed out.";
						break;
					case error.UNKNOWN_ERROR:
						msg = "An unknown error occurred.";
						break;
				}
				onerror(msg);
			});
		} else {
			onerror("Geolocation is not supported by this browser.");
		}
	};

	// Auslesen Breitengrad aus der Position
	var getLatitude = function (position) {
		return position.coords.latitude;
	};

	// Auslesen Längengrad aus Position
	var getLongitude = function (position) {
		return position.coords.longitude;
	};

	// Hier Google Maps API Key eintragen
	var apiKey = "L4uT0AEzjTGGz1OlFQkKsiIxjb9jt4c2";

	/**
	 * Funktion erzeugt eine URL, die auf die Karte verweist.
	 * Falls die Karte geladen werden soll, muss oben ein API Key angegeben
	 * sein.
	 *
	 * lat, lon : aktuelle Koordinaten (hier zentriert die Karte)
	 * tags : Array mit Geotag Objekten, das auch leer bleiben kann
	 * zoom: Zoomfaktor der Karte
	 */
	var getLocationMapSrc = function (lat, lon, tags, zoom) {
		zoom = typeof zoom !== 'undefined' ? zoom : 10;

		if (apiKey === "YOUR_API_KEY_HERE") {
			console.log("No API key provided.");
			return "images/mapview.jpg";
		}

		var tagList = "&pois=You," + lat + "," + lon;
		if (tags !== undefined) tags.forEach(function (tag) {
			tagList += "|" + tag.name + "," + tag.latitude + "," + tag.longitude;
		});

		var urlString = "https://www.mapquestapi.com/staticmap/v4/getmap?key=" +
			apiKey + "&size=600,400&zoom=" + zoom + "&center=" + lat + "," + lon + "&" + tagList;

		console.log("Generated Maps Url: " + urlString);
		return urlString;
	};

	return { // Start öffentlicher Teil des Moduls ...

		// Public Member

		readme: "Dieses Objekt enthält 'öffentliche' Teile des Moduls.",

		updateLocation: function () {
			let imageNode = document.getElementById("result-img");
			let tags = JSON.parse(imageNode.getAttribute("data-tags"));

			if (document.getElementById("latitude").value == '' || document.getElementById("longitude").value == '') {
				console.log("trying to locate....");
				tryLocate(function (onsuccess) {
						let lat = getLatitude(onsuccess);
						let lon = getLongitude(onsuccess);
						document.getElementById("latitude").value = lat;
						document.getElementById("longitude").value = lon;
						document.getElementById("hidden_latitude",).value = lat;
						document.getElementById("hidden_longitude").value = lon;
						imageNode.src = getLocationMapSrc(lat, lon, tags, 5);
					}, function (onerror) {
						alert(onerror);
					}
				)
			} else {
				console.log("got data, no try")
				let lat = document.getElementById("latitude").value;
				let lon = document.getElementById("longitude").value;
				imageNode.src = getLocationMapSrc(lat, lon, tags, 5);
			}
		}


	}; // ... Ende öffentlicher Teil
})(GEOLOCATIONAPI);

/**
 * $(function(){...}) wartet, bis die Seite komplett geladen wurde. Dann wird die
 * angegebene Funktion aufgerufen. An dieser Stelle beginnt die eigentliche Arbeit
 * des Skripts.
 */
$(function () {
	gtaLocator.updateLocation();
});