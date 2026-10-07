nome = input("Digite seu nome, astronauta: ")
print(f"Bem-vindo(a) a bordo, Astronauta {nome}! Nossa nave está pronta.")

distancia = int(input("Digite a distância da viagem, em km: "))
print(f"Vamos viajar {distancia} km de distância!")

velocidade_media = int(input("Digite a Velocidade Média da nave, em km/h: "))
tempo_horas = distancia // velocidade_media
tempo_dias = (distancia // velocidade_media) / 24
print(f"Caramba, {velocidade_media} km/h? Que nave veloz!")
print(f"Com essa velocidade, vamos demorar por volta de {tempo_horas} horas (ou {tempo_dias:.2f} dias)")
