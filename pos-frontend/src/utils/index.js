// Money is shown without trailing ".00" so a Rs 1,250 bill reads naturally,
// but keeps 2 decimals whenever there actually are cents.
export const formatMoney = (amount, symbol = "Rs") => {
  const value = Number(amount) || 0;
  const isWhole = Math.abs(value % 1) < 0.005;

  const formatted = value.toLocaleString("en-LK", {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return `${symbol} ${formatted}`;
};

export const getAvatarName = (name) => {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

export const formatDate = (date) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const d = new Date(date);
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
};

export const formatDateAndTime = (date) =>
  new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

export const formatTime = (date) =>
  new Date(date).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

export const greetingFor = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

/**
 * Shrinks a photo the admin picked before it is sent to the server.
 * Menu photos are stored inside the database, so keeping them small matters:
 * a 4 MB phone picture becomes roughly 40 KB with no visible difference at the
 * size the menu tiles actually display it.
 */
export const compressImage = (file, { maxSize = 600, quality = 0.75 } = {}) =>
  new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file selected."));
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Please choose an image file."));
    }

    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Could not read that file."));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error("That file is not a valid image."));

      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        // White backing so transparent PNGs do not turn black as JPEG.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });

// Stored payment values are short codes; this is how they read to a person.
const paymentLabels = { Cash: "Cash", Card: "Card", QR: "QR Scan" };

export const paymentLabel = (method) => paymentLabels[method] || method || "";

/**
 * Today's date as YYYY-MM-DD, in the shop's own timezone.
 *
 * Deliberately not `toISOString()`, which converts to UTC first. Sri Lanka is
 * UTC+5:30, so between midnight and 05:30 local that returns yesterday, and
 * the Bills page would open on the wrong day just as the shop closes up and
 * goes to check the day's takings.
 */
export const todayISO = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
