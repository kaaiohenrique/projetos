# Sistema de Controle de níveis de água
# Autor: Kaio Henrique da Silva

# Importação da biblioteca e funções específicas
from colorama import Fore, Style

# Lista para armazenamento
niveis_agua = []

# Boas vindas
print("Bem-vindo(a) ao Sistema de controle de níveis de água!")

# Entrada
nivel_real = int(input("\nDigite qual o nível da água do reservatório atualmente, em m3: "))
niveis_agua.append(nivel_real)

# Processamento
def verificar_situacao(nivel):
    if nivel < 100:
        return Fore.RED + "Nível muito baixo! Situação crítica."
    elif nivel < 500:
        return Fore.YELLOW + "Nível baixo. Atenção necessária."
    elif nivel < 1000:
        return Fore.GREEN + "Nível médio. Mantenha o reservatório sempre abastecido."
    elif nivel < 1500:
        return Fore.CYAN + "Nível alto! Mantenha o reservatório nesse estado."
    else:
        return Fore.BLUE + "Nível muito alto! Atenção para possíveis transbordamentos."

# Saída
print("\n------------ Situação do reservatório -----------")
print(verificar_situacao(nivel_real) + Style.RESET_ALL)