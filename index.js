const express = require("express");
const path = require("path");
const mysql = require("mysql2/promise");
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));


app.use(session({
  secret: "clau",   
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));



// Configuración de conexión a MySQL
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "secret",
  database: "projecte_final_fp",
  port: 3306
});

// GET /index → devuelve index.html
app.get("/index", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// GET /home → devuelve home.html solo si sesion iniciada
app.get("/home", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/index");
  }
  res.sendFile(path.join(__dirname, "home.html"));
});

app.get("/", (req, res) => {
  if(!req.session.user) {
    return res.redirect("/index");
  }
  return res.redirect("/home");
})



// POST /login → valida credenciales
app.post("/login", async (req, res) => {
  const { username, pass } = req.body;

  if (!username || !pass) {
    return res.status(400).send("Faltan credenciales");
  }

  try {
    const [rows] = await pool.execute(
      "SELECT * FROM usuaris WHERE nom_usuari = ? AND mot_clau = ?",
      [username, pass]
    );

    if (rows.length === 0) {
      res.status(401).send("Error en las credenciales");
    } else {
      // Guardar usuario en la sesión
      req.session.user = { username };
      req.session.save(err => {
    if (err) {
      console.error("Error guardando sesión:", err);
      return res.status(500).send("Error interno");
    }
    res.redirect("/home");
});

    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error interno del servidor");
  }
});

app.get("/username", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "No autenticado" });
  }

  res.json({ username: req.session.user.username });
});


app.listen(3000, () => {
  console.log("Servidor Express escuchando en http://localhost:3000");
});

app.get("/empreses", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/index");
  }
  res.sendFile(path.join(__dirname, "empreses.html"));
});

app.get('/lectura_empreses', async (req, res) => {
  if (!req.session.user){
    return res.redirect("index");
  }
  try {
    const [rows] = await pool.query('SELECT * FROM empreses');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error obtenint les empresas'
    });
  }
});
app.get('/lectura_incidencies', async(req, res) => {
  if (!req.session.user){
    return res.redirect("index");
  }
  try{
    const [rows] = await pool.query('SELECT * FROM incidents');
    res.json(rows);
  } catch(error){
    console.error(error);
    return res.redirect("index");
  }
});

app.get('/lectura_incidencies/:id', async (req, res) => {
  if (!req.session.user){
    return res.redirect("index");
  }

  const idEmpresa = parseInt(req.params.id);

  if (isNaN(idEmpresa)) {
    return res.status(400).json({ error: "ID invalid" });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM incidents WHERE id_empresa = ?',
      [idEmpresa]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    return res.redirect("index");
  }
});