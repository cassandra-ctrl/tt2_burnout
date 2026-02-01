// SERVICIO DE CORREO ELECTRONICO
// services/mail.service.js

const nodemailer = require("nodemailer");

//Creamos el transportador de correo
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: process.env.MAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

//Verificamos la conexion
transporter.verify((error, success) => {
  if (error) {
    console.error("Error al conectarse al servidor de correo:", error);
  } else {
    console.log("Servidor de correo conectado correctamente");
  }
});

//Enviamos el correo de recuperacion de contrasena
async function enviarCodigoRecuperacion(email, nombre, codigo) {
  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: email,
    subject: "🔐 Código de recuperación - BurnOut App",
    html: `
<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .header h1 {
            color: #333;
            margin: 0;
          }
          .codigo {
            background-color: #4CAF50;
            color: white;
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            letter-spacing: 8px;
            margin: 20px 0;
          }
          .mensaje {
            color: #555;
            line-height: 1.6;
          }
          .aviso {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 5px;
            padding: 15px;
            margin-top: 20px;
            font-size: 14px;
            color: #856404;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #888;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌿 BurnOut App</h1>
          </div>
          
          <p class="mensaje">Hola <strong>${nombre}</strong>,</p>
          
          <p class="mensaje">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta. 
            Usa el siguiente código para continuar:
          </p>
          
          <div class="codigo">${codigo}</div>
          
          <p class="mensaje">
            Este código expira en <strong>15 minutos</strong>.
          </p>
          
          <div class="aviso">
            ⚠️ Si no solicitaste este cambio, puedes ignorar este correo. 
            Tu contraseña permanecerá sin cambios.
          </div>
          
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas.</p>
            <p>© ${new Date().getFullYear()} BurnOut App - ESCOM IPN</p>
          </div>
        </div>
      </body>
      </html>
        `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Correo enviado: ", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error al enviar el correo", error);
    throw error;
  }
}

async function enviarConfirmacionCambio(email, nombre) {
  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: email,
    subject: "Contraseña actualizada con éxito ' BurnOut App",
    htlm: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .success-icon {
            font-size: 48px;
            text-align: center;
          }
          .mensaje {
            color: #555;
            line-height: 1.6;
          }
          .aviso {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 5px;
            padding: 15px;
            margin-top: 20px;
            font-size: 14px;
            color: #721c24;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #888;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌿 BurnOut App</h1>
          </div>
          
          <div class="success-icon">✅</div>
          
          <p class="mensaje">Hola <strong>${nombre}</strong>,</p>
          
          <p class="mensaje">
            Tu contraseña ha sido actualizada exitosamente.
          </p>
          
          <p class="mensaje">
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
          
          <div class="aviso">
            🚨 Si no realizaste este cambio, contacta inmediatamente al administrador 
            del sistema ya que alguien podría haber accedido a tu cuenta.
          </div>
          
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas.</p>
            <p>© ${new Date().getFullYear()} BurnOut App - ESCOM IPN</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Correo de confirmación enviado:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch {
    console.error("Error enviando correo de confirmación:", error);
    throw error;
  }
}

module.exports = {
  enviarCodigoRecuperacion,
  enviarConfirmacionCambio,
};
