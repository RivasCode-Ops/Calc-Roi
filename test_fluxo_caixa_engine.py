"""Testes — motor de fluxo de caixa mensal (espelha fluxo-caixa-engine.js)."""

from __future__ import annotations

import pytest


def veredito_fluxo_caixa(saldo_final: float, fluxo_mes: float) -> dict:
    if saldo_final < 0:
        return {"texto": "Caixa negativo — risco alto", "semaforo": "vermelho"}
    if fluxo_mes < 0:
        return {"texto": "Queimando caixa — atenção", "semaforo": "amarelo"}
    return {"texto": "Caixa crescendo — saudável", "semaforo": "verde"}


def calcular_fluxo_caixa_mensal(entrada: dict) -> dict:
    alunos = max(0, entrada.get("alunosAtuais") or 0)
    mensalidade = max(0, entrada.get("mensalidade") or 0)
    evasao_pct = min(100, max(0, entrada.get("evasaoPct") or 0))
    inadimplencia_pct = min(100, max(0, entrada.get("inadimplenciaPct") or 0))

    receita_bruta = alunos * mensalidade
    alunos_pagantes = alunos * (1 - evasao_pct / 100)
    receita_bruta_ajustada = alunos_pagantes * mensalidade
    perda_inadimplencia = receita_bruta_ajustada * (inadimplencia_pct / 100)
    receita_liquida_mensalidades = receita_bruta_ajustada - perda_inadimplencia

    outros_entradas = entrada.get("outrosEntradas") or 0
    entradas_totais = receita_liquida_mensalidades + outros_entradas

    saidas_operacionais = (
        (entrada.get("folhaTotal") or 0)
        + (entrada.get("custosFixosTotal") or 0)
        + (entrada.get("prolabore") or 0)
    )
    investimentos_mes = entrada.get("investimentosMes") or 0
    outros_saidas = entrada.get("outrosSaidas") or 0
    saidas_totais = saidas_operacionais + investimentos_mes + outros_saidas

    fluxo_mes = entradas_totais - saidas_totais
    saldo_inicial = entrada.get("saldoInicial") or 0
    saldo_final = saldo_inicial + fluxo_mes

    return {
        "receitaBruta": receita_bruta,
        "alunosPagantes": alunos_pagantes,
        "receitaBrutaAjustada": receita_bruta_ajustada,
        "perdaInadimplencia": perda_inadimplencia,
        "receitaLiquidaMensalidades": receita_liquida_mensalidades,
        "entradasTotais": entradas_totais,
        "saidasOperacionais": saidas_operacionais,
        "saidasTotais": saidas_totais,
        "fluxoMes": fluxo_mes,
        "saldoFinal": saldo_final,
        "veredito": veredito_fluxo_caixa(saldo_final, fluxo_mes),
    }


def _base_entrada(**overrides):
    base = {
        "alunosAtuais": 50,
        "mensalidade": 700,
        "folhaTotal": 10_000,
        "custosFixosTotal": 8_000,
        "prolabore": 3_000,
        "saldoInicial": 5_000,
        "inadimplenciaPct": 0,
        "evasaoPct": 0,
        "investimentosMes": 0,
        "outrosEntradas": 0,
        "outrosSaidas": 0,
    }
    base.update(overrides)
    return base


def test_caso_base_sem_inadimplencia_nem_evasao():
    r = calcular_fluxo_caixa_mensal(_base_entrada())
    assert r["receitaBruta"] == 35_000
    assert r["alunosPagantes"] == 50
    assert r["receitaLiquidaMensalidades"] == 35_000
    assert r["saidasOperacionais"] == 21_000
    assert r["fluxoMes"] == 14_000
    assert r["saldoFinal"] == 19_000
    assert r["veredito"]["semaforo"] == "verde"


def test_caso_com_inadimplencia():
    r = calcular_fluxo_caixa_mensal(_base_entrada(inadimplenciaPct=10))
    assert r["receitaBrutaAjustada"] == 35_000
    assert r["perdaInadimplencia"] == pytest.approx(3_500)
    assert r["receitaLiquidaMensalidades"] == pytest.approx(31_500)
    assert r["fluxoMes"] == pytest.approx(10_500)


def test_caso_com_evasao():
    r = calcular_fluxo_caixa_mensal(_base_entrada(evasaoPct=10))
    assert r["alunosPagantes"] == pytest.approx(45)
    assert r["receitaBrutaAjustada"] == pytest.approx(31_500)
    assert r["receitaLiquidaMensalidades"] == pytest.approx(31_500)


def test_caso_com_entradas_e_saidas_extras():
    r = calcular_fluxo_caixa_mensal(
        _base_entrada(
            outrosEntradas=2_000,
            outrosSaidas=1_000,
            investimentosMes=5_000,
        )
    )
    assert r["entradasTotais"] == 37_000
    assert r["saidasTotais"] == 27_000
    assert r["fluxoMes"] == 10_000
    assert r["saldoFinal"] == 15_000


def test_veredito_vermelho_saldo_final_negativo():
    r = calcular_fluxo_caixa_mensal(
        _base_entrada(saldoInicial=1_000, folhaTotal=30_000, custosFixosTotal=10_000)
    )
    assert r["saldoFinal"] < 0
    assert r["veredito"]["semaforo"] == "vermelho"
    assert r["veredito"]["texto"] == "Caixa negativo — risco alto"


def test_veredito_amarelo_queimando_caixa():
    r = calcular_fluxo_caixa_mensal(_base_entrada(saldoInicial=20_000, folhaTotal=25_000))
    assert r["fluxoMes"] < 0
    assert r["saldoFinal"] >= 0
    assert r["veredito"]["semaforo"] == "amarelo"
    assert r["veredito"]["texto"] == "Queimando caixa — atenção"


def test_veredito_verde_fluxo_positivo():
    r = calcular_fluxo_caixa_mensal(_base_entrada())
    assert r["fluxoMes"] >= 0
    assert r["veredito"]["semaforo"] == "verde"
    assert r["veredito"]["texto"] == "Caixa crescendo — saudável"
