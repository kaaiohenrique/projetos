# Programa de Cálculo de descontos progressivos
# Autor: Kaio Henrique da Silva

# Entrada
print("Bem-vindo(a) ao sistema de cálculo descontos progressivos 😄")
total_compra = float(input("Por favor, digite o valor total da Compra, em Reais: R$ "))

# Processamento
if total_compra >= 300:
    porcentagem = "15%"
    valor = total_compra * 0.15
    desconto = total_compra - valor
    
elif total_compra < 200:
    porcentagem = "5%"
    valor = total_compra * 0.05
    desconto = total_compra - valor

else:
    porcentagem = "10%"
    valor = total_compra * 0.10
    desconto = total_compra - valor

# Saída
print(f"Parabéns! Você ganhou {porcentagem} de desconto, sendo R$ {desconto} de desconto. O valor final a ser pago é de SOMENTE R$ {valor}.")

print("Agradecemos imensamente a preferência e esperamos que tenha bom proveito do produto 😁")