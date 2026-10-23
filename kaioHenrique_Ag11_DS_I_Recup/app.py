# Sistema de Controle de níveis de água
# Autor: Kaio Henrique da Silva

# Importação da biblioteca e funções específicas
from colorama import Fore, Style

# Listas para armazenamento
niveis_agua = []
mensagens_situacao = []

# Boas vindas
print“Bem-vindo(a) ao Sistema de controle de níveis de água!”)

# Entrada
nivel_real = int(input(“\nDigite qual o nível da água do reservatório atualmente, em m3: ”))
niveis_agua.append(nivel_real)

# Processamento
def verificar_situacao(nivel_real):
    if nivel_real <= 1000:
        return “Nível 1 - Muito baixo (Crítico)”.
        mensagens_situacao.append(verificar_situacao)
    elif nivel_agua_real <= 5000:
        return “Nível 2 - Baixo”
mensagens_situacao.append(verificar_situacao)

    elif nivel_agua_real <= 10000:
        return “Nível 3 - Médio”
mensagens_situacao.append(verificar_situacao)

    elif nivel_agua_real <= 15000:
        return “Nível 4 - Alto”
mensagens_situacao.append(verificar_situacao)

    else:
        return “Nível 5 - Muito alto (Alerta)”

mensagens_situacao.append(verificar_situacao)

    return situacao_nivel

# Saída
print(f“\nNível do reservatório de abastecimento: {situacao_nivel}“)
print(Style.RESET_ALL)