from django.db import models

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
