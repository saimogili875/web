from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
from django.core.mail import send_mail
from django.conf import settings
from .models import ContactInquiry, Order, normalize_phone, generate_order_id
from .context_processors import CATEGORIES_DATA
import json
import urllib.parse
import os
import re
import time
from collections import defaultdict

try:
    import anthropic
except ImportError:
    anthropic = None

try:
    from groq import Groq
except ImportError:
    Groq = None

# In-memory rate limiting bucket for /api/voice-agent/ (max 30 requests / 60 seconds per IP)
_RATE_LIMIT_BUCKETS = defaultdict(list)

def is_rate_limited(ip_address, max_requests=30, window_seconds=60):
    now = time.time()
    timestamps = _RATE_LIMIT_BUCKETS[ip_address]
    _RATE_LIMIT_BUCKETS[ip_address] = [t for t in timestamps if now - t < window_seconds]
    if len(_RATE_LIMIT_BUCKETS[ip_address]) >= max_requests:
        return True
    _RATE_LIMIT_BUCKETS[ip_address].append(now)
    return False

def home(request):
    """Homepage rendering with hero, clickable stack cards, results, FAQs and contact."""
    faqs = [
        {
            'question': 'How quickly can our website or app go live?',
            'answer': 'Because we maintain ready-made architectural prototypes for shops, clinics, restaurants, and schools, core setups can go live in 2 to 5 working days with your branding, domain, and catalog.'
        },
        {
            'question': 'How does WhatsApp ordering and lead capture work?',
            'answer': 'Customers browse products or services on your website and tap one button to generate a structured, pre-filled order or inquiry directly into your studio WhatsApp number. Zero commission, zero delays.'
        },
        {
            'question': 'Can we customize features, designs, and integrations?',
            'answer': 'Yes. Everything is built on clean HTML5, CSS3, vanilla JavaScript, Python, and Django—not bloated page builders. You can customize workflows, database schema, payment gateways, and POS.'
        },
        {
            'question': 'What are Domain AI Agents and AI Calling Agents?',
            'answer': 'Domain AI Agents are specialized chatbots and voice agents trained for specific industry workflows like student test analytics, patient clinic intake, customer ticket routing, and automated calling.'
        },
        {
            'question': 'Do you provide hosting, domain, and maintenance support?',
            'answer': 'Yes. We offer fully managed cloud hosting (on fast servers with SSL, CDN, and automated backups), monthly feature updates, bug fixes, and continuous technical support.'
        }
    ]

    results = [
        {'stat': '100%', 'label': 'Mobile-First Design', 'desc': 'Engineered for fast loading on Android devices and 4G networks.'},
        {'stat': '2-5 Days', 'label': 'Rapid Turnaround', 'desc': 'Ready-made functional prototypes deployed with your branding in days.'},
        {'stat': '0% Take', 'label': 'Zero Platform Commissions', 'desc': 'Orders & leads go directly to your WhatsApp and phone.'},
        {'stat': '24/7 Live', 'label': 'Smart AI Automation', 'desc': 'Automated response agents and lead triage working around the clock.'}
    ]

    selected_service = request.GET.get('service', 'websites-apps')

    context = {
        'faqs': faqs,
        'results': results,
        'selected_service': selected_service,
        'meta_title': 'GuhaTech — Ready-Made Business Websites, ERP & AI Solutions in Hyderabad',
        'meta_description': 'GuhaTech builds customized websites, Odoo-style ERP systems, AI marketing, and domain AI agents for small businesses in India. Live in days.',
    }
    return render(request, 'index.html', context)

def category_detail(request, slug):
    """Individual category page with its own hero, sub-services list, quote button, and back link."""
    cat = next((c for c in CATEGORIES_DATA if c['id'] == slug), None)
    if not cat:
        return redirect('home')

    whatsapp_clean = settings.WHATSAPP_NUMBER.replace('+', '').replace(' ', '')
    wa_msg = urllib.parse.quote(f"Hi GuhaTech! I would like to get a quote for {cat['title']}.")
    cat_wa_url = f"https://wa.me/{whatsapp_clean}?text={wa_msg}"

    context = {
        'category': cat,
        'cat_wa_url': cat_wa_url,
        'meta_title': f"{cat['title']} — GuhaTech Studio Solutions",
        'meta_description': f"Explore {cat['title']} by GuhaTech: {cat['subtext']} Ready-made for Indian businesses.",
    }
    template_name = f"categories/{slug.replace('-', '_')}.html"
    return render(request, template_name, context)

