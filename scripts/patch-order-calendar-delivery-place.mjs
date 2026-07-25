import fs from "node:fs";

const file = "src/pages/admin/AdminHomePage.tsx";
let text = fs.readFileSync(file, "utf8");

const supplierDisplay = '{item.quantity ?? "-"}{item.unit || ""} / {item.supplier || item.delivery_place || item.usage_place || "発注"}';
const deliveryDisplay = '{item.quantity ?? "-"}{item.unit || ""} / 配送先：{item.delivery_place || item.usage_place || "未設定"}';

if (text.includes(supplierDisplay)) {
  text = text.replaceAll(supplierDisplay, deliveryDisplay);
}

fs.writeFileSync(file, text);
console.log("patched order calendar delivery place display");
