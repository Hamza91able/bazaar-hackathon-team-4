let map, hexLayer;

const GeoUtils = {
  EARTH_RADIUS_METERS: 6371000,

  radiansToDegrees: (r) => (r * 180) / Math.PI,
  degreesToRadians: (d) => (d * Math.PI) / 180,

  getDistanceOnEarthInMeters: (lat1, lon1, lat2, lon2) => {
    const lat1Rad = GeoUtils.degreesToRadians(lat1);
    const lat2Rad = GeoUtils.degreesToRadians(lat2);
    const lonDelta = GeoUtils.degreesToRadians(lon2 - lon1);
    const x =
      Math.sin(lat1Rad) * Math.sin(lat2Rad) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lonDelta);
    return (
      GeoUtils.EARTH_RADIUS_METERS * Math.acos(Math.max(Math.min(x, 1), -1))
    );
  },
};

const ZOOM_TO_H3_RES_CORRESPONDENCE = {
  5: 1,
  6: 2,
  7: 3,
  8: 3,
  9: 4,
  10: 5,
  11: 6,
  12: 6,
  13: 7,
  14: 8,
  15: 9,
  16: 9,
  17: 10,
  18: 10,
  19: 11,
  20: 11,
  21: 12,
  22: 13,
  23: 14,
  24: 15,
};

const H3_RES_TO_ZOOM_CORRESPONDENCE = {};
for (const [zoom, res] of Object.entries(ZOOM_TO_H3_RES_CORRESPONDENCE)) {
  H3_RES_TO_ZOOM_CORRESPONDENCE[res] = zoom;
}

const getH3ResForMapZoom = (mapZoom) => {
  return (
    ZOOM_TO_H3_RES_CORRESPONDENCE[mapZoom] ?? Math.floor((mapZoom - 1) * 0.7)
  );
};

const h3BoundsToPolygon = (lngLatH3Bounds) => {
  lngLatH3Bounds.push(lngLatH3Bounds[0]); // "close" the polygon
  return lngLatH3Bounds;
};

/**
 * Parse the current Query String and return its components as an object.
 */
const parseQueryString = () => {
  const queryString = window.location.search;
  const query = {};
  const pairs = (
    queryString[0] === "?" ? queryString.substr(1) : queryString
  ).split("&");
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split("=");
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
  }
  return query;
};

const queryParams = parseQueryString();

const handleHexagonClick = async (h3id) => {
  // Do whatever you want with the clicked hexagon ID
  console.log("Hexagon clicked:", h3id);

  // Example: Highlight the clicked hexagon
  this.searchH3Id = h3id;

  // Example: Zoom to the clicked hexagon
  const h3Boundary = h3.cellToBoundary(h3id);
  let bounds = undefined;
  for ([lat, lng] of h3Boundary) {
    if (bounds === undefined) {
      bounds = new L.LatLngBounds([lat, lng], [lat, lng]);
    } else {
      bounds.extend([lat, lng]);
    }
  }
  map.fitBounds(bounds);

  const response = await fetch("http://127.0.0.1:5009/v2/promo/user-score", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      latitude: lat,
      longitude: lng,
      resolution: 8,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch data from the second API");
  }

  const data = await response.json();

  $(".bd-example-modal-lg").modal("show");
  $(".bd-example-modal-lg").on("shown.bs.modal", function (e) {
    generateItems(data);
  });
};

function generateItems(itemData) {
  // Get the modal body element where cards will be appended
  var modalBody = document.querySelector(".modal-body .container");

  // Clear existing cards if any
  modalBody.innerHTML = "";

  // Loop through each item in itemData
  itemData.forEach(function (item, index) {
    // Create a new row after every fourth card
    if (index % 4 === 0) {
      var newRow = document.createElement("div");
      newRow.className = "row";
      modalBody.appendChild(newRow);
    }

    // Get the last row
    var rows = modalBody.querySelectorAll(".row");
    var lastRow = rows[rows.length - 1];

    // Create card div for each item
    var card = document.createElement("div");
    card.className = "card col-sm";
    card.style = "width: 18rem; margin-right: 10px; margin-bottom: 10px;"; // Add margin

    // Create image element for card
    var img = document.createElement("img");
    img.className = "card-img-top";
    img.src =
      "https://platform.bazaar.technology/static/media/icn_dummy_image.97cbeb46.svg";
    img.alt = "Card image cap";
    img.width = "100";
    img.height = "120";

    // Create card body div for card
    var cardBody = document.createElement("div");
    cardBody.className = "card-body";
    cardBody.style = "height: 150px; overflow: hidden;";

    // Create heading for item name
    var heading = document.createElement("p");
    heading.className = "card-title";
    heading.textContent = item.itemName;
    heading.style = "height: 60px; overflow: hidden; text-overflow: ellipsis;"; // Add styles to truncate text
    heading.style.fontSize = "12px";

    // Create paragraph for item bet
    var paragraph = document.createElement("p");
    paragraph.className = "card-text";

    // Create strong element for "Bet: "
    var strongBetLabel = document.createElement("strong");
    strongBetLabel.textContent = "Bet: ";
    paragraph.appendChild(strongBetLabel);

    // Create span element for bet value
    var betValue = document.createElement("span");
    betValue.textContent = item.bet;
    // Apply color based on bet value
    betValue.style.backgroundColor = item.bet === "Green" ? "green" : "yellow";
    betValue.style.padding = "5px";
    betValue.style.borderRadius = "5px";
    betValue.style.color = item.bet === "Green" ? "white" : "black";
    paragraph.appendChild(betValue);

    // Append elements to card body
    cardBody.appendChild(heading);
    cardBody.appendChild(paragraph);

    // Append elements to card
    card.appendChild(img);
    card.appendChild(cardBody);

    // Append card to last row
    lastRow.appendChild(card);
  });

  // Add a line break after each row
  var rows = modalBody.querySelectorAll(".row");
  rows.forEach(function (row) {
    row.insertAdjacentHTML("afterend", "<hr>");
  });
}

