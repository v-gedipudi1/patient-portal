const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = 'data.json';

app.use(cors());
app.use(express.json());

// Create the data.json file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]');
}

// Submit patient form
app.post('/submit', (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE));
  data.push(req.body);
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  res.send({ message: 'Form submitted successfully' });
});

// Admin: view all submissions
app.get('/submissions', (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE));
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
