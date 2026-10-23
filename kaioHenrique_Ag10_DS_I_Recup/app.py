# Sistema de cálculo de notas dos alunos
# Autor: Kaio Henrique da Silva

# ENTRADA

# Banco de dados (listas e dicionários)
disciplinas = [] # Armazenamento das disciplinas
alunos = [] # Armazenamento dos nomes dos alunos
notas = {} # Uso do dicionário recomendado pela IA

# Definição de média mínima para aprovação
media_minima = 6.0 # Média mínima para aprovação

# Funções
def calcular_media(notas): # Função para calcular a média das notas dos alunos
    return sum(notas) / len(notas) # sum para somar as notas e len para dividir pela quantidade de disciplinas, fazendo assim a média das notas

def verificar_situacao(media): # Função para verificar a situação (se o aluno foi aprovado ou reprovado) de acordo com a média
    if media >= media_minima:
        return "Aprovado"
    else:
        return "Reprovado" # Uso do if e else para verfificar a situação de acordo com a média

def gerar_relatorio(alunos, disciplinas, notas): # Função de geração do relatório final com todos os alunos, notas de cada discipla, média final e situação final
    print("\nRELATÓRIO DE DESEMPENHO DOS ALUNOS")
    for aluno in alunos: # Percorre a lista de alunos
        notas_aluno = notas[aluno] # Criação da variável notas_aluno para armazenar as notas do aluno (que é usado como chave do dicionário)
        
        media = calcular_media(notas_aluno) # Chamada da função e definição da variável media para armazenar a média das notas do aluno
        situacao = verificar_situacao(media) # Chamada da função e definição da variável situacao para armazenar a situação do aluno
        
        print(f"\nAluno(a): {aluno}") # Mostra o nome do aluno apresentado
        
        for i in range(len(disciplinas)): # Percorre a lista de notas e disciplinas do aluno que está sendo apresentado no relatório
            print(f"• {disciplinas[i]}: {notas[aluno][i]:.1f}") # Lista as ntoas de cada disicplina do aluno apresentado
        
        print(f"\nMédia Geral: {media:.1f} - Situação: {situacao}") # Média geral (de todas as disciplinas) e situação final. limitado a 1 casa decimal com :.1f

# Cadastro de Disciplinas
qtd_disciplinas = int(input("Quantas disciplinas você vai cadastrar? ")) # Definição de quantidade como parâmetro do range
for i in range(qtd_disciplinas): # Repete o cadastro de disciplinas de acordo com a quantidade definida
    disciplina = input(f"Digite o nome da disciplina {i+1}: ") # Cadastro das disciplinas
    disciplinas.append(disciplina) # Adiciona a diciplina na lista de disciplinas

# Cadastro de Alunos
qtd_alunos = int(input("Quantos alunos você vai cadastrar? ")) # Definição de quantidade como parâmetro do range
for i in range(qtd_alunos): # Repete o cadastro de alunos de acordo com a quantidade definida
    aluno = input(f"Digite o nome do(a) aluno(a) {i+1}: ") # Cadastro dos alunos
    alunos.append(aluno) # Adiciona o nome do aluno na lista de alunos

# Cadastro de Notas
print("\n--- Lançamento de Notas ---") # Módulo para lançamento das notas dos alunos nas disciplinas
for aluno in alunos: # Percorre a lista de alunos
    notas[aluno] = [] # criação da lista para salvar as notas de cada aluno no dicionário pelo nome do aluno como chave
    
    for disciplina in disciplinas: # Percorre a lista de disciplinas
        nota = float(input(f"Digite a nota do(a) aluno(a) {aluno} na disciplina {disciplina}: ")) # Cadastro das notas listando os alunos e as disciplinas
        notas[aluno].append(nota) # adiciona a nota na lista de notas do aluno (que migra para o dicionário ao final do lançamento de notas)

# SAÍDA
gerar_relatorio(alunos, disciplinas, notas) # Gera o relatório com todos os alunos e disciplinas, coforme a função definida