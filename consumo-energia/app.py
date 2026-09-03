# Entrada
nomedoaparelho = input("✏️ Digite o nome do aparelho: ")
potencia = float(input("🔌 Digite a potência do aparelho, em Watts (W): "))
tempo = int(input("🕗 Digite o tempo médio de uso diário do aparelho, em Horas (h)"))
valorkWh = float(input("🪙 Há um Valor fixo no consumo de cada kWh? Se sim, digite-o. Caso não haja, deixe em branco: "))

# Processamento
consumomes = (potencia * tempo * 30) / 1000
if valorkWh != "":
    consumomes*valorkWh
else:
    consumomes

#Saída
if valorkWh != "":
    print(f"📊 O aparelho {nomedoaparelho} tem um consumo médio de {consumomes:.2f} kWh por mês")
else:
    print(f"📊 O aparelho {nomedoaparelho} tem um consumo médio de {consumomes:.2f} kWh por mês, e o valor de R${consumomes*valorkWh:.2f} de consumo.")
