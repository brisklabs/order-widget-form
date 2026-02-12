# BriskLabs Order Widget

A lightweight, customizable, embeddable **ordering form widget** for websites.  
Ideal for small businesses, food vendors, cafes, services, or any setup that needs quick order collection (e.g. forwarded to Telegram or your backend).

Features include:

- Floating action button (FAB) or **custom trigger** (your own button/link)
- Product display in **list** or **card** view
- Cart with quantity controls (+/−) and remove
- Customer name, contact, notes form
- One-click order submission (POST JSON to your endpoint)
- Mobile-first responsive design (centered panel on phones)
- Style isolation via Shadow DOM + prefixed classes (`orw-`)
- No external dependencies — pure vanilla JavaScript

<br>

## Quick Embed Examples

### 1. Default floating button

```html
<script src="https://cdn.jsdelivr.net/gh/yourusername/brisklabs-order-widget@latest/widget.js"
  async
  data-title="Place Your Order"
  data-submit-url="https://your-api.com/api/order"
  data-button-text="🛒 Order Now"
  data-button-color="#d97706"
  data-currency="₱"
  data-view="list"
  data-products='[
    {"id":"halo","name":"Premium Halo-halo","price":95,"image":null,"description":"Ube ice cream, leche flan, red beans, sago, macapuno, pinipig"},
    {"id":"flan","name":"Leche Flan","price":55,"image":"https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400","description":"Silky caramel custard made with fresh eggs and condensed milk"},
    {"id":"buko","name":"Buko Juice","price":45,"image":null,"description":"Fresh young coconut water – naturally sweet and very refreshing"}
  ]'
></script>
```

### 2. Use your own custom trigger button (hides default FAB)

```html
<button class="my-order-btn">Order Food</button>

<script src="./widget.js"
  async
  data-custom-trigger=".my-order-btn"
  data-title="Place Your Order"
  data-submit-url="https://your-api.com/api/order"
  data-currency="₱"
  data-products='[...]'
></script>
```

<br>

## All Configuration Attributes

| Attribute               | Description                                          | Default              | Example / Notes                              |
|-------------------------|------------------------------------------------------|----------------------|----------------------------------------------|
| `data-title`            | Header title of the widget                           | "Quick Order"        | "Place Your Order"                           |
| `data-submit-url`       | POST endpoint for order JSON                         | —                    | Required                                     |
| `data-currency`         | Currency symbol                                      | "₱"                  | "$", "€", "฿"                                |
| `data-position`         | FAB & panel position                                 | "bottom-right"       | "bottom-left"                                |
| `data-button-text`      | Text or emoji inside FAB                             | "🛒"                 | "Order Now", "🛍️ Book"                      |
| `data-button-color`     | FAB background color (hex)                           | "#2563eb"            | "#d97706" (amber)                            |
| `data-view`             | Default product view mode                            | "list"               | "list" or "card"                             |
| `data-custom-trigger`   | CSS selector(s) for custom open button(s)            | —                    | "#order-btn", ".trigger", "[data-open-order]"|
| `data-products`         | JSON array of products                               | —                    | See format below                             |

### Product object format

```json
{
  "id":        "halo",                     // required, unique string
  "name":      "Premium Halo-halo",        // required
  "price":     95,                         // required, number
  "image":     "https://...jpg",           // optional
  "description": "Ube ice cream, leche flan..."  // optional
}
```

<br>

## Development

### Local testing

```bash
# Serve the folder (VS Code Live Server, or)
npx serve .
# or
python -m http.server 8000
```

Open `index.html` in browser.

### Build / minify (optional)

```bash
# Using terser (install globally: npm i -g terser)
terser widget.js -o widget.min.js --compress --mangle
```

Then use `widget.min.js` in production.

<br>

## Security & Best Practices

- **Never** put Telegram bot tokens or API keys in the widget (keep them server-side)
- Validate and sanitize all incoming orders on your backend
- Consider adding rate limiting / CAPTCHA for public sites
- Use HTTPS for your `submit-url`

<br>

## Backend Example (Node.js / Python / PHP)

Your backend should accept a POST JSON payload like:

```json
{
  "customer": {
    "name": "Juan Dela Cruz",
    "contact": "juan@example.com",
    "notes": "Less ice please"
  },
  "items": [
    { "id": "halo", "name": "Premium Halo-halo", "price": 95, "quantity": 2 }
  ],
  "total": 190,
  "timestamp": "2025-02-13T12:34:56.789Z"
}
```

Then forward to Telegram, email, Google Sheet, database, etc.

<br>

## License

MIT License  
Feel free to use, modify, and distribute.

<br>

**Built with ❤️ by [BriskLabs](https://www.brisklabs.dev)**  
Questions or improvements? → [@roger_molas on X](https://x.com/roger_molas)
