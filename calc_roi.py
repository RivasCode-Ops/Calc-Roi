import math

def calcular_viabilidade(investimento_total, numero_clientes, ticket_medio, margem_lucro_percentual, taxa_selic_anual_percentual, valor_equipamentos=0, vida_util_equipamentos_meses=60):
    """
    Calcula a viabilidade de um negócio com base nas entradas fornecidas.

    Args:
        investimento_total (float): Valor total para abrir o negócio (CAPEX).
        numero_clientes (int): Expectativa de clientes ativos.
        ticket_medio (float): Valor médio cobrado por cliente (mensalidade).
        margem_lucro_percentual (float): Porcentagem que sobra após pagar impostos, funcionários, etc.
        taxa_selic_anual_percentual (float): Taxa Selic ou Renda Fixa (% ao ano) para custo de oportunidade.
        valor_equipamentos (float, optional): Valor total dos equipamentos para cálculo de depreciação. Defaults to 0.
        vida_util_equipamentos_meses (int, optional): Vida útil dos equipamentos em meses. Defaults to 60.

    Returns:
        dict: Um dicionário contendo os resultados dos cálculos.
    """

    # Módulo 1: Variáveis de Entrada (já recebidas como argumentos)

    # Módulo 2: Cálculos Operacionais
    faturamento_bruto_mensal = numero_clientes * ticket_medio
    lucro_liquido_mensal_bruto = faturamento_bruto_mensal * (margem_lucro_percentual / 100)

    # BÔNUS: Depreciação
    depreciacao_mensal = 0
    if valor_equipamentos > 0 and vida_util_equipamentos_meses > 0:
        depreciacao_mensal = valor_equipamentos / vida_util_equipamentos_meses
    
    lucro_liquido_mensal = lucro_liquido_mensal_bruto - depreciacao_mensal

    roi_mensal = (lucro_liquido_mensal / investimento_total) * 100 if investimento_total > 0 else 0
    payback_simples_meses = investimento_total / lucro_liquido_mensal if lucro_liquido_mensal > 0 else float('inf')

    # Módulo 3: O Custo de Oportunidade
    taxa_renda_fixa_mensal_percentual = taxa_selic_anual_percentual / 12
    rendimento_passivo_mensal = investimento_total * (taxa_renda_fixa_mensal_percentual / 100)

    diferencial_de_risco = lucro_liquido_mensal - rendimento_passivo_mensal

    # Módulo 4: Veredito
    veredicto = "Positivo: O negócio está pagando pelo seu trabalho e risco." if diferencial_de_risco >= 0 else "Negativo: Você está trabalhando de graça e perdendo dinheiro (seria melhor deixar no banco)."

    return {
        "investimento_total": investimento_total,
        "numero_clientes": numero_clientes,
        "ticket_medio": ticket_medio,
        "margem_lucro_percentual": margem_lucro_percentual,
        "taxa_selic_anual_percentual": taxa_selic_anual_percentual,
        "valor_equipamentos": valor_equipamentos,
        "vida_util_equipamentos_meses": vida_util_equipamentos_meses,
        "faturamento_bruto_mensal": faturamento_bruto_mensal,
        "lucro_liquido_mensal_bruto": lucro_liquido_mensal_bruto,
        "depreciacao_mensal": depreciacao_mensal,
        "lucro_liquido_mensal": lucro_liquido_mensal,
        "roi_mensal": roi_mensal,
        "payback_simples_meses": payback_simples_meses,
        "taxa_renda_fixa_mensal_percentual": taxa_renda_fixa_mensal_percentual,
        "rendimento_passivo_mensal": rendimento_passivo_mensal,
        "diferencial_de_risco": diferencial_de_risco,
        "veredicto": veredicto
    }