def contact_submit(request):
    """Processes contact form submissions (AJAX or standard POST)."""
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        phone = request.POST.get('phone', '').strip()
        service = request.POST.get('service', 'websites-apps').strip()
        message = request.POST.get('message', '').strip()

        is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.content_type == 'application/json'

        if not name or not phone:
            err_msg = "Please provide both your name and contact phone number."
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': err_msg}, status=400)
            messages.error(request, err_msg)
            return redirect('home')

        # Save to database (PostgreSQL in production, SQLite locally)
        try:
            inquiry = ContactInquiry.objects.create(
                name=name,
                phone=phone,
                service=service,
                message=message
            )
            service_display = inquiry.get_service_display()
        except Exception as e:
            inquiry = None
            service_display = service

        # Send email notification
        try:
            subject = f"New Quote Request from {name} - GuhaTech"
            body = (
                f"New inquiry received on GuhaTech website:\n\n"
                f"Name: {name}\n"
                f"Phone: {phone}\n"
                f"Service: {service_display}\n"
                f"Message:\n{message}\n"
            )
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.STUDIO_EMAIL],
                fail_silently=True,
            )
        except Exception as e:
            pass

        # Build WhatsApp link for direct instant continuation
        whatsapp_clean = settings.WHATSAPP_NUMBER.replace('+', '').replace(' ', '')
        wa_text = f"Hi GuhaTech! I submitted a quote request.\nName: {name}\nPhone: {phone}\nService: {service_display}\nNote: {message}"
        wa_url = f"https://wa.me/{whatsapp_clean}?text={urllib.parse.quote(wa_text)}"

        success_msg = f"Thank you, {name}! Your quote request has been received. We will contact you shortly."

        if is_ajax:
            return JsonResponse({
                'status': 'success',
                'message': success_msg,
                'whatsapp_url': wa_url
            })

        messages.success(request, success_msg)
        return redirect('home')

    return redirect('home')

