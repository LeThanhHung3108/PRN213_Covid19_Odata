const express = require('express');
const { fetchCovidData } = require('../data/dataLoader');

function parseValue(raw) {
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  if (/^'.*'$/.test(trimmed)) return trimmed.slice(1, -1);
  if (/^(true|false)$/i.test(trimmed)) return trimmed.toLowerCase() === 'true';
  const num = Number(trimmed);
  if (!Number.isNaN(num)) return num;
  return trimmed;
}

function applyFilter(records, filterExpr) {
  if (!filterExpr) return records;

  const clauses = filterExpr.split(/\s+and\s+/i).map((x) => x.trim()).filter(Boolean);
  const ops = [' ge ', ' le ', ' gt ', ' lt ', ' ne ', ' eq '];

  return records.filter((item) => {
    return clauses.every((clause) => {
      let selectedOp = null;
      for (const op of ops) {
        if (clause.toLowerCase().includes(op.trim())) {
          selectedOp = op.trim();
          break;
        }
      }
      if (!selectedOp) return true;

      const splitRegex = new RegExp(`\\s+${selectedOp}\\s+`, 'i');
      const [left, right] = clause.split(splitRegex);
      if (!left || right === undefined) return true;

      const field = left.trim();
      const target = parseValue(right);
      const current = item[field];

      switch (selectedOp) {
        case 'eq': return current == target;
        case 'ne': return current != target;
        case 'gt': return current > target;
        case 'ge': return current >= target;
        case 'lt': return current < target;
        case 'le': return current <= target;
        default: return true;
      }
    });
  });
}

function applyOrderBy(records, orderByExpr) {
  if (!orderByExpr) return records;
  const [field, dir = 'asc'] = orderByExpr.trim().split(/\s+/);
  const multiplier = dir.toLowerCase() === 'desc' ? -1 : 1;
  return [...records].sort((a, b) => {
    if (a[field] === b[field]) return 0;
    return a[field] > b[field] ? multiplier : -multiplier;
  });
}

function applySelect(records, selectExpr) {
  if (!selectExpr) return records;
  const fields = selectExpr.split(',').map((x) => x.trim()).filter(Boolean);
  if (!fields.length) return records;
  return records.map((item) => {
    const obj = {};
    fields.forEach((field) => {
      obj[field] = item[field];
    });
    return obj;
  });
}

function applyPaging(records, query) {
  const skip = Math.max(0, Number(query.$skip || 0) || 0);
  const top = Number(query.$top);
  const sliced = records.slice(skip);
  if (Number.isNaN(top) || top <= 0) return sliced;
  return sliced.slice(0, top);
}

function applyOData(records, query) {
  let result = [...records];
  result = applyFilter(result, query.$filter);
  result = applyOrderBy(result, query.$orderby);
  const totalCount = result.length;
  result = applyPaging(result, query);
  result = applySelect(result, query.$select);
  return { result, totalCount };
}

function projectDatasets(data) {
  const confirmed = data.confirmed.map((x) => ({
    id: x.id,
    country: x.country,
    countryCode: x.countryCode,
    lat: x.lat,
    long: x.long,
    confirmed: x.cases,
    todayConfirmed: x.todayCases,
    updated: x.updated
  }));

  const deaths = data.confirmed.map((x) => ({
    id: x.id,
    country: x.country,
    countryCode: x.countryCode,
    deaths: x.deaths,
    todayDeaths: x.todayDeaths,
    population: x.population,
    updated: x.updated
  }));

  const recovered = data.confirmed.map((x) => ({
    id: x.id,
    country: x.country,
    countryCode: x.countryCode,
    recovered: x.recovered,
    active: x.active,
    critical: x.critical,
    updated: x.updated
  }));

  const dailyReports = data.dailyReports.map((x) => ({
    id: x.id,
    date: x.date,
    confirmed: x.confirmed,
    deaths: x.deaths,
    recovered: x.recovered,
    dailyConfirmed: x.dailyConfirmed,
    dailyDeaths: x.dailyDeaths,
    dailyRecovered: x.dailyRecovered
  }));

  return { confirmed, deaths, recovered, daily_reports: dailyReports };
}

function createODataRouter() {
  const router = express.Router();

  router.get('/:entity', async (req, res) => {
    const { entity } = req.params;
    const source = await fetchCovidData();
    const datasets = projectDatasets(source);
    const records = datasets[entity];

    if (!records) {
      return res.status(404).json({
        error: `Unknown entity '${entity}'. Use confirmed, deaths, recovered, daily_reports.`
      });
    }

    const { result, totalCount } = applyOData(records, req.query);
    res.json({
      '@odata.context': `$metadata#${entity}`,
      '@odata.count': totalCount,
      value: result
    });
  });

  return router;
}

module.exports = { createODataRouter };
