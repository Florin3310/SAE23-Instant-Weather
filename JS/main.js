const apiKey = "5d1f8c4cbc841dfcb1e53129568d86a6d1041cc04d7e62938f96d1a05c52299b";
const meteoBaseUrl = "https://api.meteo-concept.com/api";
const geoBaseUrl = "https://geo.api.gouv.fr/communes";

const cpInput = document.getElementById("cpInput");
const villeSelect = document.getElementById("villeSelect");
const previsionsContainer = document.getElementById("previsionsContainer");
const meteoResult = document.getElementById("meteoResult");

const joursSemaine = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];


cpInput.addEventListener("input", async (e) => {
  const input = e.target.value.trim();
  if (input.length < 3) {
    villeSelect.classList.add("hidden");
    villeSelect.innerHTML = "";
    meteoResult.classList.add("hidden");
    return;
  }

  const isPostal = /^\d{5}$/.test(input);
  const url = `${geoBaseUrl}?${isPostal ? "codePostal" : "nom"}=${encodeURIComponent(input)}&fields=nom,code,centre`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.length) {
      villeSelect.innerHTML = data.map(c => `<option value='${JSON.stringify(c)}'>${c.nom}</option>`).join("");
      villeSelect.classList.remove("hidden");
      meteoResult.classList.remove("hidden"); 
    } else {
      villeSelect.classList.add("hidden");
      villeSelect.innerHTML = "";
      meteoResult.classList.add("hidden");
    }
  } catch {
    alert("Erreur lors de la récupération des villes.");
  }
});

// API 
async function getMeteoByCodeInsee(codeInsee) {
  const url = `${meteoBaseUrl}/forecast/daily?token=${apiKey}&insee=${codeInsee}`;
  const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
  const data = await res.json();
  return data.forecast;
}


function toggleOption(id, rowId, spanId, value) {
  const checkbox = document.getElementById(id);
  const row = document.getElementById(rowId);
  const span = document.getElementById(spanId);
  if (!checkbox || !row || !span) return;
  row.classList.toggle("hidden", !checkbox.checked);
  if (checkbox.checked) span.textContent = value;
}


async function rechercherMeteo() {
  if (villeSelect.classList.contains("hidden") || !villeSelect.value) {
    alert("Veuillez sélectionner une ville.");
    return;
  }

  const commune = JSON.parse(villeSelect.value);
  const [lon, lat] = commune.centre.coordinates;

  try {
    const meteoList = await getMeteoByCodeInsee(commune.code);
    const meteo = meteoList[0];

    document.getElementById("villeNom").textContent = commune.nom;
    document.getElementById("condition").textContent = meteo.weather;
    document.getElementById("tmin").textContent = meteo.tmin;
    document.getElementById("tmax").textContent = meteo.tmax;
    document.getElementById("pluie").textContent = meteo.probarain;

    toggleOption("optionLat", "latRow", "lat", lat);
    toggleOption("optionLon", "lonRow", "lon", lon);
    toggleOption("optionRain", "rainRow", "rain", meteo.rr1);
    toggleOption("optionWind", "windRow", "wind", meteo.wind10m);
    toggleOption("optionWindDir", "windDirRow", "windDir", meteo.dirwind10m);

    previsionsContainer.innerHTML = "";

    for (let i = 1; i < meteoList.length; i++) {
      const m = meteoList[i];
      const d = new Date(m.datetime);
      const dateStr = `${joursSemaine[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]}`;

      const html = `
        <div class="meteo-card">
          <h4>${dateStr}</h4>
          <p><strong>Conditions :</strong> ${m.weather}</p>
          <p><strong>Températures :</strong> ${m.tmin}°C - ${m.tmax}°C</p>
          <p><strong>Probabilité pluie :</strong> ${m.probarain}%</p>
          <p><strong>Cumul pluie :</strong> ${m.rr1 ?? "N/A"} mm</p>
          <p><strong>Vent moyen :</strong> ${m.wind10m ?? "N/A"} km/h</p>
          <p><strong>Direction vent :</strong> ${m.dirwind10m ?? "N/A"}°</p>
          <p><strong>Latitude :</strong> ${lat}</p>
          <p><strong>Longitude :</strong> ${lon}</p>
        </div>
      `;
      previsionsContainer.insertAdjacentHTML("beforeend", html);
    }
  } catch {
    alert("Erreur lors de la récupération de la météo.");
  }
}