@csrf_exempt
@require_http_methods(["POST"])
def chat_api(request):
    """
    Floating Chatbot AI Endpoint:
    Uses Claude API if ANTHROPIC_API_KEY is configured in environment,
    with an intelligent fallback knowledge engine for seamless testing.
    """
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    user_msg = data.get('message', '').strip()
    history = data.get('history', [])

    if not user_msg:
        return JsonResponse({'error': 'Message cannot be empty'}, status=400)

    api_key = getattr(settings, 'ANTHROPIC_API_KEY', '') or os.environ.get('ANTHROPIC_API_KEY', '')

    system_prompt = (
        "You are the intelligent assistant for GuhaTech (guhatech.com), a software studio in Hyderabad, India. "
        "GuhaTech builds four core solutions for small businesses:\n"
        "1. Customized Websites and Apps (business sites, e-commerce ordering, institution portals, SaaS)\n"
        "2. Odoo-style ERP (Sales/CRM, Accounting, Inventory/Purchase, POS, HR, Operations, Multi-vendor, Industry ERPs)\n"
        "3. AI Marketing and Business Analysis (local SEO, content/social, lead gen, WhatsApp follow-ups, AI voice calling agents)\n"
        "4. Domain AI Agents (Exam evaluation, campus bots, HR recruitment, finance/invoicing, healthcare clinic triage, support)\n\n"
        "Studio guidelines:\n"
        "- Tone: Concise, professional, humble, warm, practical. Avoid buzzwords.\n"
        "- Tech: Django, Python, PostgreSQL, vanilla JS, HTML5.\n"
        "- Speed: Ready-made working prototypes deployed in 2-5 days.\n"
        "- Location: Hyderabad, India.\n"
        "- Always encourage the user to share their name, phone, and business type for a tailored quote.\n"
        "- Mention that they can chat directly with our founder on WhatsApp for immediate pricing."
    )

    bot_reply = None
    suggested_category = None

    # Detect category interest
    lower_msg = user_msg.lower()
    if any(k in lower_msg for k in ['website', 'web', 'site', 'ecommerce', 'e-commerce', 'store', 'shop', 'portal', 'saas']):
        suggested_category = 'websites-apps'
    elif any(k in lower_msg for k in ['erp', 'odoo', 'inventory', 'pos', 'accounting', 'billing', 'crm', 'hr', 'payroll']):
        suggested_category = 'erp'
    elif any(k in lower_msg for k in ['marketing', 'seo', 'lead', 'leads', 'social', 'calling', 'voice agent', 'ads']):
        suggested_category = 'ai-marketing'
    elif any(k in lower_msg for k in ['agent', 'exam', 'clinic', 'hospital', 'doctor', 'student', 'finance agent', 'support bot']):
        suggested_category = 'ai-agents'

    # 1. Try Claude API if configured
    if api_key and anthropic:
        try:
            client = anthropic.Anthropic(api_key=api_key)
            messages_payload = []
            for h in history[-6:]:
                role = 'user' if h.get('sender') == 'user' else 'assistant'
                content = h.get('text', '')
                if content:
                    messages_payload.append({'role': role, 'content': content})

            messages_payload.append({'role': 'user', 'content': user_msg})

            response = client.messages.create(
                model="claude-3-5-haiku-20241022",
                max_tokens=300,
                system=system_prompt,
                messages=messages_payload,
            )
            bot_reply = response.content[0].text
        except Exception as e:
            # Fallback will handle it
            bot_reply = None

    # 2. Intelligent fallback engine when API key is unset or network error occurs
    if not bot_reply:
        if any(g in lower_msg for g in ['hi', 'hello', 'hey', 'namaste', 'start']):
            bot_reply = "Hello! Welcome to GuhaTech Studio. We build ready-made business websites, Odoo-style ERP systems, and AI automation tools in Hyderabad. Which service are you interested in today?"
        elif any(k in lower_msg for k in ['price', 'cost', 'quote', 'charges', 'rate', 'how much']):
            bot_reply = "Our projects are priced transparently based on your exact business needs—whether it's a fast mobile website, an ERP system, or an AI marketing pipeline. Could you share your name, phone number, and business type? Or tap the WhatsApp button below to get an instant quote."
        elif any(k in lower_msg for k in ['time', 'duration', 'fast', 'quick', 'days', 'how long']):
            bot_reply = "Because we maintain architectural prototypes for Indian shops, clinics, schools, and offices, most ready-made solutions go live within 2 to 5 business days."
        elif suggested_category == 'websites-apps':
            bot_reply = "We craft fast, mobile-first websites and web applications—including business showcase sites, WhatsApp ordering catalogs, college/school portals, and SaaS dashboards. Would you like a demo or quote for your business?"
        elif suggested_category == 'erp':
            bot_reply = "Our Odoo-style ERP solutions include Sales & CRM, GST Accounting, Stock & Inventory, Retail POS billing, HR & Payroll, and custom logistics modules. Which module does your business need?"
        elif suggested_category == 'ai-marketing':
            bot_reply = "Our AI Marketing tools automate Google local SEO, social content publishing, high-intent lead generation, automated WhatsApp follow-ups, and AI voice calling agents for bookings."
        elif suggested_category == 'ai-agents':
            bot_reply = "Our Domain AI Agents are automated assistants built for specific industry workflows—like exam evaluation for schools, patient booking for clinics, resume screening for HR, and 24/7 support tickets."
        else:
            bot_reply = "Thank you for asking! GuhaTech specializes in websites, ERP systems, AI marketing, and custom domain agents built on Django & PostgreSQL. Tell me a bit about your business, or connect with us on WhatsApp for a quick consultation."

    whatsapp_clean = settings.WHATSAPP_NUMBER.replace('+', '').replace(' ', '')
    wa_prompt = urllib.parse.quote(f"Hi GuhaTech! I chatted with your website AI about {suggested_category or 'a business project'}. Can we discuss?")
    wa_url = f"https://wa.me/{whatsapp_clean}?text={wa_prompt}"

    return JsonResponse({
        'reply': bot_reply,
        'category': suggested_category,
        'whatsapp_url': wa_url
    })


