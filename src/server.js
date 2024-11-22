const express = require('express');
const mysql = require('mysql2');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const cors = require('cors'); 
require('dotenv').config();


const app = express();
const port = 3000;

// Middleware
app.use(cors()); // Habilita CORS para aceptar solicitudes desde el frontend
app.use(express.json()); // Para analizar solicitudes con JSON

// Configuración de la base de datos
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root', // Cambia si tu contraseña es diferente
  database: 'OutMate'
});

// Conexión a la base de datos MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;  }
  console.log('Connected to MySQL database');
});

// Comprobación y adición de la columna 'token' para recuperación de contraseña *******************
const verificarColumnaToken = () => {
  db.query(`SHOW COLUMNS FROM USUARIO LIKE 'token'`, (err, result) => {
    if (err) console.error(err);
    if (result.length === 0) {
      db.query(`ALTER TABLE USUARIO ADD COLUMN token VARCHAR(255)`, (alterErr) => {
        if (alterErr) console.error('Error al añadir la columna token:', alterErr);
        else console.log('Columna token añadida a la tabla USUARIO');
      });
    }
  });
};
verificarColumnaToken();

// Rutas y funciones para la recuperación de contraseña
app.post('/recover-password', (req, res) => {
  const { RUT, correo } = req.body;

  if (!RUT || !correo) return res.status(400).json({ error: 'RUT y correo son requeridos' });

  const query = 'SELECT * FROM USUARIO WHERE Run_User = ? AND Correo_User = ?';
  db.query(query, [RUT, correo], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error en el servidor' });
    if (results.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const token = crypto.randomBytes(20).toString('hex');
    const updateTokenQuery = 'UPDATE USUARIO SET token = ? WHERE Run_User = ?';
    db.query(updateTokenQuery, [token, RUT], (updateErr) => {
      if (updateErr) return res.status(500).json({ error: 'Error en el servidor' });

      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });

      const resetUrl = `http://localhost:8100/reset-password/${token}`;
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: correo,
        subject: 'Recuperación de contraseña',
        text: `Haz clic en el siguiente enlace para restablecer tu contraseña: ${resetUrl}`,
        html: `<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p><a href="${resetUrl}">${resetUrl}</a>`
      };

      transporter.sendMail(mailOptions, (error) => {
        if (error) return res.status(500).json({ error: 'Error enviando el correo' });
        res.status(200).json({ message: 'Código de recuperación enviado' });
      });
    });
  });
});

app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
  }

  const query = 'SELECT * FROM USUARIO WHERE token = ?';
  db.query(query, [token], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Error en el servidor' });
    if (results.length === 0) return res.status(404).json({ error: 'Token inválido o expirado' });

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10); // Hashear la nueva contraseña

      const updatePasswordQuery = 'UPDATE USUARIO SET Contra_User = ?, token = NULL WHERE token = ?';
      db.query(updatePasswordQuery, [hashedPassword, token], (updateErr) => {
        if (updateErr) return res.status(500).json({ error: 'Error al actualizar la contraseña' });
        res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
      });
    } catch (hashErr) {
      console.error('Error hashing new password:', hashErr);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
});

// Aquí terminan las funcionalidades para la recuperación de la contraseña *******************

// 1. Aquí se obtendrá las Regiones y Comunas disponibles para poder registrar al usuario.
// Obtener todas las regiones.
app.get('/regiones', (req, res) => {
  const query = 'SELECT * FROM REGION';
  db.query(query, (err, results) => { 
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(results);
    }
  });
});

// Obtener las comunas por id de la región.
app.get('/comunas/:regionId', (req, res) => {
  const regionId = req.params.regionId; // Obtiene el id de la región desde la URL
  const query = 'SELECT * FROM COMUNA WHERE Id_Region = ?';
  db.query(query, [regionId], (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(results);
    }
  });
});

