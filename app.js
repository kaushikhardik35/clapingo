const express = require("express");
const mongoose = require("mongoose");
const Student = require("./models/Student.js");
const Teacher = require("./models/teacher");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { auth } = require("./middleware/jwtAuth");
mongoose.connect("mongodb://localhost:27017/clapingo", {
  useNewUrlParser: true,
  // useCreateIndex:true,
  useUnifiedTopology: true,
});
const session = require("express-session");
const flash = require("connect-flash");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const { type } = require("os");
const sharp = require("sharp");
const imgDown = require("image-downloader");

const app = express();
app.use(cookieParser());
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
const sessionOptions = {
  secret: "thisisAsecret",
  resave: false,
  saveUninitialized: false,
};
app.use(session(sessionOptions));
app.use(flash());
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

//*********************************************************************************************** */

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login/teacher", (req, res) => {
  res.render("login_teacher.ejs");
});

app.get("/login/student", (req, res) => {
  res.render("login_student.ejs", { messages: req.flash("error") });
});

app.get("/register/teacher", (req, res) => {
  res.render("register_teacher.ejs");
});

app.get("/register/student", (req, res) => {
  res.render("register_student.ejs");
});

app.get("/student/:id/addFav", auth, async (req, res) => {
  const id = req.params.id;
  const student = await Student.findById(id);
  const teachers = await Teacher.find({});
  //console.log(teachers);
  // const tcr = await Teacher.findOne({password:'rihsi'});
  // student.favTeacher.push(tcr);
  // await student.save();
  res.render("addFav", { id, student, teachers, messages: req.flash("error") });
});
app.get("/student/:id/deleteFav", auth, async (req, res) => {
  const id = req.params.id;
  const student = await Student.findById(id);
  const teachers = await Teacher.find({});
  //console.log(teachers);
  // const tcr = await Teacher.findOne({password:'rihsi'});
  // student.favTeacher.push(tcr);
  // await student.save();
  res.render("deleteFav", {
    id,
    student,
    teachers,
    messages: req.flash("error"),
  });
});

app.get("/student/:id/home", auth, async (req, res) => {
  const id = req.params.id;
  res.render("studentHome", { id, messages: req.flash("success") });
});
app.get("/student/:id", auth, async (req, res) => {
  const cookies = await req.cookies;
  // console.log(token);
  const response = await jwt.verify(
    cookies.token,
    "thisisasecretkeyhelloonetwothreefour"
  );
  console.log(response._id);
  // console.log(JSON.stringify(response._id));
  console.log(`"${req.params.id}"`);
  if (req.params.id == response._id) {
    const user = await Student.findById(req.params.id);
    res.redirect(`/student/${req.params.id}/home`);
  } else {
    res.send(req.params.id);
  }
});

app.get("/resizeImg", async (req, res) => {
  res.render("resImg");
});

//************************************************************************ */

app.post("/register/student", async (req, res) => {
  const { name, email, phone, password } = req.body;
  console.log(req.body);
  const user = new Student({ name, email, phone, password });
  user.save();
  res.redirect("/");
  // const user =new Student({name,email,phone,password});
  // user.save();
});
app.post("/register/teacher", async (req, res) => {
  const { name, email, phone, password } = req.body;
  console.log(req.body);
  const user = new Teacher({ name, email, phone, password });
  user.save();
  res.redirect("/");
  // const user =new Student({name,email,phone,password});
  // user.save();
});

app.post("/login/student", async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);
  const user = await Student.findOne({ email: email });
  console.log(user);
  if (user == null) {
    req.flash("error", "Could Not find User");
    res.redirect("/login/student");
  } else if (user.password == password) {
    const token = jwt.sign(
      { _id: user._id },
      "thisisasecretkeyhelloonetwothreefour"
    );
    res.cookie("token", token);
    console.log(user._id);
    req.flash("success", "Successfully logged IN!!");
    res.redirect(`/student/${user._id}`);
  } else {
    req.flash("error", "Incorrect Password");
    res.redirect("/login/student");
  }
});

app.post("/student/:id/addFav", auth, async (req, res) => {
  const addFav1 = req.body.addFav1;
  const student = await Student.findById(req.params.id);
  const x = typeof addFav1;
  if (x == "string") {
    const tcr = await Teacher.findById(addFav1);
    if (tcr == null) {
      //console.log('Null teacher');
      req.flash("error", `${addFav1} is not a teacher`);
      return res.redirect(`/student/${req.params.id}/addFav`);
    }
    student.favTeacher.push(tcr);
    tcr.favOf.push(student);
    await student.save();
    await tcr.save();
    console.log(tcr);
  } else if (x == "object") {
    for (let fav of addFav1) {
      //console.log(fav);

      const tcr = await Teacher.findById(fav);
      //console.log(tcr);
      if (tcr == null) {
        // console.log("I AM NULLL%*^(*^(^(^");
        req.flash("error", `${fav} is not a teacher`);
        return res.redirect(`/student/${req.params.id}/addFav`);
      }
      //console.log(tcr);
      student.favTeacher.push(tcr);
      tcr.favOf.push(student);
      await student.save();
      await tcr.save();
    }
  }
  req.flash("success", "Successfully added favourite teacher");
  res.redirect(`/student/${req.params.id}/home`);
});

app.get("/mostFavTeacher", async (req, res) => {
  const teachers = await Teacher.aggregate([{ $sort: { favOf: -1 } }]);

  //Teacher.aggregate([{ $sort: { favOf :{ $size : 1} } }]);
  const teacher = await Teacher.findOne({});
  res.send(teachers[0]);
});

app.post("/student/:id/deleteFav", auth, async (req, res) => {
  const deleteFav = req.body.deleteFav;
  const student = await Student.findById(req.params.id);
  const x = typeof deleteFav;
  //console.log(deleteFav);
  if (x == "object") {
    for (let fav of deleteFav) {
      // console.log(fav);

      const tcr = await Teacher.findById(fav);

      if (tcr == null) {
        req.flash("error", `${fav} is not a teacher`);
        return res.redirect(`/student/${req.params.id}/deleteFav`);
      }
      student.favTeacher.pull(tcr);
      tcr.favOf.pull(student);
      await student.save();
      await tcr.save();
    }
  } else if (x == "string") {
    const tcr = await Teacher.findById(deleteFav);
    console.log(tcr);
    if (tcr == null) {
      //console.log('Null teacher');
      req.flash("error", `${deleteFav} is not a teacher`);
      return res.redirect(`/student/${req.params.id}/deleteFav`);
    }
    student.favTeacher.pull(tcr);
    tcr.favOf.pull(student);
    await student.save();
    await tcr.save();
  }

  res.redirect(`/student/${req.params.id}/home`);
});

app.post("/resizeImg", async (req, res) => {
  const img = req.body.url;
  const options = {
    url: img,
    dest: "/Users/hardikkaushik/Desktop/samudra/images/photo.jpg", // will be saved to /path/to/dest/image.jpg
  

  };

  await imgDown.image(options)
  .then(({ filename }) => {
    console.log('Saved to', filename);
  })
  .catch((err) => console.error(err));

  await sharp('./images/photo.jpg')
    .resize(50,50)
    .toFile('./images/compressed.jpg')

  res.sendFile('/Users/hardikkaushik/Desktop/samudra/images/compressed.jpg');
});

//************************************************************************ */

app.listen(3000, () => {
  console.log("Live on port 3000");
});
