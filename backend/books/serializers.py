from rest_framework import serializers
from .models import Book, Author, Category

class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = '__all__'

    def validate_name(self, value):
        # Không trùng name check cả 2 TH của is_public
        if self.instance is None:  # Trường hợp Create
            if Author.objects.filter(name__iexact=value).exists():
                raise serializers.ValidationError("Tên tác giả đã tồn tại.")
        else:  # Trường hợp Update
            if Author.objects.filter(name__iexact=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("Tên tác giả đã tồn tại.")
        return value

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        
    def validate_name(self, value):
        if self.instance is None:
            if Category.objects.filter(name__iexact=value).exists():
                raise serializers.ValidationError("Tên thể loại đã tồn tại.")
        else:
            if Category.objects.filter(name__iexact=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("Tên thể loại đã tồn tại.")
        return value

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = '__all__'

    def validate(self, data):
        # 1. Ràng buộc số lượng không âm
        quantity = data.get('quantity', self.instance.quantity if self.instance else 0)
        if quantity < 0:
            raise serializers.ValidationError({"quantity": "Số lượng không được âm."})
        
        # 2. Tự động set status dựa trên quantity
        data['status'] = 'out_of_stock' if quantity == 0 else 'available'
            
        # 3. Check author_id, category_id có is_public = true ko
        author = data.get('author', self.instance.author if self.instance else None)
        category = data.get('category', self.instance.category if self.instance else None)
        
        if author and not author.is_public:
            raise serializers.ValidationError({"author": "Tác giả này không công khai."})
        if category and not category.is_public:
            raise serializers.ValidationError({"category": "Thể loại này không công khai."})

        # 4. Check trùng tên sách
        name = data.get('name')
        if name:
            query = Book.objects.filter(name__iexact=name)
            if self.instance:
                query = query.exclude(id=self.instance.id)
            if query.exists():
                raise serializers.ValidationError({"name": "Tên sách đã tồn tại."})

        return data