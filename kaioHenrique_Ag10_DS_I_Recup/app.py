# Sistema de cálculo de notas dos alunos
# Autor: Kaio Henrique da Silva

# Entrada

# Banco de dados (listas e dicionários)
disciplinas = [] # Armazenamento das disciplinas
alunos = [] # Armazenamento dos nomes dos alunos
notas = {} # Uso do dicionário recomendado pela IA

# Definição de média mínima para aprovação
media_minima = 6.0 # Média mínima para aprovação

# Funções
def calcular_media(notas):
    return sum(notas) / len(notas) # sum para somar as notas e len para dividir pela quantidade de disciplinas, fazendo assim a média das notas

def verificar_situacao(media):
    if media >= media_minima:
        return "Aprovado"
    else:
        return "Reprovado"

def gerar_relatorio(alunos, disciplinas, notas):
    print("\nRELATÓRIO DE DESEMPENHO DOS ALUNOS")
    for aluno in alunos:
        notas_aluno = notas[aluno]
        
        media = calcular_media(notas_aluno)
        situacao = verificar_situacao(media)
        
        print(f"\nAluno(a): {aluno}")
        
        for i in range(len(disciplinas)):
            print(f"• {disciplinas[i]}: {notas[aluno][i]:.1f}")
        
        print(f"\nMédia Geral: {media:.1f}")
        print(f"\nSituação: {situacao}")

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
print("\n--- Lançamento de Notas ---")
for aluno in alunos:
    notas[aluno] = [] 
    
    for disciplina in disciplinas:
        nota = float(input(f"Digite a nota do(a) aluno(a) {aluno} na disciplina {disciplina}: "))
        notas[aluno].append(nota)

# Saída
gerar_relatorio(alunos, disciplinas, notas)