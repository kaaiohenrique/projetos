# Programa de classificação e alertas sobre uso consciente de água
# Autor: Kaio Henrique da Silva

# Entrada
print("Bem-vindo ao sistema de classificação de consumo de água!")
tipo_imovel = input("Digite o tipo de imóvel (1 - comercial, 2 - casa, 3 - apartamento): ")
consumo_agua = float(input("Digite o consumo de água, em m³: "))

# Processamento

# Saída
match tipo_imovel:
    case "1" | "comercial" | "Comercial":
        print("Tarifa comercial aplicada – consulte o plano corporativo.")

    case "3" | "apartamento" | "Apartamento":
        if consumo_agua < 10:
            print("Consumo econômico – excelente controle de água!")

    case "2" | "casa" | "Casa" | "3" | "apartamento" | "Apartamento":
        if consumo_agua < 25:
            print("Consumo moderado – dentro do padrão residencial.")

    case _:
        print("Consumo excessivo – adote medidas de economia e verifique vazamentos.")
        
print("Agradecemos e lembramos da importãncia do uso consciente de água!")