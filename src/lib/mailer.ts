import nodemailer from 'nodemailer';

const NOTIFICATION_RECIPIENT = process.env.ADMIN_NOTIFICATION_EMAIL || 'raoronironaldo1983@gmail.com';

// Cria o transporter se as credenciais SMTP estiverem definidas
const getTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  // Se for conta Gmail, o nodemailer possui preset otimizado nativo
  if (user.endsWith('@gmail.com') || process.env.SMTP_HOST === 'smtp.gmail.com') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass: pass.replace(/\s+/g, ''), // Remove espaços caso a senha de app venha com espaços
      },
    });
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

const formatDateBr = (date: Date = new Date()) => {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
};

export interface DepositNotificationData {
  userName?: string | null;
  userEmail: string;
  userId: string;
  amount: number;
  txId?: string | null;
  date?: Date;
}

export interface WithdrawNotificationData {
  userName?: string | null;
  userEmail: string;
  userId: string;
  amount: number;
  pixKey: string;
  txId?: string | null;
  status?: string;
  date?: Date;
}

/**
 * Notifica o administrador sobre um depósito aprovado/concluído
 */
export const notifyDeposit = async (data: DepositNotificationData): Promise<void> => {
  const dateFormatted = formatDateBr(data.date || new Date());
  const valorFormatted = data.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const subject = `💰 [SiteBet] Novo Depósito Confirmado - ${valorFormatted}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
        .card { background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; max-width: 600px; margin: 0 auto; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .header { border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 24px; text-align: center; }
        .logo { font-size: 26px; font-weight: 900; color: #eab308; letter-spacing: -1px; }
        .badge { display: inline-block; background-color: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid #22c55e; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 800; margin-top: 10px; }
        .item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #334155; }
        .label { color: #94a3b8; font-size: 14px; }
        .value { color: #f8fafc; font-weight: 700; font-size: 14px; text-align: right; }
        .amount { color: #4ade80; font-size: 24px; font-weight: 900; margin-top: 8px; text-align: center; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">SITEBET</div>
          <div class="badge">✅ DEPÓSITO CONFIRMADO</div>
          <div class="amount">${valorFormatted}</div>
        </div>

        <div class="item">
          <span class="label">📅 Data e Horário:</span>
          <span class="value">${dateFormatted}</span>
        </div>

        <div class="item">
          <span class="label">👤 Usuário:</span>
          <span class="value">${data.userName || 'Jogador'} (${data.userEmail})</span>
        </div>

        <div class="item">
          <span class="label">🆔 ID do Usuário:</span>
          <span class="value" style="font-family: monospace; font-size: 12px;">${data.userId}</span>
        </div>

        ${data.txId ? `
        <div class="item">
          <span class="label">🧾 Código da Transação (txid):</span>
          <span class="value" style="font-family: monospace; font-size: 12px;">${data.txId}</span>
        </div>
        ` : ''}

        <div class="footer">
          Notificação automática gerada pelo sistema SiteBet.
        </div>
      </div>
    </body>
    </html>
  `;

  await sendMail(subject, html);
};

/**
 * Notifica o administrador sobre uma solicitação de saque
 */
export const notifyWithdraw = async (data: WithdrawNotificationData): Promise<void> => {
  const dateFormatted = formatDateBr(data.date || new Date());
  const valorFormatted = data.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const subject = `💸 [SiteBet] Solicitação de Saque - ${valorFormatted}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
        .card { background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; max-width: 600px; margin: 0 auto; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .header { border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 24px; text-align: center; }
        .logo { font-size: 26px; font-weight: 900; color: #eab308; letter-spacing: -1px; }
        .badge { display: inline-block; background-color: rgba(234, 179, 8, 0.2); color: #facc15; border: 1px solid #eab308; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 800; margin-top: 10px; }
        .item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #334155; }
        .label { color: #94a3b8; font-size: 14px; }
        .value { color: #f8fafc; font-weight: 700; font-size: 14px; text-align: right; }
        .amount { color: #facc15; font-size: 24px; font-weight: 900; margin-top: 8px; text-align: center; }
        .pix-box { background-color: #0f172a; border: 1px dashed #eab308; border-radius: 10px; padding: 12px; margin: 16px 0; text-align: center; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">SITEBET</div>
          <div class="badge">💸 SOLICITAÇÃO DE SAQUE</div>
          <div class="amount">${valorFormatted}</div>
        </div>

        <div class="pix-box">
          <div style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">CHAVE PIX DESTINO</div>
          <div style="font-size: 16px; font-weight: 800; color: #facc15; font-family: monospace;">${data.pixKey}</div>
        </div>

        <div class="item">
          <span class="label">📅 Data e Horário:</span>
          <span class="value">${dateFormatted}</span>
        </div>

        <div class="item">
          <span class="label">👤 Usuário:</span>
          <span class="value">${data.userName || 'Jogador'} (${data.userEmail})</span>
        </div>

        <div class="item">
          <span class="label">🆔 ID do Usuário:</span>
          <span class="value" style="font-family: monospace; font-size: 12px;">${data.userId}</span>
        </div>

        ${data.status ? `
        <div class="item">
          <span class="label">⚡ Status:</span>
          <span class="value" style="color: #38bdf8;">${data.status}</span>
        </div>
        ` : ''}

        ${data.txId ? `
        <div class="item">
          <span class="label">🧾 Código da Transação:</span>
          <span class="value" style="font-family: monospace; font-size: 12px;">${data.txId}</span>
        </div>
        ` : ''}

        <div class="footer">
          Notificação automática gerada pelo sistema SiteBet.
        </div>
      </div>
    </body>
    </html>
  `;

  await sendMail(subject, html);
};

const sendMail = async (subject: string, html: string) => {
  try {
    const transporter = getTransporter();

    if (!transporter) {
      console.log(`[Mailer Notificação] Destinatário: ${NOTIFICATION_RECIPIENT}`);
      console.log(`[Mailer Notificação] Assunto: ${subject}`);
      console.log(`[Mailer Notificação] ℹ️ Para envio de e-mail real via SMTP, configure SMTP_USER e SMTP_PASS (ex: Gmail App Password) nas variáveis de ambiente.`);
      return;
    }

    const fromAddress = process.env.SMTP_FROM || `"SiteBet Notificações" <${process.env.SMTP_USER}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: NOTIFICATION_RECIPIENT,
      subject,
      html,
    });

    console.log(`[Mailer] E-mail enviado com sucesso para ${NOTIFICATION_RECIPIENT}: ${info.messageId}`);
  } catch (error) {
    console.error(`[Mailer Erro] Falha ao enviar e-mail para ${NOTIFICATION_RECIPIENT}:`, error);
  }
};
