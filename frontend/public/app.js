const metricSelect = document.getElementById('metricSelect');

const ENTITY_CONFIG = {
  confirmed: { entity: 'confirmed', field: 'confirmed' },
  deaths: { entity: 'deaths', field: 'deaths' },
  recovered: { entity: 'recovered', field: 'recovered' },
  dailyIncrease: { entity: 'daily_reports', field: 'dailyConfirmed' }
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

async function fetchEntity(entity) {
  const res = await fetch(`/odata/${entity}?$top=500`);
  if (!res.ok) {
    throw new Error(`Failed to load ${entity}`);
  }
  const json = await res.json();
  return json.value || [];
}

function renderMap(rows, field, metricLabel) {
  const filtered = rows.filter((x) => x.countryCode && Number(x[field]) > 0);
  const data = [{
    type: 'choropleth',
    locations: filtered.map((x) => x.countryCode),
    z: filtered.map((x) => x[field]),
    text: filtered.map((x) => `${x.country}: ${formatNumber(x[field])}`),
    colorscale: 'Blues',
    marker: { line: { color: '#fff', width: 0.5 } }
  }];
  const layout = {
    title: `# of ${metricLabel} Worldwide`,
    geo: { projection: { type: 'equirectangular' } },
    margin: { l: 0, r: 0, t: 40, b: 0 }
  };
  Plotly.newPlot('mapChart', data, layout, { responsive: true });
}

function renderTreeMap(rows, field, metricLabel) {
  const sorted = [...rows]
    .filter((x) => x.country && Number(x[field]) > 0)
    .sort((a, b) => Number(b[field]) - Number(a[field]))
    .slice(0, 100);
  const data = [{
    type: 'treemap',
    labels: sorted.map((x) => x.country),
    parents: sorted.map(() => 'Countries'),
    values: sorted.map((x) => x[field]),
    textinfo: 'label+value',
    hovertemplate: '<b>%{label}</b><br>%{value:,}<extra></extra>'
  }];
  const layout = {
    title: `Treemap by ${metricLabel}`,
    margin: { t: 40, l: 10, r: 10, b: 10 }
  };
  Plotly.newPlot('treeMapChart', data, layout, { responsive: true });
}

function renderTable(rows, field) {
  const head = document.querySelector('#topTable thead');
  const body = document.querySelector('#topTable tbody');
  const sorted = [...rows]
    .filter((x) => x.country)
    .sort((a, b) => Number(b[field] || 0) - Number(a[field] || 0))
    .slice(0, 20);

  head.innerHTML = '<tr><th>Country</th><th>Value</th></tr>';
  body.innerHTML = sorted
    .map((x) => `<tr><td>${x.country}</td><td>${formatNumber(x[field])}</td></tr>`)
    .join('');
}

async function loadDashboard() {
  try {
    const selected = metricSelect.value;
    const { entity, field } = ENTITY_CONFIG[selected];
    const rows = await fetchEntity(entity);
    const label = metricSelect.options[metricSelect.selectedIndex].text;

    renderMap(rows, field, label);
    renderTreeMap(rows, field, label);
    renderTable(rows, field);
  } catch (error) {
    console.error(error);
    alert('Cannot load data from OData API. Start backend first.');
  }
}

metricSelect.addEventListener('change', loadDashboard);
loadDashboard();
