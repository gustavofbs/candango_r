"""
Script para migrar dados do SQLite para PostgreSQL (Supabase)
Execute este script após configurar o DATABASE_URL no arquivo .env
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.core.management import call_command

def migrate_data():
    print("=" * 60)
    print("MIGRAÇÃO DE DADOS: SQLite → PostgreSQL (Supabase)")
    print("=" * 60)
    
    # 1. Criar tabelas no PostgreSQL
    print("\n[1/3] Criando tabelas no PostgreSQL...")
    call_command('migrate', '--run-syncdb')
    print("✓ Tabelas criadas com sucesso!")
    
    # 2. Exportar dados do SQLite
    print("\n[2/3] Exportando dados do SQLite...")
    
    # Verificar se existe db.sqlite3
    sqlite_path = os.path.join(os.path.dirname(__file__), 'db.sqlite3')
    if not os.path.exists(sqlite_path):
        print("⚠ Arquivo db.sqlite3 não encontrado. Pulando exportação de dados.")
        print("✓ Banco PostgreSQL está pronto para uso!")
        return
    
    # Fazer backup dos dados
    backup_file = 'data_backup.json'
    call_command('dumpdata', 
                 '--natural-foreign', 
                 '--natural-primary',
                 '--exclude=contenttypes',
                 '--exclude=auth.permission',
                 '--indent=2',
                 output=backup_file)
    print(f"✓ Dados exportados para {backup_file}")
    
    # 3. Importar dados no PostgreSQL
    print("\n[3/3] Importando dados no PostgreSQL...")
    call_command('loaddata', backup_file)
    print("✓ Dados importados com sucesso!")
    
    # Limpar arquivo de backup
    if os.path.exists(backup_file):
        os.remove(backup_file)
        print(f"✓ Arquivo temporário {backup_file} removido")
    
    print("\n" + "=" * 60)
    print("✓ MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
    print("=" * 60)
    print("\nSeus dados agora estão no Supabase.")
    print("Você pode deletar o arquivo db.sqlite3 se quiser.")

if __name__ == '__main__':
    try:
        migrate_data()
    except Exception as e:
        print(f"\n✗ Erro durante a migração: {e}")
        print("\nVerifique se:")
        print("1. O arquivo .env está configurado corretamente")
        print("2. A DATABASE_URL do Supabase está correta")
        print("3. Você tem conexão com a internet")
        sys.exit(1)
