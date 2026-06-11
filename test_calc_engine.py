"""Testes do motor V2."""

import pytest

from calc_engine import EntradaRoi, calcular_cenario, calcular_todos_cenarios


def test_cenario_base_lucro_positivo():
    e = EntradaRoi(
        investimento_total=200_000,
        numero_clientes=100,
        ticket_medio=150,
        custos_mensais=8_000,
        taxa_renda_fixa_anual=12,
    )
    r = calcular_cenario(e, "base")
    assert r.faturamento_mensal == 15_000
    assert r.lucro_mensal == 7_000
    assert r.roi_mensal_percentual == pytest.approx(3.5)


def test_depreciacao_e_prolabore():
    e = EntradaRoi(
        investimento_total=100_000,
        numero_clientes=50,
        ticket_medio=200,
        custos_mensais=3_000,
        taxa_renda_fixa_anual=10,
        prolabore_mensal=2_000,
        valor_equipamentos=24_000,
        vida_util_equipamentos_meses=24,
    )
    r = calcular_cenario(e)
    assert r.depreciacao_mensal == 1_000
    assert r.depreciacao_anual == 12_000
    assert r.lucro_mensal == 4_000
    assert r.lucro_anual == 48_000


def test_cenarios_fator_clientes():
    e = EntradaRoi(50_000, 100, 100, 2_000, 9)
    todos = calcular_todos_cenarios(e)
    assert todos["pessimista"].faturamento_mensal == 75 * 100
    assert todos["otimista"].faturamento_mensal == 125 * 100


def test_comparativo_anual_renda_fixa():
    e = EntradaRoi(100_000, 50, 200, 3_000, 10)
    r = calcular_cenario(e)
    assert r.rendimento_passivo_anual == 10_000
    assert r.rendimento_passivo_mensal == pytest.approx(10_000 / 12)
    assert r.diferencial_renda_fixa_anual == r.lucro_anual - r.rendimento_passivo_anual


def test_prejuizo_vermelho():
    e = EntradaRoi(10_000, 5, 50, 1_000, 9)
    r = calcular_cenario(e)
    assert r.lucro_mensal < 0
    assert r.semaforo == "vermelho"
    assert r.veredito == "Prejuízo"
