require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const openRouteService = require("openrouteservice-js");

const app = express();
const {
	PORT,
	ORS_TOKEN,
	GEONAMES_USERNAME,
} = process.env;

const ors = new openRouteService.Matrix({ api_key: ORS_TOKEN });

app.use(bodyParser());
app.use(cors());

morgan("dev");

const convertLangToISO = (lang = "en-US") => {
	return lang[0] + lang[1];
};

const getCoordinatesByCity = async (city, lang) => {
	return await axios.get(`http://api.geonames.org/searchJSON?q=${city}&lang=${convertLangToISO(lang)}&username=${GEONAMES_USERNAME}`);
};

app.post("/geo/search/city", (req, res) => {
	axios.get(`http://api.geonames.org/searchJSON?q=${req.body.city}&lang=${convertLangToISO(req.body.lang)}&username=${GEONAMES_USERNAME}`).then(q => {
		res.send(q.data.geonames);
	});
});

app.post("/geo/getCoordinates", (req, res) => {
	axios.get(`http://api.geonames.org/searchJSON?q=${req.body.city}&lang=${convertLangToISO(req.body.lang)}&username=${GEONAMES_USERNAME}`).then(q => {
		res.send({lng: q.data.geonames[0].lng, lat: q.data.geonames[0].lat});
	})
});

app.post("/geo/getDistance/byCity", async (req, res) => {
	const coordinatesFirst = await getCoordinatesByCity(req.body.firstCity, req.body.lang);
	const coordinatesSecond = await getCoordinatesByCity(req.body.secondCity, req.body.lang);

	axios.post("https://api.openrouteservice.org/v2/matrix/driving-car", {
		locations: [[coordinatesFirst.data.geonames[0].lng, coordinatesFirst.data.geonames[0].lat], [coordinatesSecond.data.geonames[0].lng, coordinatesSecond.data.geonames[0].lat]],
		metrics: ["distance", "duration"],
	}, {
		headers: {
			"Authorization": ORS_TOKEN,
		}
	}).then(q => {console.log(q.data);res.send({distance: q.data.distances[0][1], duration: q.data.durations[0][1]})});
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
