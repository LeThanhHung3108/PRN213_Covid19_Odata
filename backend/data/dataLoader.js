const axios = require('axios');

let cachedData = null;
let lastFetch = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

async function fetchCovidData() {
  if (cachedData && lastFetch && Date.now() - lastFetch < CACHE_DURATION) {
    return cachedData;
  }

  try {
    const [countriesRes, historicalRes] = await Promise.all([
      axios.get('https://disease.sh/v3/covid-19/countries?yesterday=false&twoDaysAgo=false&sort=cases&allowNull=false'),
      axios.get('https://disease.sh/v3/covid-19/historical/all?lastdays=30')
    ]);

    const countries = countriesRes.data;
    const historical = historicalRes.data;

    // Build confirmed records
    const confirmed = countries.map((c, i) => ({
      id: i + 1,
      country: c.country,
      countryCode: c.countryInfo.iso2 || '',
      lat: c.countryInfo.lat,
      long: c.countryInfo.long,
      cases: c.cases,
      todayCases: c.todayCases,
      deaths: c.deaths,
      todayDeaths: c.todayDeaths,
      recovered: c.recovered,
      active: c.active,
      critical: c.critical,
      casesPerMillion: c.casesPerOneMillion,
      deathsPerMillion: c.deathsPerOneMillion,
      tests: c.tests,
      population: c.population,
      continent: c.continent,
      updated: new Date(c.updated).toISOString()
    }));

    // Build daily reports from historical
    const dailyReports = [];
    const dates = Object.keys(historical.cases);
    dates.forEach((date, i) => {
      const prevCases = i > 0 ? historical.cases[dates[i - 1]] : 0;
      const prevDeaths = i > 0 ? historical.deaths[dates[i - 1]] : 0;
      const prevRecovered = i > 0 ? historical.recovered[dates[i - 1]] : 0;
      dailyReports.push({
        id: i + 1,
        date,
        confirmed: historical.cases[date],
        deaths: historical.deaths[date],
        recovered: historical.recovered[date],
        dailyConfirmed: Math.max(0, historical.cases[date] - prevCases),
        dailyDeaths: Math.max(0, historical.deaths[date] - prevDeaths),
        dailyRecovered: Math.max(0, historical.recovered[date] - prevRecovered)
      });
    });

    cachedData = { confirmed, dailyReports };
    lastFetch = Date.now();
    return cachedData;
  } catch (err) {
    console.error('Failed to fetch data:', err.message);
    if (cachedData) return cachedData;
    return { confirmed: [], dailyReports: [] };
  }
}

module.exports = { fetchCovidData };
