# Entrada (definição de variáveis e funções)

# Listas para salvar os dados (alunos, disciplinas e notas)
disciplinas = []
alunos = []
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

# Saída (Prints e geração de relatórios)

