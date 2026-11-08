import random
import re
from django.db import models


def normalize_phone(phone_input):
    """Normalize phone number to standard 10 digits."""
    if not phone_input:
        return ""
    digits = re.sub(r'\D', '', str(phone_input))
    if len(digits) == 12 and digits.startswith('91'):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith('0'):
        digits = digits[1:]
    return digits[-10:] if len(digits) >= 10 else digits


def generate_order_id():
    return f"ORD-{random.randint(10000, 99999)}"


class Order(models.Model):
    """MacBook Air Demo Order placed via Voice Agent or Open Portal."""
    MODEL_CHOICES = [
        ('MacBook Air 13" (M2)', 'MacBook Air 13" (M2)'),
        ('MacBook Air 13" (M3)', 'MacBook Air 13" (M3)'),
        ('MacBook Air 15" (M3)', 'MacBook Air 15" (M3)'),
    ]
    COLOR_CHOICES = [
        ('Midnight', 'Midnight'),
        ('Starlight', 'Starlight'),
        ('Space Gray', 'Space Gray'),
        ('Silver', 'Silver'),
    ]
    STORAGE_CHOICES = [
        ('256GB SSD', '256GB SSD'),
        ('512GB SSD', '512GB SSD'),
        ('1TB SSD', '1TB SSD'),
    ]

    order_id = models.CharField(max_length=24, unique=True, default=generate_order_id, editable=False)
    customer_name = models.CharField(max_length=150, help_text="Customer full name")
    phone = models.CharField(max_length=20, db_index=True, help_text="10-digit mobile number")
    delivery_address = models.TextField(help_text="Delivery address in India")
    model = models.CharField(max_length=100, choices=MODEL_CHOICES, default='MacBook Air 13" (M3)')
    color = models.CharField(max_length=50, choices=COLOR_CHOICES, default='Midnight')
    storage = models.CharField(max_length=50, choices=STORAGE_CHOICES, default='256GB SSD')
    quantity = models.PositiveIntegerField(default=1)
    total_amount = models.CharField(max_length=50, default='₹1,14,900 (Demo)')
    status = models.CharField(max_length=50, default='Confirmed (Demo)')
    source = models.CharField(max_length=50, default='voice-agent', help_text="voice-agent or web-portal")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Demo Order'
        verbose_name_plural = 'Demo Orders'

    def save(self, *args, **kwargs):
        if not self.order_id:
            self.order_id = generate_order_id()
        self.phone = normalize_phone(self.phone)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.order_id} - {self.customer_name} ({self.model}, {self.color}) - {self.phone}"


class ContactInquiry(models.Model):
    SERVICE_CHOICES = [
        ('websites-apps', '1. Customized Websites and Apps'),
        ('erp', '2. Odoo-style ERP'),
        ('ai-marketing', '3. AI Marketing and Business Analysis'),
        ('ai-agents', '4. Domain AI Agents'),
        ('general', 'General Consultation / Other'),
    ]

    name = models.CharField(max_length=150, help_text="Client full name")
    phone = models.CharField(max_length=50, help_text="Client contact number or WhatsApp")
    service = models.CharField(max_length=50, choices=SERVICE_CHOICES, default='websites-apps')
    message = models.TextField(blank=True, help_text="Project requirements or questions")
    created_at = models.DateTimeField(auto_now_add=True)
    is_contacted = models.BooleanField(default=False, help_text="Mark when follow-up is completed")

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Contact Inquiry'
        verbose_name_plural = 'Contact Inquiries'

    def __str__(self):
        return f"{self.name} ({self.get_service_display()}) - {self.phone}"
