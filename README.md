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
  data-submit-url="your-api-endpoint"
  data-button-color="#d97706"
  data-currency="₱"
  data-view="list"
  data-order-note="Orders are processed within 24 hours."
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
  data-submit-url="your-api-endpoint" 
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
| `data-submit-url`      | POST endpoint for order JSON                     | —                    | Required – your API backend                 |
| `data-currency`        | Currency symbol                                  | "₱"                  | "$", "€", "฿"                                |
| `data-position`        | FAB & panel position                             | "bottom-right"       | "bottom-left"                                |
| `data-button-color`    | FAB background color                             | "#2563eb"            | "#d97706" (amber)                            |
| `data-view`            | Default product view                             | "list"               | "list" or "card"                             |
| `data-custom-trigger`  | CSS selector for custom open button(s)           | — (uses default FAB) | ".order-btn", "#my-btn"                      |
| `data-order-note`      | Optional note banner text                        | —                    | "Delivery fee added on top"                    |
| `data-products`        | JSON array of products                           | —                    | See format below                             |

### Product object format plain

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
### Product object format for group
```json
[
  {
    "type": "Breakfast",
    "items": [
      {
        "id": "rice-egg",
        "name": "Rice with Egg",
        "price": 65.00,
        "image": "https://norecipes.com/wp-content/uploads/2018/08/tosilog-recipe-004.jpg",
        "description": "Steamed white rice served with perfectly cooked sunny-side-up egg – simple, hearty Filipino breakfast"
      }
    ]
  },
  {
    "type": "Lunch",
    "items": [
      {
        "id": "adobo",
        "name": "Chicken Adobo",
        "price": 145.00,
        "image": "https://thumbs.dreamstime.com/b/close-up-bowl-rice-chicken-adobo-filipino-food-generative-ai-278459301.jpg",
        "description": "Tender chicken cooked in soy sauce, vinegar, garlic, and spices – classic Filipino comfort food"
      },
      {
        "id": "steamed-fish",
        "name": "Steamed Fish",
        "price": 135.00,
        "image": "https://www.allrecipes.com/thmb/f_2MwcnL5O3h9BOvOUW2iVN19PI=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/140570-steamed-fish-with-ginger-JF-R309054_14177_4x3-3da7923d8ae3416594f15599301c8147.jpg",
        "description": "Fresh fish steamed with ginger, onions, and soy sauce – light, healthy, and flavorful"
      }
    ]
  }
]
```

<br>

## Backend Integration (Sample payload send to server)

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

## Security Notes

- Validate/sanitize all incoming data on backend
- Consider adding a per-company secret key check for your payload

<br>

## License

MIT License

Built with ❤️ by [BriskLabs](https://www.brisklabs.dev)  
Follow me on X: [@roger_molas](https://x.com/roger_molas)

