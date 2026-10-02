# Programa de pesquisa de satisfação TudoWeb
# Autor: Kaio Henrique da Silva

print("Bem-vindo(a) a pesquisa de satisfação TudoWeb!")

# Inicialização das variáveis fora do loop
excelente = 0
bom = 0
ruim = 0

# Sequência
for sequencia in range(1, 51):
    print(f"\nAvaliador(a) {sequencia} de 50: ")

    # Variáveis
    nome = input("Qual o seu nome? ")
    idade = int(input("Qual a sua idade? "))
    print_avaliacao = "Agradecemos a preferência! Avaliação computada com sucesso."

    # Avaliação
    opiniao = input("Por favor, avalie nosso atendimento com uma escala de 1 a 3, sendo 1 - Excelente, 2 - Bom e 3 - Ruim: ").strip().lower()

    match opiniao:
        case "1" | "excelente":
            print(f"{print_avaliacao}")
            excelente += 1
        case "2" | "bom":
            print(f"{print_avaliacao}")
            bom += 1
        case "3" | "ruim":
            print(f"{print_avaliacao}")
            ruim += 1 
        case _:
            print("Por favor, selecione uma das 3 opções acima!")

# Contador final (fora do loop)
print("\nResultado geral da Pesquisa: ")
print(f"Respostas “EXCELENTE”: {excelente}")
print(f"Respostas “RUIM”: {ruim}")