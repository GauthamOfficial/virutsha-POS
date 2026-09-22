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
    category: { name: "Rice & Curry", icon: "🍛", bgColor: "#b73e3e", sortOrder: 1 },
    dishes: [
      { name: "Rice & Curry (Veg)", priceLocal: 350, priceForeign: 900 },
      { name: "Rice & Curry (Chicken)", priceLocal: 550, priceForeign: 1400 },
      { name: "Rice & Curry (Fish)", priceLocal: 600, priceForeign: 1500 },
    ],
  },
  {
    category: { name: "Kottu & Rotti", icon: "🥘", bgColor: "#5b45b0", sortOrder: 2 },
    dishes: [
      { name: "Vegetable Kottu", priceLocal: 450, priceForeign: 1100 },
      { name: "Chicken Kottu", priceLocal: 700, priceForeign: 1700 },
      { name: "Egg Rotti", priceLocal: 200, priceForeign: 500 },
    ],
  },
  {
    category: { name: "Short Eats", icon: "🥟", bgColor: "#735f32", sortOrder: 3 },
    dishes: [
      { name: "Fish Bun", priceLocal: 120, priceForeign: 300 },
      { name: "Vegetable Roti", priceLocal: 100, priceForeign: 250 },
      { name: "Samosa", priceLocal: 90, priceForeign: 220 },
    ],
  },
  {
    category: { name: "Beverages", icon: "🍹", bgColor: "#7f167f", sortOrder: 4 },
    dishes: [
      { name: "Plain Tea", priceLocal: 80, priceForeign: 200 },
      { name: "Milk Tea", priceLocal: 120, priceForeign: 300 },
      { name: "King Coconut", priceLocal: 150, priceForeign: 400 },
      { name: "Fresh Lime Juice", priceLocal: 250, priceForeign: 650 },
    ],
  },
  {
    category: { name: "Desserts", icon: "🍰", bgColor: "#1d2569", sortOrder: 5 },
    dishes: [
      { name: "Watalappan", priceLocal: 300, priceForeign: 750 },
      { name: "Curd & Treacle", priceLocal: 350, priceForeign: 850 },
    ],
  },
];

const run = async () => {
  await connectDB();

  // 1. Shop settings
  const settings = await getSettings();
  console.log(`⚙️  Settings ready for "${settings.restaurantName}"`);

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
    console.log(`🍽️  Menu already has ${dishCount} dishes — leaving it alone.`);
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
