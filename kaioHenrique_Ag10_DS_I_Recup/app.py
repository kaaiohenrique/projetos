# Entrada (definição de variáveis e funções)

# Listas para salvar os dados (alunos, disciplinas e notas)
alunos = []
disciplinas = []
notas = []

# Cadastro de Disciplinas
qtd_disciplinas = int(input("Quantas disciplinas você vai cadastrar? "))

for i in range(qtd_disciplinas):
    disciplina = input(f"Digite o nome da disciplina {i+1}: ")
    disciplinas.append(disciplina)

# Cadastro de Alunos
qtd_alunos = int(input("Quantos alunos você vai cadastrar? "))

for i in range(qtd_alunos):
    aluno = input(f"Digite o nome do(a) aluno(a) {i+1}: ")
    alunos.append(aluno)

# Cadastro de Notas
for aluno in alunos:
    for disciplina in disciplinas:
        nota = float(input(f"Digite a nota do(a) aluno(a) {aluno} na disciplina {disciplina}: "))
        notas.append((aluno, disciplina, nota)) 

# Processamento
    # Sabemos que a partir da posição 2 da lista notas, temos as notas do aluno
    # Com isso, podemos calcular pela variável qtd_disciplinas
def calcular_media(alunos, disciplinas, notas):
    soma_notas = 0
    for nota in notas:
        soma_notas += nota[2]
    media = soma_notas/qtd_disciplinas
    return media

def situacao_final(media):
    if media >= 6:
        return "Aprovado"
    elif media >= 5:
        return "Recuperação"
    else:
        return "Reprovado"
    return situacao_final(media)

# Saída (Prints e geração de relatórios)
print("\nRelatório de Notas:")
