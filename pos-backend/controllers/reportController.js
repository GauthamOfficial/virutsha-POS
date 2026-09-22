const Order = require("../models/orderModel");

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const startOfDay = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (d) => {
  const date = new Date(d);
  date.setHours(23, 59, 59, 999);
  return date;
};

// Works out the date window and how the chart should be bucketed for each
// of the ranges the shop asked for: daily, weekly and monthly.
const resolveRange = (query) => {
  const period = query.period || "daily";
  const now = query.date ? new Date(query.date) : new Date();

  if (period === "custom" && query.from && query.to) {
    return {
      period,
      from: startOfDay(query.from),
      to: endOfDay(query.to),
      bucket: "day",
      label: "Custom range",
    };
  }

  if (period === "weekly") {
    // Week runs Monday to Sunday.
    const from = startOfDay(now);
    const dayOfWeek = (from.getDay() + 6) % 7;
    from.setDate(from.getDate() - dayOfWeek);
    const to = endOfDay(new Date(from.getTime() + 6 * 86400000));
    return { period, from, to, bucket: "day", label: "This week" };
  }

  if (period === "monthly") {
    const from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    const to = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    return { period, from, to, bucket: "day", label: "This month" };
  }

  if (period === "yearly") {
    const from = startOfDay(new Date(now.getFullYear(), 0, 1));
    const to = endOfDay(new Date(now.getFullYear(), 11, 31));
    return { period, from, to, bucket: "month", label: "This year" };
  }

  return { period: "daily", from: startOfDay(now), to: endOfDay(now), bucket: "hour", label: "Today" };
};

const summarise = (orders) => {
  const totals = {
    orders: orders.length,
    itemsSold: 0,
    subtotal: 0,
    discount: 0,
    tax: 0,
    revenue: 0,
  };

  const byPayment = { Cash: { orders: 0, revenue: 0 }, Card: { orders: 0, revenue: 0 } };
  const byCustomerType = {
    Local: { orders: 0, revenue: 0 },
    Foreigner: { orders: 0, revenue: 0 },
  };

  for (const order of orders) {
    totals.subtotal += order.bills.subtotal;
    totals.discount += order.bills.discount || 0;
    totals.tax += order.bills.tax || 0;
    totals.revenue += order.bills.total;
    totals.itemsSold += order.items.reduce((sum, i) => sum + i.quantity, 0);

    const pay = byPayment[order.paymentMethod];
    if (pay) {
      pay.orders += 1;
      pay.revenue += order.bills.total;
    }

    const type = byCustomerType[order.customerType];
    if (type) {
      type.orders += 1;
      type.revenue += order.bills.total;
    }
  }

  totals.subtotal = round2(totals.subtotal);
  totals.discount = round2(totals.discount);
  totals.tax = round2(totals.tax);
  totals.revenue = round2(totals.revenue);
  totals.averageBill = totals.orders ? round2(totals.revenue / totals.orders) : 0;

  for (const key of Object.keys(byPayment)) byPayment[key].revenue = round2(byPayment[key].revenue);
  for (const key of Object.keys(byCustomerType)) {
    byCustomerType[key].revenue = round2(byCustomerType[key].revenue);
  }

  return { totals, byPayment, byCustomerType };
};

const buildSeries = (orders, { from, to, bucket }) => {
  const buckets = [];
  const index = new Map();

  const push = (key, label) => {
    index.set(key, buckets.length);
    buckets.push({ key, label, orders: 0, revenue: 0 });
  };

  if (bucket === "hour") {
    for (let h = 0; h < 24; h += 1) {
      push(String(h), `${String(h).padStart(2, "0")}:00`);
    }
  } else if (bucket === "month") {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let m = 0; m < 12; m += 1) push(String(m), months[m]);
  } else {
    const cursor = startOfDay(from);
    while (cursor <= to) {
      const key = cursor.toISOString().slice(0, 10);
      push(key, `${String(cursor.getDate()).padStart(2, "0")}/${cursor.getMonth() + 1}`);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  for (const order of orders) {
    const date = new Date(order.createdAt);
    let key;
    if (bucket === "hour") key = String(date.getHours());
    else if (bucket === "month") key = String(date.getMonth());
    else key = startOfDay(date).toISOString().slice(0, 10);

    const slot = buckets[index.get(key)];
    if (slot) {
      slot.orders += 1;
      slot.revenue += order.bills.total;
    }
  }

  return buckets.map((b) => ({ ...b, revenue: round2(b.revenue) }));
};

const buildTopDishes = (orders, limit = 10) => {
  const map = new Map();

  for (const order of orders) {
    for (const item of order.items) {
      const key = item.name;
      const entry = map.get(key) || { name: key, quantity: 0, revenue: 0 };
      entry.quantity += item.quantity;
      entry.revenue += item.amount;
      map.set(key, entry);
    }
  }

  return [...map.values()]
    .map((d) => ({ ...d, revenue: round2(d.revenue) }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
};

// One endpoint serving the daily / weekly / monthly sales screen.
const getSalesReport = async (req, res, next) => {
  try {
    const range = resolveRange(req.query);

    const orders = await Order.find({
      isVoided: false,
      createdAt: { $gte: range.from, $lte: range.to },
    }).sort({ createdAt: 1 });

    const { totals, byPayment, byCustomerType } = summarise(orders);

    res.status(200).json({
      success: true,
      data: {
        range: {
          period: range.period,
          label: range.label,
          from: range.from,
          to: range.to,
        },
        totals,
        byPayment,
        byCustomerType,
        series: buildSeries(orders, range),
        topDishes: buildTopDishes(orders),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Small figures for the home screen: today, this week, this month at a glance.
const getOverview = async (req, res, next) => {
  try {
    const now = new Date();

    const todayFrom = startOfDay(now);
    const weekFrom = startOfDay(now);
    weekFrom.setDate(weekFrom.getDate() - ((now.getDay() + 6) % 7));
    const monthFrom = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));

    const earliest = new Date(Math.min(todayFrom, weekFrom, monthFrom));

    const orders = await Order.find({
      isVoided: false,
      createdAt: { $gte: earliest, $lte: endOfDay(now) },
    }).sort({ createdAt: -1 });

    const sumFrom = (start) => {
      const scoped = orders.filter((o) => new Date(o.createdAt) >= start);
      return {
        orders: scoped.length,
        revenue: round2(scoped.reduce((sum, o) => sum + o.bills.total, 0)),
      };
    };

    res.status(200).json({
      success: true,
      data: {
        today: sumFrom(todayFrom),
        week: sumFrom(weekFrom),
        month: sumFrom(monthFrom),
        recentOrders: orders.slice(0, 8),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSalesReport, getOverview };
