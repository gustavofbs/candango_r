from django.contrib.auth.models import User
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from .models import UserProfile
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer, ChangePasswordSerializer
)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('username')
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'list']:
            return [IsAdminUser()]
        if self.action in ['update', 'partial_update']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        if not request.user.is_staff and request.user != user:
            return Response({'detail': 'Sem permissão.'}, status=status.HTTP_403_FORBIDDEN)
        if not request.user.is_staff and 'is_staff' in request.data:
            return Response({'detail': 'Sem permissão para alterar privilégios.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request, pk=None):
        user = self.get_object()
        if not request.user.is_staff and request.user != user:
            return Response({'detail': 'Sem permissão.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if not request.user.is_staff:
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({'old_password': 'Senha atual incorreta.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Senha alterada com sucesso.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def set_permissions(self, request, pk=None):
        user = self.get_object()
        allowed_pages = request.data.get('allowed_pages', None)
        max_discount = request.data.get('max_discount', 0)
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.allowed_pages = allowed_pages
        profile.max_discount = int(max_discount)
        profile.save()
        serializer = UserSerializer(user)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reset_password(self, request, pk=None):
        user = self.get_object()
        new_password = request.data.get('new_password')
        if not new_password:
            return Response({'new_password': 'Este campo é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Senha redefinida com sucesso.'})