const copyToClipboard = (text) => {
  const dummy = document.createElement("textarea");
  document.body.appendChild(dummy);
  dummy.value = text;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);
};

var app = new Vue({
  el: "#app",

  data: {
    searchH3Id: undefined,
    gotoLatLon: undefined,
    currentH3Res: undefined,
  },

  computed: {},

  methods: {
    computeAverageEdgeLengthInMeters: function (vertexLocations) {
      let totalLength = 0;
      let edgeCount = 0;
      for (let i = 1; i < vertexLocations.length; i++) {
        const [fromLat, fromLng] = vertexLocations[i - 1];
        const [toLat, toLng] = vertexLocations[i];
        const edgeDistance = GeoUtils.getDistanceOnEarthInMeters(
          fromLat,
          fromLng,
          toLat,
          toLng
        );
        totalLength += edgeDistance;
        edgeCount++;
      }
      return totalLength / edgeCount;
    },

    updateMapDisplay: function () {
      if (hexLayer) {
        hexLayer.remove();
      }

      hexLayer = L.layerGroup().addTo(map);

      const zoom = map.getZoom();
      this.currentH3Res = getH3ResForMapZoom(zoom);
      const { _southWest: sw, _northEast: ne } = map.getBounds();

      const boundsPolygon = [
        [sw.lat, sw.lng],
        [ne.lat, sw.lng],
        [ne.lat, ne.lng],
        [sw.lat, ne.lng],
        [sw.lat, sw.lng],
      ];

      const h3s = h3.polygonToCells(boundsPolygon, this.currentH3Res);

      for (const h3id of h3s) {
        if (this.allowedH3s.includes(h3id)) {
          const polygonLayer = L.layerGroup().addTo(hexLayer);

          const isSelected = h3id === this.searchH3Id;

          const score = this.allowedH3sWithScores.find(
            (h3) => h3.h3Value8 === h3id
          );

          let fillColor = "red";
          if (score.overallScore > 1000) fillColor = "yellow";

          if (score.overallScore > 7000) fillColor = "lime";
          if (score.overallScore > 20000) fillColor = "green";

          const style = { fillColor, fillOpacity: 0.4 };

          const h3Bounds = h3.cellToBoundary(h3id);

          const tooltipText = `
                    Cell ID: <b>${h3id}</b>
                    `;

          const h3Polygon = L.polygon(h3BoundsToPolygon(h3Bounds), style)
            .on("click", () => handleHexagonClick(h3id))
            .bindTooltip(tooltipText)
            .addTo(polygonLayer);

          // less SVG, otherwise perf is bad
          if (Math.random() > 0.8 || isSelected) {
            var svgElement = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg"
            );
            svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            svgElement.setAttribute("viewBox", "0 0 200 200");
            svgElement.innerHTML = `<text x="20" y="70" class="h3Text">${h3id}</text>`;
            var svgElementBounds = h3Polygon.getBounds();
            L.svgOverlay(svgElement, svgElementBounds).addTo(polygonLayer);
          }
        }
      }
    },

    gotoLocation: function () {
      const [lat, lon] = (this.gotoLatLon || "").split(",").map(Number);
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lon) &&
        lat <= 90 &&
        lat >= -90 &&
        lon <= 180 &&
        lon >= -180
      ) {
        map.setView([lat, lon], 16);
      }
    },

    findH3: function () {
      if (!h3.isValidCell(this.searchH3Id)) {
        return;
      }
      const h3Boundary = h3.cellToBoundary(this.searchH3Id);

      let bounds = undefined;

      for ([lat, lng] of h3Boundary) {
        if (bounds === undefined) {
          bounds = new L.LatLngBounds([lat, lng], [lat, lng]);
        } else {
          bounds.extend([lat, lng]);
        }
      }

      map.fitBounds(bounds);

      const newZoom =
        H3_RES_TO_ZOOM_CORRESPONDENCE[h3.getResolution(this.searchH3Id)];
      map.setZoom(newZoom);
    },
  },

  beforeMount() {},

  mounted() {
    document.addEventListener("DOMContentLoaded", async () => {
      map = L.map("mapid");

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        minZoom: 14,
        maxNativeZoom: 14,
        maxZoom: 14,
        attribution:
          '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      }).addTo(map);

      pointsLayer = L.layerGroup([]).addTo(map);

      const initialLat = 24.88232906686656;
      const initialLng = 67.06722885777201;
      const initialZoom = 14;
      map.setView([initialLat, initialLng], initialZoom);
      map.on("zoomend", this.updateMapDisplay);
      map.on("moveend", this.updateMapDisplay);

      const { h3 } = queryParams;

      if (h3) {
        this.searchH3Id = h3;
        window.setTimeout(() => this.findH3(), 50);
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:5009/v2/promo/user-score-by-value"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch H3 values from the API");
        }
        const data = await response.json();

        // Extract H3 values from the API response
        const allowedH3s = data.map((entry) => entry.h3Value8);

        this.allowedH3sWithScores = data.sort(
          (a, b) => b.overallScore - a.overallScore
        );

        // Set the allowed H3 values in your component's data
        this.allowedH3s = allowedH3s;

        // Update the map display after fetching allowed H3 values
        this.updateMapDisplay();
      } catch (error) {
        console.error("Error fetching allowed H3 values:", error);
      }
    });
  },
});
