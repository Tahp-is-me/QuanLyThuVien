from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    describe = models.TextField(null=True, blank=True)
    is_public = models.BooleanField(default=True)

    class Meta:
        db_table = 'categories'

    def __str__(self):
        return self.name

class Author(models.Model):
    name = models.CharField(max_length=100)
    gender = models.IntegerField(null=True, blank=True)
    describe = models.TextField(null=True, blank=True)
    is_public = models.BooleanField(default=True)

    class Meta:
        db_table = 'authors'

    def __str__(self):
        return self.name

class Book(models.Model):
    STATUS_CHOICES = (
        ('available', 'Available'),
        ('out_of_stock', 'Out of Stock')
    )
    name = models.CharField(max_length=255)
    author = models.ForeignKey(Author, on_delete=models.RESTRICT)
    category = models.ForeignKey(Category, on_delete=models.RESTRICT)
    quantity = models.IntegerField(default=0)
    public_date = models.DateField(null=True, blank=True)
    image_url = models.CharField(max_length=500, null=True, blank=True)
    is_public = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')

    class Meta:
        db_table = 'books'

    def __str__(self):
        return self.name