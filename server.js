require("dotenv").config();
const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const helmet = require("helmet");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database(path.join(__dirname, "qafila.sqlite"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password_hash TEXT, must_change INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT DEFAULT 'Healthy Snacks', price REAL NOT NULL DEFAULT 0, old_price REAL DEFAULT 0, stock INTEGER DEFAULT 0, image TEXT DEFAULT '', description TEXT DEFAULT '', featured INTEGER DEFAULT 0, active INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT, phone TEXT, address TEXT, items TEXT, total REAL, payment TEXT DEFAULT 'Cash on Delivery', status TEXT DEFAULT 'Pending', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, phone TEXT, message TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
`);

const initialAdmin = db.prepare("SELECT id FROM admins WHERE username=?").get(process.env.ADMIN_USERNAME || "admin");
if (!initialAdmin) {
  const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "Qafila@2026!", 12);
  db.prepare("INSERT INTO admins(username,password_hash,must_change) VALUES(?,?,1)").run(process.env.ADMIN_USERNAME || "admin", hash);
}
const defaults = {
  brand_name: "Qafila Foods",
  tagline: "Healthy, Tasty & Natural Food for a Better Life",
  announcement: "প্রকৃতির সাথে সুস্থতার বন্ধনে — প্রতিদিনের পুষ্টিকর খাবার",
  hero_title: "প্রতিদিনের জীবনে যোগ হোক প্রাকৃতিক পুষ্টি",
  hero_subtitle: "স্বাস্থ্যকর, সুস্বাদু ও যত্নে তৈরি খাবার পৌঁছে যাক আপনার ঘরে।",
  hero_button: "এখনই শপ করুন",
  hero_image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1600",
  about_title: "প্রকৃতির কাছাকাছি, সুস্থতার পাশে",
  about_text: "Qafila Foods-এ আমরা বেছে নিই যত্ন, গুণমান ও স্বাদের সমন্বয়। প্রতিদিনের খাবারে প্রাকৃতিক পুষ্টি যোগ করাই আমাদের লক্ষ্য।",
  phone: "01615-589199",
  email: "qafilafoods@gmail.com",
  address: "Mirpur, Dhaka-1216, Bangladesh",
  delivery_inside: "60",
  delivery_outside: "120",
  currency: "৳",
  facebook: "",
  instagram: "",
  footer_text: "সুস্থতা, স্বাদ এবং প্রকৃতির ছোঁয়ায় প্রতিদিন।"
};
const ins = db.prepare("INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)");
Object.entries(defaults).forEach(([k,v]) => ins.run(k,v));
const cats = ["বাদাম ও ড্রাই ফ্রুটস","হেলদি স্ন্যাকস","খেজুর ও প্রাকৃতিক মিষ্টি","সিডস ও সুপারফুড","গিফট প্যাক"];
const addCat = db.prepare("INSERT OR IGNORE INTO categories(name) VALUES(?)");
cats.forEach(c => addCat.run(c));
if (db.prepare("SELECT COUNT(*) n FROM products").get().n === 0) {
  const sample = [
    ["প্রিমিয়াম মিক্সড নাটস","বাদাম ও ড্রাই ফ্রুটস",650,750,25,"https://images.unsplash.com/photo-1505576633757-0ac1084af824?w=700","বাছাইকৃত বাদামের সুস্বাদু মিশ্রণ।",1],
    ["ন্যাচারাল খেজুর পাউডার","খেজুর ও প্রাকৃতিক মিষ্টি",420,480,30,"https://images.unsplash.com/photo-1515543904379-3d757越b3d71?w=700","প্রাকৃতিক মিষ্টির স্বাদে তৈরি।",1],
    ["হেলদি ট্রেইল মিক্স","হেলদি স্ন্যাকস",350,0,18,"https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=700","ব্যস্ত দিনের জন্য পুষ্টিকর স্ন্যাকস।",0],
    ["চিয়া সিডস","সিডস ও সুপারফুড",280,320,40,"https://images.unsplash.com/photo-1515543904379-3d757b3d71?w=700","প্রতিদিনের খাদ্যতালিকায় সহজ সংযোজন।",0]
  ];
  const p = db.prepare("INSERT INTO products(name,category,price,old_price,stock,image,description,featured) VALUES(?,?,?,?,?,?,?,?)");
  sample.forEach(x => p.run(...x));
}
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({limit:"2mb"}));
app.use(express.urlencoded({extended:true}));
app.use(session({
  store: new SQLiteStore({ db: "sessions.sqlite", dir: __dirname }),
  secret: process.env.SESSION_SECRET || "change-this-session-secret-before-deploy",
  resave: false, saveUninitialized: false,
  cookie: { httpOnly:true, sameSite:"lax", secure: process.env.NODE_ENV === "production", maxAge: 8*60*60*1000 }
}));
const uploadDir = path.join(__dirname,"public","uploads");
fs.mkdirSync(uploadDir,{recursive:true});
const storage = multer.diskStorage({
  destination: (_,__,cb)=>cb(null,uploadDir),
  filename: (_,file,cb)=>cb(null,Date.now()+"-"+file.originalname.replace(/[^a-zA-Z0-9._-]/g,""))
});
const upload = multer({storage, limits:{fileSize:5*1024*1024}});
app.use(express.static(path.join(__dirname,"public","Public")));
function admin(req,res,next){ if(req.session.admin) return next(); return res.status(401).json({error:"Please login"}); }
const all = (sql,...args)=>db.prepare(sql).all(...args);
const one = (sql,...args)=>db.prepare(sql).get(...args);
const run = (sql,...args)=>db.prepare(sql).run(...args);
function settings(){ return Object.fromEntries(all("SELECT key,value FROM settings").map(x=>[x.key,x.value])); }

app.get("/api/store",(req,res)=>{
  res.json({settings:settings(), products:all("SELECT * FROM products WHERE active=1 ORDER BY featured DESC,id DESC"), categories:all("SELECT * FROM categories ORDER BY name")});
});
app.post("/api/orders",(req,res)=>{
  const {name,phone,address,items,payment="Cash on Delivery"}=req.body;
  if(!name||!phone||!address||!Array.isArray(items)||!items.length) return res.status(400).json({error:"সব তথ্য পূরণ করুন"});
  let total=0, normalized=[];
  for(const item of items){
    const p=one("SELECT id,name,price,stock FROM products WHERE id=? AND active=1",Number(item.id));
    const qty=Math.max(1,Math.min(99,Number(item.qty)||1));
    if(!p||p.stock<qty) return res.status(400).json({error:"একটি পণ্যের পর্যাপ্ত স্টক নেই"});
    total+=p.price*qty; normalized.push({id:p.id,name:p.name,price:p.price,qty});
  }
  const info=run("INSERT INTO orders(customer_name,phone,address,items,total,payment) VALUES(?,?,?,?,?,?)",name,phone,address,JSON.stringify(normalized),total,payment);
  normalized.forEach(i=>run("UPDATE products SET stock=stock-? WHERE id=?",i.qty,i.id));
  res.json({ok:true,orderId:info.lastInsertRowid,total});
});
app.post("/api/contact",(req,res)=>{
  const {name,phone,message}=req.body;
  if(!name||!phone||!message)return res.status(400).json({error:"সব তথ্য পূরণ করুন"});
  run("INSERT INTO messages(name,phone,message) VALUES(?,?,?)",name,phone,message);res.json({ok:true});
});
app.post("/api/admin/login",(req,res)=>{
  const {username,password}=req.body; const a=one("SELECT * FROM admins WHERE username=?",username||"");
  if(!a||!bcrypt.compareSync(password||"",a.password_hash))return res.status(401).json({error:"Username অথবা password সঠিক নয়"});
  req.session.admin={id:a.id,username:a.username,mustChange:!!a.must_change};res.json({ok:true,username:a.username,mustChange:!!a.must_change});
});
app.post("/api/admin/logout",(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get("/api/admin/me",admin,(req,res)=>res.json(req.session.admin));
app.post("/api/admin/password",admin,(req,res)=>{
  const {currentPassword,newPassword}=req.body;
  const a=one("SELECT * FROM admins WHERE id=?",req.session.admin.id);
  if(!bcrypt.compareSync(currentPassword||"",a.password_hash))return res.status(400).json({error:"বর্তমান password সঠিক নয়"});
  if(!newPassword||newPassword.length<10)return res.status(400).json({error:"নতুন password কমপক্ষে ১০ অক্ষরের হতে হবে"});
  run("UPDATE admins SET password_hash=?,must_change=0 WHERE id=?",bcrypt.hashSync(newPassword,12),a.id);
  req.session.admin.mustChange=false;res.json({ok:true});
});
app.get("/api/admin/dashboard",admin,(req,res)=>res.json({
  products:one("SELECT COUNT(*) n FROM products").n,
  orders:one("SELECT COUNT(*) n FROM orders").n,
  pending:one("SELECT COUNT(*) n FROM orders WHERE status='Pending'").n,
  sales:one("SELECT COALESCE(SUM(total),0) n FROM orders WHERE status='Delivered'").n,
  recent:all("SELECT * FROM orders ORDER BY id DESC LIMIT 8")
}));
app.get("/api/admin/products",admin,(req,res)=>res.json(all("SELECT * FROM products ORDER BY id DESC")));
app.post("/api/admin/products",admin,(req,res)=>{
  const x=req.body;
  if(!x.name||Number(x.price)<0)return res.status(400).json({error:"পণ্যের নাম ও সঠিক দাম দিন"});
  const info=run("INSERT INTO products(name,category,price,old_price,stock,image,description,featured,active) VALUES(?,?,?,?,?,?,?,?,?)",x.name,x.category||"",Number(x.price),Number(x.old_price)||0,Number(x.stock)||0,x.image||"",x.description||"",x.featured?1:0,x.active===false?0:1);
  res.json({ok:true,id:info.lastInsertRowid});
});
app.put("/api/admin/products/:id",admin,(req,res)=>{
  const x=req.body;run("UPDATE products SET name=?,category=?,price=?,old_price=?,stock=?,image=?,description=?,featured=?,active=? WHERE id=?",x.name,x.category,Number(x.price),Number(x.old_price)||0,Number(x.stock)||0,x.image||"",x.description||"",x.featured?1:0,x.active===false?0:1,req.params.id);res.json({ok:true});
});
app.delete("/api/admin/products/:id",admin,(req,res)=>{run("DELETE FROM products WHERE id=?",req.params.id);res.json({ok:true});});
app.post("/api/admin/upload",admin,upload.single("image"),(req,res)=>res.json({url:"/uploads/"+req.file.filename}));
app.get("/api/admin/categories",admin,(req,res)=>res.json(all("SELECT * FROM categories ORDER BY name")));
app.post("/api/admin/categories",admin,(req,res)=>{if(!req.body.name)return res.status(400).json({error:"নাম দিন"});try{run("INSERT INTO categories(name) VALUES(?)",req.body.name);res.json({ok:true});}catch(e){res.status(400).json({error:"এই category আগে থেকেই আছে"});}});
app.delete("/api/admin/categories/:id",admin,(req,res)=>{run("DELETE FROM categories WHERE id=?",req.params.id);res.json({ok:true});});
app.get("/api/admin/orders",admin,(req,res)=>res.json(all("SELECT * FROM orders ORDER BY id DESC")));
app.patch("/api/admin/orders/:id",admin,(req,res)=>{run("UPDATE orders SET status=? WHERE id=?",req.body.status,req.params.id);res.json({ok:true});});
app.get("/api/admin/settings",admin,(req,res)=>res.json(settings()));
app.put("/api/admin/settings",admin,(req,res)=>{
  const stmt=db.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value");
  Object.entries(req.body).forEach(([k,v])=>stmt.run(k,String(v)));res.json({ok:true});
});
app.get("/api/admin/messages",admin,(req,res)=>res.json(all("SELECT * FROM messages ORDER BY id DESC")));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`Qafila Foods running at http://localhost:${PORT}`));
