# Entrada
nomedoaparelho = input("✏️ Digite o nome do aparelho: ")
potencia = float(input("🔌 Digite a potência do aparelho, em Watts (W): "))
tempo = int(input("🕗 Digite o tempo médio de uso diário do aparelho, em Horas (h): "))
valorkWh = float(input("🪙 Há um Valor fixo no consumo de cada kWh? Se sim, digite-o. Caso não haja, digite 0: "))

# Processamento
consumokWh = (potencia * tempo * 30) / 1000
if valorkWh == 0:
    consumovalor = "Sem valor para cálculo."
else:
    consumovalor = consumokWh * valorkWh

#Saída
if valorkWh == 0:
    print(f"📊 O aparelho {nomedoaparelho} tem um consumo médio de {consumokWh:.2f} kWh por mês.")
else:
    print(f"📊 O aparelho {nomedoaparelho} tem um consumo médio de {consumokWh:.2f} kWh por mês, e o valor é de aproximadamente R${consumovalor:.2f}.")