import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import walletRoutes from './routes/wallet.routes';
import providerRoutes from './routes/provider.routes';
import gameRoutes from './routes/game.routes';
import avatarRoutes from './routes/avatar.routes';
import adminRoutes from './routes/admin.routes';
import webhookRoutes from './routes/webhook.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rota de Health Check (Teste)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sitebet API is running' });
});

// Rotas da aplicação
app.use('/auth', authRoutes);
app.use('/wallet', walletRoutes);
app.use('/provider', providerRoutes);
app.use('/games', gameRoutes);
app.use('/avatars', avatarRoutes);
app.use('/admin', adminRoutes);
app.use('/webhooks', webhookRoutes);

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
// restart trigger\n// restart prod\n// trigger qr fix\n// restart withdraw\n// restart tigrinho\n// restart sloty\n// restart hallow bonus\n// restart profile\n// restart avatars\n