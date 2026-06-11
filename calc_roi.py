"""CLI — Raio-X de Negócios V2."""

from __future__ import annotations

from calc_engine import EntradaRoi, calcular_todos_cenarios


def _fmt(v: float) -> str:
    return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def main() -> None:
    print("\n--- Raio-X de Negócios V2 ---\n")
    try:
        entrada = EntradaRoi(
            investimento_total=float(input("Investimento total (R$): ")),
            numero_clientes=int(input("Clientes esperados: ")),
            ticket_medio=float(input("Ticket médio mensal (R$): ")),
            custos_mensais=float(input("Custos mensais totais (R$): ")),
            taxa_renda_fixa_anual=float(input("Renda fixa (% ao ano): ")),
            prolabore_mensal=float(input("Pró-labore mensal (R$, 0 se não): ") or 0),
            valor_equipamentos=float(input("Valor equipamentos depreciáveis (R$, 0 se não): ") or 0),
        )
        if entrada.valor_equipamentos > 0:
            vida = input("Vida útil equipamentos (meses, default 60): ").strip()
            if vida:
                entrada = EntradaRoi(
                    **{**entrada.__dict__, "vida_util_equipamentos_meses": int(vida)}
                )

        resultados = calcular_todos_cenarios(entrada)
        for nome, r in resultados.items():
            print(f"\n--- Cenário {nome.upper()} ---")
            print(f"Faturamento: {_fmt(r.faturamento_mensal)}")
            if r.depreciacao_mensal > 0:
                print(f"Depreciação: {_fmt(r.depreciacao_mensal)}")
            print(f"Aplicação financeira rende (ano): {_fmt(r.rendimento_passivo_anual)}")
            print(f"Negócio retorna (ano): {_fmt(r.lucro_anual)}")
            print(f"Lucro mensal: {_fmt(r.lucro_mensal)}")
            if r.depreciacao_anual > 0:
                print(f"Depreciação (ano): {_fmt(r.depreciacao_anual)}")
            print(f"ROI: {r.roi_mensal_percentual:.2f}%/mês · {r.roi_anual_percentual:.2f}%/ano")
            pb = f"{r.payback_meses:.1f} meses" if r.payback_meses else "—"
            print(f"Payback: {pb}")
            print(f"Diferença (mês): {_fmt(r.diferencial_renda_fixa)}")
            print(f"Diferença (ano): {_fmt(r.diferencial_renda_fixa_anual)}")
            print(f"Veredito: {r.veredito} [{r.semaforo}]")

    except ValueError:
        print("Erro: valores numéricos inválidos.")
    except KeyboardInterrupt:
        print("\nCancelado.")


if __name__ == "__main__":
    main()
