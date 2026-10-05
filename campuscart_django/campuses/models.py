from django.db import models


class Campus(models.Model):
    """
    A verified college, university, or educational institution.

    Users register against a campus so that CampusCart can surface listings
    from people within the same institution — the core trust mechanic.
    """
    name    = models.CharField(max_length=255, db_index=True)
    city    = models.CharField(max_length=100, blank=True, default='')
    state   = models.CharField(max_length=100, blank=True, default='')
    country = models.CharField(max_length=100, default='India')
    aicte_id = models.CharField(max_length=50, blank=True, null=True,
                                help_text='AICTE permanent ID if available')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['state', 'city', 'name']

    def __str__(self):
        return f"{self.name} — {self.city}, {self.state}"
