const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./models/Users");
const Shop = require("./models/Shops");
const Hat = require("./models/Hats");

const PORT = process.env.PORT || 2002;

mongoose.connect(
  "mongodb+srv://edesiri:1nOVv0WR4JfOaxTf@hatsforyoucluster.w9ktc9v.mongodb.net/hatsforyou?retryWrites=true&w=majority"
);

app.listen(PORT, () => {
  console.log(`Server is listening on port http://localhost:${PORT}/`);
});
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

const createToken = (user) => {
  return jwt.sign({ user }, "secret", { expiresIn: "1h" });
};

const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const decodedToken = jwt.verify(token, "secret");
    // console.log(decodedToken)
    req.user = decodedToken.user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token is invalid" });
  }
};

app.get("/api/v1/hatmart", async (req, res, next) => {
  const { shopname, color } = req.query;
  const allhats = await Hat.find().populate('shop', 'name address')
  try {
    let hatsQuery = Hat.find();
  
    if (color) {
      hatsQuery = hatsQuery.where("colour", { $regex: new RegExp(color, 'i') });
    }
    if (shopname) {
      hatsQuery = Hat.aggregate([
        {
          $lookup: {
            from: "shops",
            localField: "shop",
            foreignField: "_id",
            as: "shop"
           }
        },
        {
          $unwind : "$shop"
        },
        {
          $match: { "shop.name": { $regex: new RegExp(shopname, 'i') } },
        }
      ]);
    }
  
    const hats = await hatsQuery.exec();
    if (hats.length === 0) {
      return res.status(404).json({
        allhats,
      });
    }
    else{
      const populatedHats = await Hat.populate(hats, {path: "shop"});
      res.status(200).json({ hats: populatedHats });
    }
  
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/v1/", async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, "secret");
    const user = await User.findById(decodedToken.user._id);
    if (!user) {
      return res.status(401).json({
        message: "Please login",
      });
    }
    req.user = user;
    res.send({
      message: "Welcome to Hatsforyou",
      user: user,
    });

    next();
  } catch (error) {
    res.status(401).json({
      error: new Error("Invalid request!"),
    });
  }
});
app.post("/api/v1/signup", async (req, res, next) => {
  try {
    const { first_name, last_name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        first_name,
        last_name,
        email,
        password: hashedPassword,
      });
      const token = createToken(user);
      res.cookie("token", token, {
        httpOnly: false,
      });
      res.status(201).json({
        message: "User created",
        token,
        success: true,
        user,
      });
    }
    next();
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

app.post("/api/v1/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide email and password",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Incorrect username or password",
      });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({
        message: "Invalid username or password",
      });
    }
    const token = createToken(user);
    res.cookie("token", token, {
      // withCredentials: true,
      httpOnly: true,
    });
    res.status(201).json({
      message: "Login successful",
      success: true,
      token,
      user,
    });
    next();
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

app.delete("/api/v1/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({
    message: "Logout successful",
  });
});

app.post("/api/v1/shops", verifyToken, async (req, res, next) => {
  try {
    const { name, address, slogan, email } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        message: "Please login",
      });
    }
    const shop = await Shop.create({
      name,
      address,
      email,
      slogan,
      owner: user._id,
    });
    await shop.save();
    user.my_shops.push(shop._id);
    await user.save();
    res.status(201).json({
      message: "Shop created",
      shop,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.get("/api/v1/shops", verifyToken, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    const shops = await Shop.find({ owner: userId });
    res.status(200).json({
      shops,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.put("/api/v1/shops/:shopId", verifyToken, async (req, res, next) => {
  const shopId = new mongoose.Types.ObjectId(req.params.shopId);
  const { name, address, slogan } = req.body;
  try {
    const shop = await Shop.findById(shopId).populate("owner", "email");
    console.log(shop);
    if (!shop) {
      return res.status(400).json({
        message: "Shop not found",
      });
    }
    if (shop.owner.email !== req.user.email) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    shop.name = name;
    shop.address = address;
    shop.slogan = slogan;
    await shop.save();

    res.status(200).json({
      message: "Shop updated",
      shop,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.delete("/api/v1/shops/:shopId", verifyToken, async (req, res, next) => {
  const shopId = new mongoose.Types.ObjectId(req.params.shopId);
  const hats = await Hat.find({ shop: shopId });
  try{
    const shop = await Shop.findById(shopId).populate("owner", "email");
    if (!shop) {
      return res.status(404).json({
        message: "Shop not found",
      });
    }
    if (shop.owner.email !== req.user.email) {
          return res.status(401).json({
            message: "Unauthorized",
          });
    }
    
    await Shop.deleteOne({ _id: shopId, owner: req.user._id });
    await Hat.deleteMany({ shop: shopId });
    res.status(200).json({
      message: "Shop deleted",
      shop,
    });
  }
  catch(error){
      return res.status(404).json({
        message: "Shop not found",
      });
    }
  
})

app.post("/api/v1/hats", verifyToken, async (req, res, next) => {
  try {
    const { name, colour, shopId, price } = req.body;
    const shop = await Shop.findById(shopId).populate("owner", "email");
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }
    if (shop.owner.email !== req.user.email) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    const hat = new Hat({
      colour,
      name,
      price,
      owner: req.user._id,
      shop: shopId,
    });
    await hat.save();
    shop.hats.push(hat._id);
    await shop.save();
    res.status(201).json({
      message: "Hat created",
      hat,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.get("/api/v1/hats", verifyToken, async (req, res, next) => {
  const { shopname, color} = req.query;
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    let allhats = await Hat.find({ owner: userId }).populate('shop', 'name');
    let hatsQuery = Hat.find({owner: userId});
    if (color){
      hatsQuery = hatsQuery.where("colour", { $regex: new RegExp(color, 'i') });
    }
    if (shopname) {
      hatsQuery = Hat.aggregate([
        {
          $lookup: {
            from: "shops",
            localField: "shop",
            foreignField: "_id",
            as: "shop"
           }
        },
        {
          $unwind : "$shop"
        },
        {
          $match: { "shop.name": { $regex: new RegExp(shopname, 'i') } },
        }
      ]);
    }
    
    const hats = await hatsQuery.exec();
    if (hats.length === 0) {
      return res.status(404).json({
        allhats,
      });
    }
    else{
      const populatedHats = await Hat.populate(hats, {path: "shop"});
      res.status(200).json({ hats: populatedHats });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.get("/api/v1/hats/:hatId", verifyToken, async (req,res, next) => {
  const hatId = new mongoose.Types.ObjectId(req.params.hatId);
})

app.put("/api/v1/hats/:hatId", verifyToken, async (req, res) => {
  const hatId = new mongoose.Types.ObjectId(req.params.hatId);
  const { colour, name, price } = req.body;
  try {
    const hat = await Hat.findById(hatId);
    if (!hat) {
      return res.status(400).json({
        message: "Hat not found",
      });
    }
    hat.name = name;
    hat.price = price;
    hat.colour = colour;
    await hat.save();
    res.status(200).json({
      message: "Hat updated",
      hat,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.get("/api/v1/hatmart", async (req, res, next) => {
  const shops = await Shop.find();
  res.status(200).json({
    shops,
  });
});
