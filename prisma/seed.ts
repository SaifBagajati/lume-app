import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

async function main() {
  console.log("Seeding database...");

  // Create a test tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-restaurant" },
    update: {},
    create: {
      name: "Demo Restaurant",
      slug: "demo-restaurant",
    },
  });

  console.log("Created tenant:", tenant.name);

  // Create a test owner user
  const hashedPassword = await hash("password123", 12);
  const user = await prisma.user.upsert({
    where: { email: "owner@demo.com" },
    update: {},
    create: {
      email: "owner@demo.com",
      name: "Demo Owner",
      password: hashedPassword,
      role: "OWNER",
      tenantId: tenant.id,
      emailVerified: true,
    },
  });

  console.log("Created user:", user.email);

  // Create some sample tables
  const tables = await Promise.all([
    prisma.restaurantTable.upsert({
      where: { qrCode: "table-1-qr" },
      update: {},
      create: {
        number: "1",
        qrCode: "table-1-qr",
        tenantId: tenant.id,
      },
    }),
    prisma.restaurantTable.upsert({
      where: { qrCode: "table-2-qr" },
      update: {},
      create: {
        number: "2",
        qrCode: "table-2-qr",
        tenantId: tenant.id,
      },
    }),
    prisma.restaurantTable.upsert({
      where: { qrCode: "table-3-qr" },
      update: {},
      create: {
        number: "3",
        qrCode: "table-3-qr",
        tenantId: tenant.id,
      },
    }),
  ]);

  console.log(`Created ${tables.length} tables`);

  // Delete existing data for fresh seed (in correct order to avoid FK constraints)
  await prisma.payment.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.orderItem.deleteMany({
    where: { order: { tenantId: tenant.id } },
  });
  await prisma.order.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.menuItem.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.menuCategory.deleteMany({ where: { tenantId: tenant.id } });

  // Create menu categories (in display order: Appetizers, Mains, Cold Drinks, Hot Drinks, Desserts)
  const appetizers = await prisma.menuCategory.create({
    data: {
      name: "Appetizers",
      description: "Start your meal with our delicious starters",
      sortOrder: 1,
      tenantId: tenant.id,
    },
  });

  const mains = await prisma.menuCategory.create({
    data: {
      name: "Mains",
      description: "Our signature main courses",
      sortOrder: 2,
      tenantId: tenant.id,
    },
  });

  const coldDrinks = await prisma.menuCategory.create({
    data: {
      name: "Cold Drinks",
      description: "Refreshing beverages",
      sortOrder: 3,
      tenantId: tenant.id,
    },
  });

  const hotDrinks = await prisma.menuCategory.create({
    data: {
      name: "Hot Drinks",
      description: "Warm beverages to complement your meal",
      sortOrder: 4,
      tenantId: tenant.id,
    },
  });

  const desserts = await prisma.menuCategory.create({
    data: {
      name: "Desserts",
      description: "Sweet endings to your meal",
      sortOrder: 5,
      tenantId: tenant.id,
    },
  });

  console.log("Created 5 categories");

  // Create appetizer menu items
  await Promise.all([
    prisma.menuItem.create({
      data: {
        name: "Bruschetta",
        description: "Grilled bread topped with fresh tomatoes, basil, and garlic",
        price: 8.99,
        imageUrl: "https://images.unsplash.com/photo-1506280754576-f6fa8a873550?w=800&h=600&fit=crop",
        categoryId: appetizers.id,
        tenantId: tenant.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Calamari Fritti",
        description: "Crispy fried calamari served with marinara sauce",
        price: 12.99,
        imageUrl: "https://images.unsplash.com/photo-1604909052743-94e838986d24?w=800&h=600&fit=crop",
        categoryId: appetizers.id,
        tenantId: tenant.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Buffalo Wings",
        description: "Spicy chicken wings with blue cheese dip",
        price: 11.99,
        imageUrl: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&h=600&fit=crop",
        categoryId: appetizers.id,
        tenantId: tenant.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Spring Rolls",
        description: "Crispy vegetable spring rolls with sweet chili sauce",
        price: 7.99,
        imageUrl: "https://images.unsplash.com/photo-1620796888714-e2ed6d564217?w=800&h=600&fit=crop",
        categoryId: appetizers.id,
        tenantId: tenant.id,
      },
    }),
  ]);

  // Create main course items
  await Promise.all([
    prisma.menuItem.create({
      data: {
        name: "Grilled Salmon",
        description: "Fresh Atlantic salmon with roasted vegetables and lemon butter sauce",
        price: 24.99,
        imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&h=600&fit=crop",
        categoryId: mains.id,
        tenantId: tenant.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Chicken Alfredo",
        description: "Creamy fettuccine pasta with grilled chicken breast",
        price: 18.99,
        imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop",
        categoryId: mains.id,
        tenantId: tenant.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Beef Tenderloin",
        description: "8oz premium beef tenderloin with mashed potatoes and gravy",
        price: 32.99,
        imageUrl: "https://images.unsplash.com/photo-1558030006-450675393462?w=800&h=600&fit=crop",
        categoryId: mains.id,
        tenantId: tenant.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Margherita Pizza",
        description: "Classic pizza with fresh mozzarella, tomatoes, and basil",
        price: 16.99,
        imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop",
        categoryId: mains.id,
        tenantId: tenant.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Vegetarian Buddha Bowl",
        description: "Quinoa, roasted vegetables, avocado, and tahini dressing",
        price: 15.99,
        imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop",
        categoryId: mains.id,
        tenantId: tenant.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Fish & Chips",
        description: "Beer-battered cod with crispy fries and tartar sauce",
        price: 17.99,
        imageUrl: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&h=600&fit=crop",
        categoryId: mains.id,
        tenantId: tenant.id,
      },
    }),
  ]);

  // Create dessert items
  await Promise.all([
    prisma.menuItem.create({
      data: {
        name: "Chocolate Lava Cake",
        description: "Warm chocolate cake with molten center, served with vanilla ice cream",
        price: 8.99,
        imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&h=600&fit=crop",
        categoryId: desserts.id,
        tenantId: tenant.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Tiramisu",
        description: "Classic Italian dessert with espresso-soaked ladyfingers",
        price: 7.99,
        imageUrl: "https://images.unsplash.com/photo-1586040140378-b5d83e3e7f2d?w=800&h=600&fit=crop",
        categoryId: desserts.id,
        tenantId: tenant.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "New York Cheesecake",
        description: "Rich and creamy cheesecake with berry compote",
        price: 8.49,
        imageUrl: "https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=800&h=600&fit=crop",
        categoryId: desserts.id,
        tenantId: tenant.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Ice Cream Sundae",
        description: "Three scoops of ice cream with toppings of your choice",
        price: 6.99,
        imageUrl: "https://images.unsplash.com/photo-1580915411954-282cb1b0d780?w=800&h=600&fit=crop",
        categoryId: desserts.id,
        tenantId: tenant.id,
      },
    }),
  ]);

  // Create hot drink items
  await Promise.all([
    prisma.menuItem.create({
      data: {
        name: "Espresso",
        description: "Rich and bold Italian espresso",
        price: 3.50,
        imageUrl: "https://images.unsplash.com/photo-1579992357154-faf4bde95b3d?w=800&h=600&fit=crop",
        categoryId: hotDrinks.id,
        tenantId: tenant.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Cappuccino",
        description: "Espresso with steamed milk and foam",
        price: 4.50,
        imageUrl: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=800&h=600&fit=crop",
        categoryId: hotDrinks.id,
        tenantId: tenant.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Latte",
        description: "Smooth espresso with steamed milk",
        price: 4.75,
        imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=600&fit=crop",
        categoryId: hotDrinks.id,
        tenantId: tenant.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Hot Chocolate",
        description: "Rich chocolate drink with whipped cream",
        price: 4.25,
        imageUrl: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=800&h=600&fit=crop",
        categoryId: hotDrinks.id,
        tenantId: tenant.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Green Tea",
        description: "Premium Japanese green tea",
        price: 3.25,
        imageUrl: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=800&h=600&fit=crop",
        categoryId: hotDrinks.id,
        tenantId: tenant.id,
      },
    }),
  ]);

  // Create cold drink items
  await Promise.all([
    prisma.menuItem.create({
      data: {
        name: "Iced Coffee",
        description: "Cold brew coffee over ice",
        price: 4.50,
        imageUrl: "https://images.unsplash.com/photo-1517959105821-eaf2591984ca?w=800&h=600&fit=crop",
        categoryId: coldDrinks.id,
        tenantId: tenant.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Fresh Orange Juice",
        description: "Freshly squeezed orange juice",
        price: 5.50,
        imageUrl: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop",
        categoryId: coldDrinks.id,
        tenantId: tenant.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Lemonade",
        description: "House-made lemonade with fresh lemons",
        price: 4.00,
        imageUrl: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800&h=600&fit=crop",
        categoryId: coldDrinks.id,
        tenantId: tenant.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Iced Tea",
        description: "Refreshing iced tea with lemon",
        price: 3.50,
        imageUrl: "https://images.unsplash.com/photo-1499638309848-e9968540da83?w=800&h=600&fit=crop",
        categoryId: coldDrinks.id,
        tenantId: tenant.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Smoothie",
        description: "Mixed berry smoothie with yogurt",
        price: 6.50,
        imageUrl: "https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=800&h=600&fit=crop",
        categoryId: coldDrinks.id,
        tenantId: tenant.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Coca-Cola",
        description: "Classic Coca-Cola",
        price: 2.50,
        imageUrl: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=800&h=600&fit=crop",
        categoryId: coldDrinks.id,
        tenantId: tenant.id,
      },
    }),
  ]);

  console.log("Created menu items across all categories");

  console.log("\nSeed completed successfully!");
  console.log("\nTest credentials:");
  console.log("Email: owner@demo.com");
  console.log("Password: password123");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