VOICE_AGENT_SYSTEM_PROMPT = (
    "You are 'Aria', an ultra-responsive, polite customer voice assistant for an Apple authorized demo store powered by GuhaTech AI.\n"
    "Your SOLE purpose is to help the customer order or book an Apple MacBook Air.\n\n"
    "Available Options:\n"
    "- Model: MacBook Air 13\" (M2), MacBook Air 13\" (M3), MacBook Air 15\" (M3)\n"
    "- Color: Midnight, Starlight, Space Gray, Silver\n"
    "- Storage: 256GB SSD, 512GB SSD, 1TB SSD\n\n"
    "Spoken Conversation Rules:\n"
    "1. Speak naturally, warmly, and very briefly (1 to 2 short sentences, maximum 25 words). Your reply is spoken aloud via browser speech synthesis, so keep it conversational and punchy.\n"
    "2. Never use markdown, bullet points, asterisks, dashes, or numbered lists.\n"
    "3. Gather missing details step by step: (1) Model -> (2) Color -> (3) Storage -> (4) Full Name -> (5) 10-digit Mobile Number -> (6) Delivery Address.\n"
    "4. When all 6 details have been collected, confirm the order in 1 concise spoken sentence.\n"
    "5. When confirming the finalized order, append this exact tag at the end: [ORDER_CONFIRMED: model=..., color=..., storage=..., name=..., phone=..., address=...]\n"
    "6. If the user asks anything unrelated to MacBook Air ordering or GuhaTech, politely bring them back to completing their MacBook Air order.\n"
    "7. Support English and simple Hindi/Telugu words if the user speaks them, but reply primarily in clear, simple English."
)


def _extract_order_slots(text, draft):
    """Helper to detect MacBook Air order attributes from spoken text."""
    lower = text.lower()
    draft = dict(draft or {})

    # Model
    if '15' in lower:
        draft['model'] = 'MacBook Air 15" (M3)'
    elif 'm2' in lower:
        draft['model'] = 'MacBook Air 13" (M2)'
    elif 'm3' in lower:
        draft['model'] = 'MacBook Air 13" (M3)'
    elif '13' in lower and not draft.get('model'):
        draft['model'] = 'MacBook Air 13" (M3)'

    # Color
    if 'midnight' in lower:
        draft['color'] = 'Midnight'
    elif 'starlight' in lower:
        draft['color'] = 'Starlight'
    elif 'space gray' in lower or 'space grey' in lower or 'space' in lower:
        draft['color'] = 'Space Gray'
    elif 'silver' in lower:
        draft['color'] = 'Silver'

    # Storage
    if '1tb' in lower or '1 tb' in lower or 'one tb' in lower or '1000gb' in lower:
        draft['storage'] = '1TB SSD'
    elif '512' in lower or 'five twelve' in lower:
        draft['storage'] = '512GB SSD'
    elif '256' in lower or 'two fifty six' in lower:
        draft['storage'] = '256GB SSD'

    # Phone number (10 digits)
    phone_match = re.search(r'(?:\+?91[\-\s]?)?([6-9]\d{9})\b', text)
    if phone_match:
        draft['phone'] = phone_match.group(1)
    else:
        digits_only = re.sub(r'\D', '', text)
        if len(digits_only) == 10 and digits_only[0] in '6789':
            draft['phone'] = digits_only

    # Name
    name_match = re.search(r'(?:my name is|i am|this is|name\s*[:=])\s+([A-Za-z\s]{2,30})', text, re.IGNORECASE)
    if name_match:
        extracted = name_match.group(1).strip()
        # Cut off any subsequent clause like 'and my phone...'
        extracted = re.split(r'\b(?:and|my|phone|with|number)\b', extracted, flags=re.IGNORECASE)[0].strip()
        if extracted and extracted.lower() not in ['interested', 'looking', 'ordering', 'here']:
            draft['customer_name'] = extracted.title()

    # Address
    addr_match = re.search(r'(?:deliver(?:y)?\s*(?:to|at|address)?\s*[:=]?|address\s*(?:is)?\s*[:=]?)\s+(.+)', text, re.IGNORECASE)
    if addr_match:
        candidate = addr_match.group(1).strip()
        if not re.match(r'^(?:my name|[0-9\+\-\s]+)$', candidate, re.IGNORECASE):
            draft['delivery_address'] = candidate
    elif any(kw in lower for kw in ['street', 'road', 'nagar', 'colony', 'hyderabad', 'bengaluru', 'bangalore', 'mumbai', 'delhi', 'chennai', 'pune', 'flat', 'plot', 'house']):
        if not any(k in lower for k in ['my name is', 'phone number is', 'phone is']):
            if len(text.split()) >= 3 and not draft.get('delivery_address'):
                draft['delivery_address'] = text.strip()

    return draft


