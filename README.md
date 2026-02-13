# BriskLabs Order Widget

![Website Preview](https://github.com/brisklabs/order-widget-form/blob/main/widget-demo.png?raw=true)


A lightweight, customizable, embeddable **ordering form widget** for websites — perfect for small businesses, food stalls, cafes, services, or any setup that needs quick order collection (e.g. forwarded to Telegram or your backend).

- Floating action button (FAB) with **default SVG cart icon** (no text)
- Custom trigger support (use your own button/link — hides FAB)
- Product list or card view (configurable)
- Cart with quantity controls (+/−) and remove
- Real-time form validation (red border + shake + inline errors)
- Customer name, address, contact, notes form
- Currency formatting with commas & cents (₱1,234.50)
- Mobile-first: centered panel on phones
- Style isolation via Shadow DOM + `orw-` prefixed classes
- Optional order note banner

<br>

## Quick Embed Examples

### 1. Default FAB (with SVG cart icon)

```html
<script src="https://cdn.jsdelivr.net/gh/brisklabs/order-widget-form@latest/widget.js"
  async
  data-title="Place Your Order"
  data-submit-url="https://order-widget-dyno-api.brisklabs-dev.deno.net/" <-- Your API endpoint required -->
  data-button-color="#d97706"
  data-currency="₱"
  data-view="list"
  data-order-note="Orders are processed within 24 hours. Delivery available in Iloilo City only."
  data-products='[
    { "id": "halo", "name": "Premium Halo-halo", "price": 109.45, "image": "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=400", "description": "Ube ice cream, leche flan, red beans, sago, macapuno, pinipig – classic Pinoy goodness"},
    { "id": "flan", "name": "Leche Flan", "price": 50.34, "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400", "description": "Silky caramel custard made with fresh eggs and condensed milk"},
    { "id": "buko", "name": "Buko Juice", "price": 45.01, "image": "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400", "description": "Fresh young coconut water – naturally sweet and very refreshing"},
    { "id": "cake", "name": "Mango Float Cake", "price": 89.00, "image": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400", "description": "Creamy layered mango graham dessert served chilled"},
    { "id": "halo1", "name": "Classic Halo-halo", "price": 95.00, "image": null, "description": "Traditional shaved ice dessert with sweet beans, jelly, milk, and ube" }
    ]'
></script>
```

### 2. Custom trigger (hides default FAB)

```html
<button class="custom-order-btn">Order Now</button>

<script src="https://cdn.jsdelivr.net/gh/brisklabs/order-widget-form@latest/widget.js"
  data-custom-trigger=".custom-order-btn"
  data-title="Place Your Order"
  data-submit-url="https://order-widget-dyno-api.brisklabs-dev.deno.net/" 
  data-currency="₱"
  data-view="list"
  data-products='[...]'
></script>
```

<br>

## All Configuration Attributes

| Attribute              | Description                                      | Default              | Example / Notes                              |
|------------------------|--------------------------------------------------|----------------------|----------------------------------------------|
| `data-title`           | Widget header                                    | "Quick Order"        | "Place Your Order"                           |
| `data-submit-url`      | POST endpoint for order JSON                     | —                    | Required – your Deno backend                 |
| `data-currency`        | Currency symbol                                  | "₱"                  | "$", "€", "฿"                                |
| `data-position`        | FAB & panel position                             | "bottom-right"       | "bottom-left"                                |
| `data-button-color`    | FAB background color                             | "#2563eb"            | "#d97706" (amber)                            |
| `data-view`            | Default product view                             | "list"               | "list" or "card"                             |
| `data-custom-trigger`  | CSS selector for custom open button(s)           | — (uses default FAB) | ".order-btn", "#my-btn"                      |
| `data-order-note`      | Optional note banner text                        | —                    | "Delivery fee added on top"                    |
| `data-products`        | JSON array of products                           | —                    | See format below                             |

### Product object format

```json
[
  {
    "id": "halo",
    "name": "Premium Halo-halo",
    "price": 95,
    "image": "https://...jpg",      // optional
    "description": "Ube ice cream..."  // optional
  }
]
```

<br>

## Backend Integration (Deno Deploy Example)

Your widget sends this JSON payload:

```json
{
  "host": "brisklabs.dev",
  "customer": { "name": "...", "address": "...", "contact": "...", "notes": "..." },
  "items": [ { "id": "...", "name": "...", "price": 95, "quantity": 2 } ],
  "total": 235,
  "timestamp": "2025-02-14T04:47:00Z"
}
```

<br>

## Development

### Local testing

```bash
# Serve your HTML test page
npx serve .
# or
python -m http.server 8000
```

Open `index.html` in browser.

### Run backend locally (Deno)

```bash
deno run --allow-net --allow-env main.ts
```

Test endpoint:
```bash
curl -X POST http://localhost:8000 -H "Content-Type: application/json" -d '{...}'
```

<br>

## Security Notes

- Validate/sanitize all incoming data on backend
- Consider adding a per-company secret key check for your payload

<br>

## License

MIT License

Built with ❤️ by [BriskLabs](https://www.brisklabs.dev)  
Follow me on X: [@roger_molas](https://x.com/roger_molas)

