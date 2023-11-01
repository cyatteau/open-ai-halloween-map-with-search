import "./style.css";
import { ApiKeyManager } from "@esri/arcgis-rest-request";
import { reverseGeocode, geocode } from "@esri/arcgis-rest-geocoding";
import { Map, Marker } from "maplibre-gl";
import { Configuration, OpenAIApi } from "openai";
const api_Key = import.meta.env.VITE_ARCGIS_KEY;
const authentication = ApiKeyManager.fromKey(api_Key);
let fact = document.getElementById("fact");

const map = new Map({
  container: "map",
  style: `https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/arcgis/dark-gray?token=${api_Key}`,
  center: [-50.2505, 34.0442],
  zoom: 2,
});

let marker = new Marker({
  draggable: true,
  color: "#fd7708",
})
  .setLngLat([-77.0365, 38.8977])
  .addTo(map);

reverseGeocode([-77.0365, 38.8977], {
  authentication: authentication,
}).then((res) => {
  getInfo(res);
});

let lngLat;

function onDragEnd() {
  lngLat = marker.getLngLat();
  reverseGeocode([lngLat.lng, lngLat.lat], {
    authentication: authentication,
  }).then((res) => {
    getInfo(res);
  });
}

function getInfo(res) {
  coordinates.innerHTML = res.address.LongLabel;
  addressFact(res.address.LongLabel);
}

function addressFact(input) {
  const openai = new OpenAIApi(
    new Configuration({
      apiKey: import.meta.env.VITE_OPEN_AI_KEY,
    })
  );

  openai
    .createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "a scary fact about somewhere near this area: " + input,
        },
      ],
    })
    .then((res) => {
      console.log(res.data.choices[0].message.content);
      fact.innerHTML = res.data.choices[0].message.content;
    });
}

marker.on("dragend", onDragEnd);

let theBody = document.getElementById("theBody");
let searchInput = document.createElement("input");
searchInput.classList.add("searchInput");
searchInput.setAttribute("type", "text");
searchInput.setAttribute("placeholder", "Enter address or place");
theBody.appendChild(searchInput);
let searchBtn = document.createElement("button");
searchBtn.classList.add("search-btn");
searchBtn.innerHTML = "search";
theBody.appendChild(searchBtn);

searchBtn.addEventListener("click", () => {
  let searchValue = searchInput.value;
  resetMap(searchValue);
});

function resetMap(searchValue) {
  geocode({
    singleLine: searchValue,
    outFields: "*",
    authentication,
  }).then((res) => {
    let theAdd = res.candidates[0].attributes.LongLabel;
    let searchLong = res.candidates[0].location.x;
    let searchLat = res.candidates[0].location.y;
    moveMap(searchLong, searchLat);
    getNewInfo(theAdd);
  });
}

function getNewInfo(theAdd) {
  coordinates.innerHTML = theAdd;
  addressFact(theAdd);
}

function moveMap(searchLong, searchLat) {
  map.flyTo({
    center: [searchLong, searchLat],
    zoom: 12,
  });
  marker.setLngLat([searchLong, searchLat]);
}