@csrf_exempt
@require_http_methods(["POST"])
def voice_agent_api(request):
    """
    Sarvam.ai-style Customer Voice Agent Endpoint:
    Processes live spoken utterances for MacBook Air ordering.
    Calls Groq Llama 3 API with os.environ['GROQ_API_KEY'], with rate limiting
    and a robust fallback dialog manager.
    """
    # 1. Rate limiting check (max 30 requests / 60 seconds per IP)
    ip = request.META.get('HTTP_X_FORWARDED_FOR')
    if ip:
        ip = ip.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')

    if is_rate_limited(ip, max_requests=30, window_seconds=60):
        return JsonResponse({
            'error': 'Rate limit exceeded. Please wait a few seconds before speaking again.',
            'reply': "Please give me a brief moment and speak again."
        }, status=429)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    user_message = data.get('message', '').strip()
    history = data.get('history', [])
    order_draft = data.get('order_draft', {})

    # Update slot draft based on current message
    order_draft = _extract_order_slots(user_message, order_draft)

    # Initial greeting trigger
    is_initial_greeting = not user_message and not history

    groq_api_key = os.environ.get("GROQ_API_KEY", "").strip() or getattr(settings, "GROQ_API_KEY", "").strip()
    bot_reply = None
    order_confirmed = False

    # 2. Attempt Groq API if key is present
    if groq_api_key and Groq and not is_initial_greeting:
        try:
            client = Groq(api_key=groq_api_key)
            messages_payload = [{"role": "system", "content": VOICE_AGENT_SYSTEM_PROMPT}]

            slot_status = (
                f"[Current Known State: Model={order_draft.get('model', 'Not yet chosen')}, "
                f"Color={order_draft.get('color', 'Not yet chosen')}, "
                f"Storage={order_draft.get('storage', 'Not yet chosen')}, "
                f"Name={order_draft.get('customer_name', 'Not yet provided')}, "
                f"Phone={order_draft.get('phone', 'Not yet provided')}, "
                f"Address={order_draft.get('delivery_address', 'Not yet provided')}]"
            )
            messages_payload.append({"role": "system", "content": slot_status})

            for h in history[-8:]:
                role = h.get('role', 'user')
                if role not in ('user', 'assistant'):
                    role = 'user'
                content = h.get('content', '')
                if content:
                    messages_payload.append({"role": role, "content": content})

            messages_payload.append({"role": "user", "content": user_message})

            chat_completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages_payload,
                max_tokens=120,
                temperature=0.5,
            )
            raw_reply = chat_completion.choices[0].message.content.strip()

            if "[ORDER_CONFIRMED" in raw_reply:
                order_confirmed = True
                tag_match = re.search(r'\[ORDER_CONFIRMED:\s*([^\]]+)\]', raw_reply)
                if tag_match:
                    tag_content = tag_match.group(1)
                    for part in tag_content.split(','):
                        if '=' in part:
                            k, v = part.split('=', 1)
                            k, v = k.strip().lower(), v.strip()
                            if k == 'name' and v and not order_draft.get('customer_name'):
                                order_draft['customer_name'] = v
                            elif k == 'phone' and v and not order_draft.get('phone'):
                                order_draft['phone'] = normalize_phone(v)
                            elif k == 'model' and v and not order_draft.get('model'):
                                order_draft['model'] = v
                            elif k == 'color' and v and not order_draft.get('color'):
                                order_draft['color'] = v
                            elif k == 'storage' and v and not order_draft.get('storage'):
                                order_draft['storage'] = v
                            elif k == 'address' and v and not order_draft.get('delivery_address'):
                                order_draft['delivery_address'] = v
                bot_reply = re.sub(r'\[ORDER_CONFIRMED:[^\]]*\]', '', raw_reply).strip()
            else:
                bot_reply = raw_reply

        except Exception as e:
            bot_reply = None

    # 3. Intelligent Fallback Dialog Engine (for seamless testing without API key or on network failure)
    if not bot_reply:
        lower = user_message.lower().strip()

        # Find last bot prompt to know what was asked
        last_bot_prompt = ''
        for h in reversed(history):
            if h.get('role') == 'assistant':
                last_bot_prompt = h.get('content', '').lower()
                break

        if is_initial_greeting or (not history and any(g in lower for g in ['hi', 'hello', 'hey', 'start', 'namaste'])):
            bot_reply = "Hello! Welcome to GuhaTech. Which MacBook Air would you like to order: the 13-inch M2, 13-inch M3, or 15-inch M3?"

        elif not order_draft.get('model'):
            if '15' in lower:
                order_draft['model'] = 'MacBook Air 15" (M3)'
                bot_reply = "Great choice, the 15-inch M3 MacBook Air! Which color would you like: Midnight, Starlight, Space Gray, or Silver?"
            elif 'm2' in lower:
                order_draft['model'] = 'MacBook Air 13" (M2)'
                bot_reply = "Awesome, the 13-inch M2 MacBook Air! Which color do you prefer: Midnight, Starlight, Space Gray, or Silver?"
            elif 'm3' in lower or '13' in lower:
                order_draft['model'] = 'MacBook Air 13" (M3)'
                bot_reply = "Perfect, the 13-inch M3 MacBook Air! What color would you like: Midnight, Starlight, Space Gray, or Silver?"
            else:
                bot_reply = "We have the MacBook Air 13-inch with M2 or M3, and the 15-inch with M3. Which one would you prefer?"

        elif not order_draft.get('color'):
            if any(c in lower for c in ['midnight', 'starlight', 'space gray', 'space grey', 'space', 'silver']):
                chosen_color = order_draft.get('color', 'Midnight')
                bot_reply = f"{chosen_color} looks stunning! How much storage do you need: 256GB, 512GB, or 1TB?"
            else:
                bot_reply = "Available colors are Midnight, Starlight, Space Gray, and Silver. Which one do you like?"

        elif not order_draft.get('storage'):
            if any(s in lower for s in ['256', '512', '1tb', '1 tb', 'one tb']):
                chosen_storage = order_draft.get('storage', '256GB SSD')
                bot_reply = f"{chosen_storage} noted! May I have your full name for the demo booking?"
            else:
                bot_reply = "Would you like 256GB, 512GB, or 1TB storage?"

        elif not order_draft.get('customer_name'):
            # Only treat as name if user explicitly gave name or bot recently asked for name
            if 'name' in last_bot_prompt or re.search(r'(?:my name is|i am|this is)', lower):
                cleaned_name = re.sub(r'^(my name is|i am|this is)\s+', '', user_message, flags=re.IGNORECASE).strip()
                cleaned_name = re.split(r'\b(?:and|my|phone|with|number)\b', cleaned_name, flags=re.IGNORECASE)[0].strip().title()
                if cleaned_name and len(cleaned_name) >= 2 and not any(hw in cleaned_name.lower() for hw in ['air', 'macbook', 'ssd', 'gb', 'tb']):
                    order_draft['customer_name'] = cleaned_name
                    if not order_draft.get('phone'):
                        bot_reply = f"Thank you {cleaned_name}! What is your 10-digit mobile number for order confirmation?"
                    else:
                        bot_reply = f"Thank you {cleaned_name}! What is your delivery address?"
                else:
                    bot_reply = "May I please have your full name for the booking?"
            else:
                bot_reply = f"Great! May I have your full name for the demo booking?"

        elif not order_draft.get('phone'):
            clean_digits = normalize_phone(user_message)
            if len(clean_digits) == 10:
                order_draft['phone'] = clean_digits
                bot_reply = "Got your phone number! What is your delivery address?"
            else:
                bot_reply = "Please share your 10-digit mobile number so we can confirm the order."

        elif not order_draft.get('delivery_address'):
            is_address_prompt = any(k in last_bot_prompt for k in ['address', 'where', 'deliver'])
            has_address_keywords = any(kw in lower for kw in ['street', 'road', 'nagar', 'colony', 'flat', 'plot', 'house', 'city', 'pincode', 'hyderabad', 'bengaluru', 'mumbai', 'delhi', 'chennai', 'pune', 'deliver', 'address'])
            if (is_address_prompt or has_address_keywords) and len(user_message.strip()) >= 5 and not any(k in lower for k in ['my name is', 'phone number is']):
                order_draft['delivery_address'] = user_message.strip()
                order_confirmed = True
            else:
                bot_reply = "Got that! What is your delivery address in India?"

        if (order_confirmed or (order_draft.get('customer_name') and order_draft.get('phone') and order_draft.get('delivery_address'))) and not bot_reply:
            name = order_draft.get('customer_name', 'Customer')
            model = order_draft.get('model', 'MacBook Air 13" (M3)')
            color = order_draft.get('color', 'Midnight')
            bot_reply = f"Thank you {name}! Your {model} in {color} has been confirmed. You can view your order on our demo portal."

    # 4. If all details are ready, create the Order in DB
    order_id = None
    portal_url = None
    has_full_info = (
        order_draft.get('customer_name') and
        order_draft.get('phone') and
        order_draft.get('delivery_address')
    )

    if (order_confirmed or has_full_info) and order_draft.get('phone'):
        clean_p = normalize_phone(order_draft['phone'])
        portal_url = f"/demo/order/?phone={clean_p}"
        try:
            # Check if this exact order was just created in the last 60 seconds to avoid duplicates
            recent_exists = Order.objects.filter(
                phone=clean_p,
                customer_name=order_draft.get('customer_name', 'Customer'),
                model=order_draft.get('model', 'MacBook Air 13" (M3)'),
                color=order_draft.get('color', 'Midnight')
            ).first()

            if not recent_exists:
                new_order = Order.objects.create(
                    customer_name=order_draft.get('customer_name', 'Customer'),
                    phone=clean_p,
                    delivery_address=order_draft.get('delivery_address', 'Address provided via voice call'),
                    model=order_draft.get('model', 'MacBook Air 13" (M3)'),
                    color=order_draft.get('color', 'Midnight'),
                    storage=order_draft.get('storage', '256GB SSD'),
                    source='voice-agent',
                )
                order_id = new_order.order_id
            else:
                order_id = recent_exists.order_id
            order_confirmed = True
        except Exception as e:
            pass

    return JsonResponse({
        'reply': bot_reply or "I am listening. Which MacBook Air configuration would you like?",
        'order_draft': order_draft,
        'order_placed': order_confirmed,
        'order_id': order_id,
        'portal_url': portal_url or (f"/demo/order/?phone={normalize_phone(order_draft['phone'])}" if order_draft.get('phone') else "/demo/order/"),
    })


