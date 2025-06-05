const apiKey = "5d1f8c4cbc841dfcb1e53129568d86a6d1041cc04d7e62938f96d1a05c52299b";
const meteoBaseUrl = "https://api.meteo-concept.com/api";
const geoBaseUrl = "https://geo.api.gouv.fr/communes";

const villeInput = document.getElementById("ville");
const selectVille = document.getElementById("selectVille");
const nbJoursSelect = document.getElementById("nbJours");
const btnRechercher = document.getElementById("btnRechercher");
const themeToggle = document.getElementById("themeToggle");
let villesTrouvees = [];

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}


villeInput.addEventListener("input", debounce(obtenirCommunes, 400));

selectVille.addEventListener("change", () => {
  btnRechercher.disabled = selectVille.value === "";
});

btnRechercher.addEventListener("click", () => {
  if (villesTrouvees.length && selectVille.value !== "") {
    afficherMeteo(villesTrouvees[selectVille.value], parseInt(nbJoursSelect.value));
  }
});

themeToggle.addEventListener("click", toggleTheme);

document.addEventListener('DOMContentLoaded', initTheme);

function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

async function obtenirCommunes() {
  const recherche = villeInput.value.trim();
  const resultatDiv = document.getElementById("resultat");
  resultatDiv.innerHTML = "";
  selectVille.innerHTML = "<option value=''>-- Sélectionnez une ville --</option>";
  villesTrouvees = [];
  btnRechercher.disabled = true;

  if (!recherche) return;

  const isCodePostal = /^\d{5}$/.test(recherche);
  const geoUrl = isCodePostal
    ? `${geoBaseUrl}?codePostal=${recherche}&fields=code,nom,centre&format=json`
    : `${geoBaseUrl}?nom=${encodeURIComponent(recherche)}&fields=code,nom,centre&format=json`;

  try {
    const response = await fetch(geoUrl);
    const villes = await response.json();

    if (!villes.length) {
      selectVille.innerHTML = "<option value=''>Aucune ville trouvée</option>";
      return;
    }

    villesTrouvees = villes;
    villes.forEach((v, i) => {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = `${v.nom} (${v.code})`;
      selectVille.appendChild(option);
    });

    btnRechercher.disabled = false;
  } catch (err) {
    console.error(err);
    selectVille.innerHTML = "<option value=''>Erreur de recherche</option>";
  }
}

async function afficherMeteo(villeChoisie, nbJours) {
  const resultatDiv = document.getElementById("resultat");
  const showLatLng = document.getElementById("optLatLng").checked;
  const showPluie = document.getElementById("optPluie").checked;
  const showVent = document.getElementById("optVent").checked;
  const showVentDir = document.getElementById("optVentDir").checked;

  const codeInsee = villeChoisie.code;
  const nomVille = villeChoisie.nom;
  const latitude = villeChoisie.centre.coordinates[1];
  const longitude = villeChoisie.centre.coordinates[0];

  try {
    const meteoResponse = await fetch(`${meteoBaseUrl}/forecast/daily?insee=${codeInsee}&token=${apiKey}`);
    const meteoData = await meteoResponse.json();
    const previsions = meteoData.forecast.slice(0, nbJours);

    resultatDiv.innerHTML = previsions.map(jour => `
      <div class="card">
        <h3>${nomVille} - ${jour.datetime}</h3>
        <p><strong>Temps :</strong> ${getWeatherDesc(jour.weather)}</p>
        <p><strong>Température :</strong> ${jour.tmin}°C ➜ ${jour.tmax}°C</p>
        ${showPluie ? `<p><strong>Pluie :</strong> ${jour.rr10} mm</p>` : ""}
        ${showVent ? `<p><strong>Vent :</strong> ${jour.wind10m} km/h</p>` : ""}
        ${showVentDir ? `<p><strong>Direction du vent :</strong> ${getWindDir(jour.wind10m_direction)}</p>` : ""}
        ${showLatLng ? `<p><strong>Latitude / Longitude :</strong> ${latitude.toFixed(4)} / ${longitude.toFixed(4)}</p>` : ""}
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
    resultatDiv.innerHTML = "<p>Erreur lors de la récupération des prévisions météo.</p>";
  }
}

function getWeatherDesc(code) {
  const descriptions = {
    0: "Soleil", 1: "Peu nuageux", 2: "Ciel voilé", 3: "Nuageux", 4: "Très nuageux", 5: "Couvert", 6: "Brouillard",
    7: "Brouillard givrant", 10: "Pluie faible", 11: "Pluie modérée", 12: "Pluie forte",
    13: "Pluie faible verglaçante", 14: "Pluie modérée verglaçante", 15: "Pluie forte verglaçante",
    20: "Neige faible", 21: "Neige modérée", 22: "Neige forte",
    30: "Pluie et neige mêlées faibles", 31: "Pluie et neige mêlées modérées", 32: "Pluie et neige mêlées fortes",
    40: "Averses de pluie faibles", 41: "Averses de pluie modérées", 42: "Averses de pluie fortes",
    43: "Averses de neige faibles", 44: "Averses de neige modérées", 45: "Averses de neige fortes",
    46: "Averses pluie/neige mêlées faibles", 47: "modérées", 48: "fortes",
    60: "Orages faibles", 61: "Orages modérés", 62: "Orages forts",
    63: "Orage + pluie faible", 64: "Orage + pluie modérée", 65: "Orage + pluie forte"
  };
  return descriptions[code] || "Inconnu";
}

function getWindDir(code) {
  if (typeof code !== "number") return "Inconnu";
  const directions = ["Nord", "Nord-Est", "Est", "Sud-Est", "Sud", "Sud-Ouest", "Ouest", "Nord-Ouest"];
  return directions[Math.floor((code % 360) / 45)] || "Inconnu";
}