async function getCommuneInfo(nomCommune) {
    const res = await fetch(${geoBaseUrl}?nom=${encodeURIComponent(nomCommune)}&fields=nom,code,centre);
    const data = await res.json();
    return data[0];
}

async function getMeteoByCodeInsee(codeInsee) {
    const url = ${meteoBaseUrl}/forecast/daily?token=${apiKey}&insee=${codeInsee};
    const res = await fetch(https://corsproxy.io/?${encodeURIComponent(url)});
    const data = await res.json();
    return data.forecast[0];
}

async function rechercherMeteo() {
    const ville = document.getElementById('villeInput').value.trim();
    if (!ville) return alert("Veuillez entrer un nom de ville.");

    try {
        const commune = await getCommuneInfo(ville);
        if (!commune) return alert("Ville non trouvée.");

        const meteo = await getMeteoByCodeInsee(commune.code);

        document.getElementById('villeNom').textContent = commune.nom;
        document.getElementById('condition').textContent = meteo.weather;
        document.getElementById('tmin').textContent = meteo.tmin;
        document.getElementById('tmax').textContent = meteo.tmax;
        document.getElementById('pluie').textContent = meteo.probarain;

        document.getElementById('meteoResult').classList.remove('hidden');
    } catch (e) {
        console.error(e);
        alert("Erreur lors de la récupération des données météo.");
    }
}