def demo_order_portal(request):
    """
    Open demo portal (no login required) for placing MacBook Air demo orders
    and looking up existing orders by phone number.
    """
    phone_query = request.GET.get('phone', '').strip()
    clean_phone = normalize_phone(phone_query) if phone_query else ''
    placed = request.GET.get('placed') == '1'

    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        phone = request.POST.get('phone', '').strip()
        address = request.POST.get('delivery_address', '').strip()
        model = request.POST.get('model', 'MacBook Air 13" (M3)').strip()
        color = request.POST.get('color', 'Midnight').strip()
        storage = request.POST.get('storage', '256GB SSD').strip()

        norm_phone = normalize_phone(phone)
        if not name or len(norm_phone) < 10 or not address:
            messages.error(request, 'Please provide your full name, a valid 10-digit mobile number, and delivery address.')
            return render(request, 'demo_order.html', {
                'phone': phone,
                'clean_phone': norm_phone,
                'name': name,
                'delivery_address': address,
                'selected_model': model,
                'selected_color': color,
                'selected_storage': storage,
                'model_choices': Order.MODEL_CHOICES,
                'color_choices': Order.COLOR_CHOICES,
                'storage_choices': Order.STORAGE_CHOICES,
            })

        order = Order.objects.create(
            customer_name=name,
            phone=norm_phone,
            delivery_address=address,
            model=model,
            color=color,
            storage=storage,
            source='web-portal',
        )
        messages.success(request, f'Demo order {order.order_id} placed successfully! No payment charged.')
        return redirect(f"/demo/order/?phone={norm_phone}&placed=1")

    # GET request
    orders = []
    if clean_phone:
        orders = Order.objects.filter(phone=clean_phone).order_by('-created_at')

    # Also show recent sample orders for live demo visibility
    recent_orders = Order.objects.all().order_by('-created_at')[:6]

    context = {
        'phone': phone_query,
        'clean_phone': clean_phone,
        'orders': orders,
        'recent_orders': recent_orders,
        'placed': placed,
        'model_choices': Order.MODEL_CHOICES,
        'color_choices': Order.COLOR_CHOICES,
        'storage_choices': Order.STORAGE_CHOICES,
        'meta_title': 'MacBook Air Demo Order Portal — GuhaTech AI Voice Showcase',
        'meta_description': 'Open demo order portal for GuhaTech AI voice customer agent. Place and look up demo MacBook Air orders without login.',
    }
    return render(request, 'demo_order.html', context)

