const path = require('path');
const express = require('express');
const cors = require('cors');
const { createODataRouter } = require('./routes/odata');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/', express.static(path.join(__dirname, '../frontend/public')));

app.get('/', (_req, res) => {
  res.json({
    message: 'COVID-19 OData API is running',
    endpoints: [
      '/odata/confirmed',
      '/odata/deaths',
      '/odata/recovered',
      '/odata/daily_reports'
    ]
  });
});

app.use('/odata', createODataRouter());

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
