/**
 * First-time setup. Creates the Admin login, the shop settings and a starter
 * menu so the system is usable the moment it opens.
 *
 * Run with:  npm run seed
 * Safe to run again: it never overwrites data that already exists.
 */
const mongoose = require("mongoose");
const connectDB = require("./config/database");
const config = require("./config/config");
const User = require("./models/userModel");
const Category = require("./models/categoryModel");
const Dish = require("./models/dishModel");
const { getSettings } = require("./models/settingsModel");

const starterMenu = [
  {
    category: { name: 'Biriyani', icon: '🍛', bgColor: '#8D2C0D', sortOrder: 1 },
    dishes: [
      { name: 'Chicken Biriyani', priceLocal: 750, priceForeign: 1800 },
      { name: 'Mutton Biriyani', priceLocal: 950, priceForeign: 2200 },
      { name: 'Vegetable Biriyani', priceLocal: 550, priceForeign: 1300 },
      { name: 'Egg Biriyani', priceLocal: 600, priceForeign: 1450 },
    ],
  },
  {
    category: { name: 'Dosa', icon: '🥞', bgColor: '#A8391A', sortOrder: 2 },
    dishes: [
      { name: 'Plain Dosa', priceLocal: 250, priceForeign: 600 },
      { name: 'Masala Dosa', priceLocal: 400, priceForeign: 950 },
      { name: 'Ghee Roast Dosa', priceLocal: 450, priceForeign: 1100 },
      { name: 'Onion Rava Dosa', priceLocal: 420, priceForeign: 1000 },
    ],
  },
  {
    category: { name: 'Idli & Vadai', icon: '🍚', bgColor: '#CA840E', sortOrder: 3 },
    dishes: [
      { name: 'Idli (2 pcs)', priceLocal: 180, priceForeign: 450 },
      { name: 'Sambar Vadai', priceLocal: 200, priceForeign: 500 },
      { name: 'Ven Pongal', priceLocal: 320, priceForeign: 780 },
    ],
  },
  {
    category: { name: 'Meals', icon: '🍽️', bgColor: '#1B3A20', sortOrder: 4 },
    dishes: [
      { name: 'Vegetarian Meals', priceLocal: 450, priceForeign: 1100 },
      { name: 'Chicken Meals', priceLocal: 700, priceForeign: 1700 },
      { name: 'Fish Meals', priceLocal: 750, priceForeign: 1800 },
    ],
  },
  {
    category: { name: 'Chai & Drinks', icon: '☕', bgColor: '#00795A', sortOrder: 5 },
    dishes: [
      { name: 'Masala Chai', priceLocal: 120, priceForeign: 300 },
      { name: 'Plain Tea', priceLocal: 80, priceForeign: 200 },
      { name: 'Filter Coffee', priceLocal: 150, priceForeign: 380 },
      { name: 'Fresh Lime Juice', priceLocal: 250, priceForeign: 620 },
      { name: 'King Coconut', priceLocal: 150, priceForeign: 400 },
    ],
  },
  {
    category: { name: 'Sweets', icon: '🍮', bgColor: '#8A5A06', sortOrder: 6 },
    dishes: [
      { name: 'Payasam', priceLocal: 280, priceForeign: 680 },
      { name: 'Gulab Jamun (2 pcs)', priceLocal: 250, priceForeign: 600 },
      { name: 'Watalappan', priceLocal: 300, priceForeign: 750 },
    ],
  },
];

const run = async () => {
  await connectDB();

  // 1. Shop settings
  const settings = await getSettings();

  // A schema default only applies when the document is first created, so an
  // installation set up before these were filled in would still be blank.
  // Fill only what is empty - anything typed in Settings is left alone.
  const backfill = {
    addressLine: "Sigiriya Road, Pothana, Kimbissa",
    phone: "+94 70 644 5506 / +94 71 778 5189",
    otherServicesTitle: "Our Other Services",
    otherServices: "Priyani Diver’s Room & Prime Auto Service",
  };

  let filled = false;
  for (const [field, value] of Object.entries(backfill)) {
    if (!settings[field] || !String(settings[field]).trim()) {
      settings[field] = value;
      filled = true;
    }
  }
  if (filled) await settings.save();

  console.log(`⚙️  Settings ready for "${settings.restaurantName}"`);
  console.log(`   ${settings.addressLine}`);
  console.log(`   ${settings.phone}`);

  // 2. Admin account
  const existingAdmin = await User.findOne({ email: config.seedAdmin.email.toLowerCase() });
  if (existingAdmin) {
    console.log(`👤 Admin already exists: ${existingAdmin.email}`);
  } else {
    await User.create({
      name: config.seedAdmin.name,
      email: config.seedAdmin.email,
      phone: config.seedAdmin.phone,
      password: config.seedAdmin.password,
      role: "Admin",
    });
    console.log(`👤 Admin created: ${config.seedAdmin.email} / ${config.seedAdmin.password}`);
    console.log("   ⚠️  Change this password after the first login.");
  }

  // 3. Starter menu
  const dishCount = await Dish.countDocuments();
  if (dishCount > 0) {
    console.log(`🍽️  Menu already has ${dishCount} dishes, leaving it alone.`);
  } else {
    for (const group of starterMenu) {
      const category = await Category.create(group.category);
      await Dish.insertMany(
        group.dishes.map((dish, index) => ({
          ...dish,
          category: category._id,
          sortOrder: index,
        }))
      );
      console.log(`🍽️  Added "${category.name}" with ${group.dishes.length} dishes`);
    }
  }

  console.log("\n✅ Setup complete. Start the server with: npm run dev");
  await mongoose.connection.close();
  process.exit(0);
};

run().catch(async (error) => {
  console.error("❌ Setup failed:", error.message);
  process.exit(1);
});
