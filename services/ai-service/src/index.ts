import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-service' });
});

app.listen(PORT, () => {
  console.log([ai-service] Server running on port \);
});
