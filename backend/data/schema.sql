-- Database design for COVID19 OData assignment
-- Logical entities: confirmed, deaths, recovered, daily_reports

CREATE TABLE confirmed (
  id INTEGER PRIMARY KEY,
  country TEXT NOT NULL,
  countryCode TEXT,
  lat REAL,
  long REAL,
  confirmed INTEGER NOT NULL,
  todayConfirmed INTEGER NOT NULL,
  updated TEXT NOT NULL
);

CREATE TABLE deaths (
  id INTEGER PRIMARY KEY,
  country TEXT NOT NULL,
  countryCode TEXT,
  deaths INTEGER NOT NULL,
  todayDeaths INTEGER NOT NULL,
  population INTEGER,
  updated TEXT NOT NULL
);

CREATE TABLE recovered (
  id INTEGER PRIMARY KEY,
  country TEXT NOT NULL,
  countryCode TEXT,
  recovered INTEGER NOT NULL,
  active INTEGER NOT NULL,
  critical INTEGER NOT NULL,
  updated TEXT NOT NULL
);

CREATE TABLE daily_reports (
  id INTEGER PRIMARY KEY,
  reportDate TEXT NOT NULL,
  confirmed INTEGER NOT NULL,
  deaths INTEGER NOT NULL,
  recovered INTEGER NOT NULL,
  dailyConfirmed INTEGER NOT NULL,
  dailyDeaths INTEGER NOT NULL,
  dailyRecovered INTEGER NOT NULL
);
