# Arkshar — Frontend Website

Clean, modern, mobile-first frontend for **Arkshar**, an Indian software studio that builds ready-made websites, Odoo-style ERP systems, AI marketing pipelines, and domain AI agents for small businesses, publishing one new prototype every working day with an Instagram reel.

---

## 🚀 Tech Stack & Design System

- **Core**: Semantic HTML5, Modular CSS3, Vanilla JavaScript (ES6+).
- **No dependencies / No build step**: Runs directly in any browser and can be served via static file servers or integrated directly into Django templates.
- **Palette**:
  - Deep Navy (`#0F2747`, `#08172B`) — studio base and dark accents.
  - Pure White & Slate (`#FFFFFF`, `#F8FAFC`, `#E2E8F0`) — plenty of clean white space.
  - Warm Saffron (`#F59E0B`, hover `#D97706`) — buttons, highlights, badges.
- **Typography**: Modern sans-serif wordmark **Arkshar** (Google Font: *Plus Jakarta Sans*).
- **Responsive & Mobile-First**: Built specifically for visitors arriving from Instagram on mobile phones.
- **Floating WhatsApp**: Floating action button with pulse beacon available on every page.

---

## 📁 Folder Structure

```
/
├── index.html              # Home page (Hero, Today's prototype strip, 4 lines, top 6 grid, 3 steps, pricing preview, CTA)
├── catalog.html            # Dynamic catalog (Filter by Type & Industry, real-time search, counter, reset)
├── solutions.html          # Deep dive into the 4 product lines with sub-categories
├── pricing.html            # Starter, Growth, Full plan cards & Monthly Care (hosting, maintenance, support)
├── contact.html            # Interactive quote request form (frontend validated), WhatsApp and Instagram links
├── README.md               # Project guide and Django migration instructions
├── css/
│   └── styles.css          # Design tokens (CSS variables), typography, layout, animations, components
├── js/
│   ├── main.js             # Mobile nav drawer, sticky header, home page prototype loader, modal controllers, quote form validator
│   └── catalog.js          # Catalog dynamic filter engine (Type pills, Industry select, search filter, empty state)
├── data/
│   └── prototypes.json     # 10 sample prototype definitions
└── assets/
    ├── icons/              # Lightweight SVG icons (whatsapp, instagram, play, external, check, arrow-right)
    └── prototypes/         # Crisp, high-DPI SVG card mockups (salon, kirana, clinic, school, gym, bakery, etc.)
```

---

## 📝 How to Add a New Prototype

Arkshar releases **one new prototype every working day**. To publish a new prototype on both the Home page and the Catalog, simply append an entry to `data/prototypes.json`:

```json
{
  "id": "proto-11",
  "name": "AyurCare Herbal Clinic OPD",
  "type": "Business site",
  "industry": "Healthcare",
  "description": "Herbal therapy appointment booking flow with dosha intake form and automated WhatsApp slot reminders.",
  "demoUrl": "#demo-ayurcare",
  "reelUrl": "https://instagram.com/reel/#ayurcare",
  "image": "assets/prototypes/clinic.svg",
  "day": "Day 49",
  "badge": "New Release"
}
```

### Field Definitions:
- `id`: Unique identifier (e.g., `proto-11`).
- `name`: Name of the prototype app.
- `type`: Must match one of the standard filter types (`Business site`, `E-commerce`, `Institution portal`, `SaaS`).
- `industry`: Business category (e.g., `Healthcare`, `Salon & Beauty`, `Education`, `Food & Beverage`, `Fitness & Sports`, `Grocery & Retail`). The catalog's industry dropdown auto-populates from this field!
- `description`: 1–2 sentence value proposition tailored for Indian MSMEs.
- `demoUrl`: Live demo URL or placeholder anchor (`#demo-...`).
- `reelUrl`: Instagram reel link (e.g., `https://instagram.com/reel/#...`).
- `image`: Relative path to the preview thumbnail SVG or screenshot in `assets/prototypes/`.
- `day`: Display tag (e.g., `Day 49`).
- `badge`: Optional callout badge (e.g., `New Release`, `Trending`, `Latest Reel`).

---

## 🐍 Moving into Django Templates

Because this project is built using semantic HTML, pure CSS, and vanilla JS without build tools, porting it into a Django project takes just a few minutes:

### Step 1: Copy Static Assets
Copy the folders to your Django app's `static/` directory:
```
my_django_project/
├── myapp/
│   ├── static/
│   │   └── myapp/
│   │       ├── css/styles.css
│   │       ├── js/main.js
│   │       ├── js/catalog.js
│   │       ├── data/prototypes.json
│   │       └── assets/
```

### Step 2: Create a `base.html` Template
Extract the common `<header>`, `<footer`, floating WhatsApp button, and `<head>` tags into `templates/myapp/base.html`:
```html
{% load static %}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{% block title %}Arkshar — Ready-made business apps, live in days{% endblock %}</title>
  <link rel="stylesheet" href="{% static 'myapp/css/styles.css' %}">
  <!-- Fonts & Meta tags -->
</head>
<body>
  {% include 'myapp/includes/header.html' %}
  
  <main id="main-content">
    {% block content %}{% endblock %}
  </main>

  {% include 'myapp/includes/floating_whatsapp.html' %}
  {% include 'myapp/includes/footer.html' %}

  <script src="{% static 'myapp/js/main.js' %}"></script>
  {% block extra_js %}{% endblock %}
</body>
</html>
```

### Step 3: Convert HTML Pages to Django Templates
For each page (`index.html`, `catalog.html`, `solutions.html`, `pricing.html`, `contact.html`), extend `base.html`:
```html
{% extends 'myapp/base.html' %}
{% load static %}

{% block title %}Prototype Catalog — Arkshar Studio{% endblock %}

{% block content %}
  <!-- Content from catalog.html -->
{% endblock %}

{% block extra_js %}
  <script src="{% static 'myapp/js/catalog.js' %}"></script>
{% endblock %}
```

### Step 4: Wire Views & URLs
In `myapp/views.py`:
```python
from django.shortcuts import render

def home(request):
    return render(request, 'myapp/index.html')

def catalog(request):
    return render(request, 'myapp/catalog.html')

def solutions(request):
    return render(request, 'myapp/solutions.html')

def pricing(request):
    return render(request, 'myapp/pricing.html')

def contact(request):
    return render(request, 'myapp/contact.html')
```

In `myapp/urls.py`:
```python
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('catalog/', views.catalog, name='catalog'),
    path('solutions/', views.solutions, name='solutions'),
    path('pricing/', views.pricing, name='pricing'),
    path('contact/', views.contact, name='contact'),
]
```

*(Optional)* You can later replace `prototypes.json` with a Django model `Prototype` and pass the queryset to the view or serialize it to JSON via `JsonResponse`.

---

## 💻 Local Preview

Run Python's built-in HTTP server from the root directory:

```bash
python3 -m http.server 3000
```

Open [http://localhost:3000](http://localhost:3000) in your web browser or mobile emulator.