if __name__ == "__main__":
    print("\n--- Calculadora de Viabilidade de Negócio ---")
    print("Preencha os dados para simular a viabilidade do seu negócio.\n")

    try:
        investimento = float(input("1. Investimento Total (CAPEX) [R$]: "))
        clientes = int(input("2. Número de Clientes Esperados: "))
        ticket = float(input("3. Ticket Médio por Cliente (mensalidade) [R$]: "))
        margem = float(input("4. Margem de Lucro Estimada (%): "))
        selic = float(input("5. Taxa Selic/Renda Fixa (% ao ano): "))
        
        incluir_depreciacao = input("Incluir cálculo de depreciação? (s/n): ").lower()
        valor_equip = 0
        if incluir_depreciacao == 's':
            valor_equip = float(input("Valor Total dos Equipamentos para Depreciação [R$]: "))
            
        resultados = calcular_viabilidade(investimento, clientes, ticket, margem, selic, valor_equip)

        print("\n--- Resultados da Simulação ---")
        print(f"Investimento Total: R$ {resultados['investimento_total']:.2f}")
        print(f"Número de Clientes: {resultados['numero_clientes']}")
        print(f"Ticket Médio: R$ {resultados['ticket_medio']:.2f}")
        print(f"Margem de Lucro: {resultados['margem_lucro_percentual']:.2f}%")
        print(f"Taxa de Renda Fixa Anual: {resultados['taxa_selic_anual_percentual']:.2f}%")
        if resultados['valor_equipamentos'] > 0:
            print(f"Valor dos Equipamentos para Depreciação: R$ {resultados['valor_equipamentos']:.2f}")
            print(f"Depreciação Mensal: R$ {resultados['depreciacao_mensal']:.2f}")

        print("\n--- Cálculos Operacionais ---")
        print(f"Faturamento Bruto Mensal: R$ {resultados['faturamento_bruto_mensal']:.2f}")
        print(f"Lucro Líquido Mensal (após depreciação): R$ {resultados['lucro_liquido_mensal']:.2f}")
        print(f"ROI Mensal: {resultados['roi_mensal']:.2f}%")
        print(f"Payback Simples: {resultados['payback_simples_meses']:.2f} meses")

        print("\n--- Custo de Oportunidade ---")
        print(f"Rendimento Passivo Mensal (no banco): R$ {resultados['rendimento_passivo_mensal']:.2f}")
        print(f"Diferencial de Risco (Lucro Líquido - Rendimento Passivo): R$ {resultados['diferencial_de_risco']:.2f}")
        print(f"Veredito: {resultados['veredicto']}")

        # Módulo 4: Simulação Prática (Caso Cerol no Vídeo)
        print("\n--- Simulação do Caso Cerol (para validação) ---")
        investimento_cerol = 20000000.00
        alunos_cerol = 5000
        ticket_cerol = 130.00
        margem_cerol = 20.00
        selic_cerol = 9.00
        
        resultados_cerol = calcular_viabilidade(investimento_cerol, alunos_cerol, ticket_cerol, margem_cerol, selic_cerol)
        
        print(f"Investimento: R$ {resultados_cerol['investimento_total']:.2f}")
        print(f"Alunos: {resultados_cerol['numero_clientes']}")
        print(f"Ticket: R$ {resultados_cerol['ticket_medio']:.2f}")
        print(f"Margem: {resultados_cerol['margem_lucro_percentual']:.2f}%")
        print(f"Taxa de Juros: {resultados_cerol['taxa_selic_anual_percentual']:.2f}% ao ano")
        print(f"\nResultados Cerol:")
        print(f"1. Faturamento: R$ {resultados_cerol['faturamento_bruto_mensal']:.2f}")
        print(f"2. Lucro Líquido: R$ {resultados_cerol['lucro_liquido_mensal']:.2f}")
        print(f"3. Rendimento no Banco (Custo de Oportunidade): R$ {resultados_cerol['rendimento_passivo_mensal']:.2f}")
        print(f"4. Veredito: {resultados_cerol['veredicto']}. Diferencial: R$ {resultados_cerol['diferencial_de_risco']:.2f}")

    except ValueError:
        print("Erro: Por favor, insira valores numéricos válidos para as entradas.")
    except Exception as e:
        print(f"Ocorreu um erro inesperado: {e}")
