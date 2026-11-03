from django.contrib import admin
from .models import ContactInquiry

@admin.register(ContactInquiry)
class ContactInquiryAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'service', 'created_at', 'is_contacted')
    list_filter = ('service', 'is_contacted', 'created_at')
    search_fields = ('name', 'phone', 'message')
    readonly_fields = ('created_at',)