// 2. Aquí se realizará el INSERT del usuario. 
// Ruta para registrar un usuario
app.post('/register', async (req, res) => {
  const { Run_User, Nom_User, Correo_User, Contra_User, Celular_User, FechaNac_User, Id_Comuna } = req.body;

  if (!Run_User || !Nom_User || !Correo_User || !Contra_User || !Celular_User || !FechaNac_User || !Id_Comuna) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  try {
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(Contra_User, 10); // Salt rounds = 10

    const query = `INSERT INTO USUARIO (Run_User, Nom_User, Correo_User, Contra_User, Celular_User, FechaNac_User, FechaCreacion_User, Id_Comuna, Id_Estado) 
                   VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, 15)`;

    db.query(query, [Run_User, Nom_User, Correo_User, hashedPassword, Celular_User, FechaNac_User, Id_Comuna], (err, result) => {
      if (err) {
        console.error('Error inserting user:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ error: 'El usuario ya existe' });
        }
        return res.status(500).json({ error: 'Error al registrar el usuario' });
      }
      res.status(201).json({ message: 'Usuario registrado exitosamente' });
    });
  } catch (err) {
    console.error('Error hashing password:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 2. Aquí se realizará el INSERT de la actividad. 
app.post('/actividad', (req, res) => {
  const {
    Nom_Actividad,
    Desc_Actividad,
    Direccion_Actividad,
    Id_MaxJugador,
    Fecha_INI_Actividad,
    Fecha_TER_Actividad,
    Id_Comuna,
    Id_SubCategoria,
    Id_Estado,
    Id_Anfitrion_Actividad,
  } = req.body;

  // Verificación de datos
  if (!Nom_Actividad || !Desc_Actividad || !Direccion_Actividad || !Id_MaxJugador || !Fecha_INI_Actividad || !Fecha_TER_Actividad || !Id_Comuna || !Id_SubCategoria || !Id_Estado || !Id_Anfitrion_Actividad) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  // SQL query para insertar la actividad
  const query = `
    INSERT INTO ACTIVIDAD 
    (Nom_Actividad, Desc_Actividad, Direccion_Actividad, Id_MaxJugador, Fecha_INI_Actividad, Fecha_TER_Actividad, Id_Comuna, Id_SubCategoria, Id_Estado, Id_Anfitrion_Actividad) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(query, [
    Nom_Actividad,
    Desc_Actividad,
    Direccion_Actividad,
    Id_MaxJugador,
    Fecha_INI_Actividad,
    Fecha_TER_Actividad,
    Id_Comuna,
    Id_SubCategoria,
    Id_Estado,
    Id_Anfitrion_Actividad,
  ], (err, result) => {
    if (err) {
      console.error('Error inserting actividad:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'La Actividad ya existe' });
      }
      return res.status(500).json({ error: 'Error al registrar la actividad' });
    }
    res.status(201).json({ message: 'Actividad registrada exitosamente', id: result.insertId });
  });
});

// Ruta para el login del usuario (Obtener los datos de la consulta)
app.post('/login', (req, res) => {
  const { Correo_User, Contra_User } = req.body;

  if (!Correo_User || !Contra_User) {
    return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
  }

  const query = `SELECT Id_User, Nom_User, Correo_User, Contra_User, Celular_User, 
                 COMUNA.Id_Comuna, COMUNA.Nombre_Comuna, 
                 REGION.Id_Region, REGION.Nombre_Region 
                 FROM USUARIO 
                 INNER JOIN COMUNA ON USUARIO.Id_Comuna = COMUNA.Id_Comuna 
                 INNER JOIN REGION ON COMUNA.Id_Region = REGION.Id_Region 
                 WHERE Correo_User = ?`;

  db.query(query, [Correo_User], async (err, results) => {
    if (err) {
      console.error('Error during login:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = results[0];
    try {
      // Comparar la contraseña ingresada con la almacenada
      const isPasswordValid = await bcrypt.compare(Contra_User, user.Contra_User);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Excluir contraseña antes de enviar la respuesta
      delete user.Contra_User;
      res.status(200).json({ message: 'Login exitoso', user });
    } catch (err) {
      console.error('Error comparing password:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
});

// 3. Aquí se obtendrá las Categoria y subcategoria *************************************
// Obtener todas las regiones.
app.get('/categoria', (req, res) => {
  const query = 'SELECT * FROM CATEGORIA';
  db.query(query, (err, results) => { 
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(results);
    }
  });
});

// Obtener las comunas por id de la Categoria. 
app.get('/subcategoria/:categoriaId', (req, res) => {
  const categoriaId = req.params.categoriaId; // Obtiene el id de la Categoria desde la URL
  const query = 'SELECT * FROM SUBCATEGORIA WHERE Id_Categoria = ?';
  db.query(query, [categoriaId], (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(results);
    }
  });
});

// 4. Aquí se obtendrá los jugadores máximos
// Obtener todas las regiones.
app.get('/cantidad', (req, res) => {
  const query = 'SELECT * FROM MAXJUGADOR';
  db.query(query, (err, results) => { 
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(results);
    }
  });
});

// 5. Este es para obtener las actividades
// Endpoint para obtener todas las actividades
app.get('/actividades', (req, res) => {
  const { Id_Comuna } = req.query;
  const query = 'SELECT a.Id_Actividad, u.Nom_User, a.Nom_Actividad, a.Fecha_INI_Actividad, a.Fecha_TER_Actividad, a.Desc_Actividad, a.Direccion_Actividad, m.Cantidad_MaxJugador, s.Nom_SubCategoria, C.Nom_Categoria, i.Url FROM ACTIVIDAD a Inner Join usuario u on a.Id_Anfitrion_Actividad = u.Id_User INNER JOIN maxjugador m ON a.Id_Maxjugador = m.Id_Maxjugador INNER JOIN subcategoria s ON s.Id_SubCategoria = a.Id_SubCategoria INNER JOIN CATEGORIA C ON s.Id_Categoria = C.Id_Categoria LEFT JOIN imagen i ON s.Id_SubCategoria = i.Id_SubCategoria WHERE a.Id_Comuna = ? AND Fecha_TER_Actividad>=now();';
  db.query(query, [Id_Comuna], (err, results) => {
    if (err) {
      console.error('Error al obtener actividades:', err);
      return res.status(500).json({ error: 'Error al obtener actividades' });
    }
    res.json(results);
  });
});

app.get('/jugdoresInscritos', (req, res) => {
  const { Id_Actividad } = req.query;
  const query = 'SELECT COUNT(Id_Actividad) FROM `OutMate`.`PARTICIPANTE` WHERE Id_Actividad = ?;';
  db.query(query, [Id_Actividad], (err, results) => {
    if (err) {
      console.error('Error:', err);
      return res.status(500).json({ error: 'Error al obtener los jugadores inscritos' });
    }
    res.json(results);
  });
});

// Función para insertar participante en la Actividad
app.post('/participante', (req, res) => {
  const { Id_Actividad, Id_Asistencia, Id_User } = req.body;

  if (!Id_Actividad || !Id_User) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  const query = `
    INSERT INTO PARTICIPANTE (Id_Actividad, Id_Asistencia, Id_User) 
    VALUES (?, ?, ?)
  `;

  db.query(query, [Id_Actividad, Id_Asistencia || 800, Id_User], (err, result) => {
    if (err) {
      console.error('Error al insertar participante:', err);
      return res.status(500).json({ error: 'Error al insertar participante' });
    }
    res.status(201).json({ message: 'Participante registrado exitosamente' });
  });
});

//Eliminar Usuario
app.delete('/borrarUser/:Id_User', (req, res) => {
  const Id_User = req.params.Id_User;
  const deleteQuery = 'DELETE FROM USUARIO WHERE Id_User = ?';

  db.query(deleteQuery, [Id_User], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al eliminar el usuario >:(');
    } else if (result.affectedRows === 0) {
      return res.status(404).send('Usuario no encontrado :(');
    } else {
      res.status(200).json({ message: 'Usuario eliminado con éxito :D' });
    }
  });
});

// Cambiar la comuna
app.put('/cambiaComuna', (req, res) => {
  const { Id_Comuna, Id_User } = req.body;

  if (!Id_Comuna || !Id_User) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  const query = `
    UPDATE USUARIO 
    SET Id_Comuna= ? 
    WHERE Id_User = ?;
  `;

  db.query(query, [Id_Comuna, Id_User], (err, result) => {
    if (err) {
      console.error('Error al actualizar la comuna:', err);
      return res.status(500).json({ error: 'Error al actualizar la comuna' });
    }
    res.status(201).json({ message: 'Comuna actualizada exitosamente' });
  });
});

//Ver el historial de actividades
app.get('/historial', (req, res) => {
  const { Id_User } = req.query;
  const query = `SELECT DISTINCT a.Nom_Actividad, u.Nom_User AS Nombre_Anfitrion, a.Fecha_INI_Actividad, a.Fecha_TER_Actividad, s.Nom_SubCategoria, i.url
                  FROM Participante p
                  JOIN ACTIVIDAD a ON p.Id_Actividad = a.Id_Actividad
                  JOIN USUARIO u ON a.Id_Anfitrion_Actividad = u.Id_User
                  LEFT JOIN subcategoria s ON s.Id_SubCategoria = a.Id_SubCategoria
                  LEFT JOIN imagen i ON a.Id_SubCategoria = i.Id_SubCategoria
                  WHERE p.Id_User = ?;`
  db.query(query, [Id_User], (err, results) => {
    if (err) {
      console.error('Error al obtener el historial:', err);
      return res.status(500).json({ error: 'Error al obtener el historial' });
    }
    res.json(results);
  });
});

//Funcion hashear contraseñas ya existentes en SQL
const actualizarContrasenas = async () => {
  try {
    const querySelect = 'SELECT Id_User, Contra_User FROM USUARIO';
    db.query(querySelect, async (err, users) => {
      if (err) {
        console.error('Error al obtener usuarios:', err);
        return;
      }

      for (const user of users) {
        const { Id_User, Contra_User } = user;

        // Saltar si la contraseña ya parece estar hasheada
        if (Contra_User.startsWith('$2b$')) {
          console.log(`Contraseña para usuario con ID ${Id_User} ya está hasheada. Saltando...`);
          continue;
        }

        try {
          // Hashear la contraseña
          const hashedPassword = await bcrypt.hash(Contra_User, 10);

          // Actualizar la base de datos con la contraseña hasheada
          const queryUpdate = 'UPDATE USUARIO SET Contra_User = ? WHERE Id_User = ?';
          db.query(queryUpdate, [hashedPassword, Id_User], (updateErr) => {
            if (updateErr) {
              console.error(`Error al actualizar la contraseña para ID ${Id_User}:`, updateErr);
            } else {
              console.log(`Contraseña para usuario con ID ${Id_User} actualizada correctamente.`);
            }
          });
        } catch (hashErr) {
          console.error(`Error al hashear la contraseña para ID ${Id_User}:`, hashErr);
        }
      }
    });
  } catch (err) {
    console.error('Error en la migración de contraseñas:', err);
  }
};

// Llama a esta función manualmente cuando lo necesites
actualizarContrasenas();


// Iniciar el servidor
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
