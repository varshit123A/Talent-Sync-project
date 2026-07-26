import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'application-service' });
});

app.listen(PORT, () => {
  console.log(`[application-service] Running on port ${PORT}`);
});