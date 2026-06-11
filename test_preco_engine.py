"""Testes do motor de precificação — espelha preco-engine.js."""

import math

import pytest

SEMANAS_MES = 4
DESCONTO_ANUAL_VISTA = 0.1


def arredondar_mensalidade(valor):
    if valor <= 0:
        return 0
    return math.ceil(valor / 50) * 50


def calcular_preco(e):
    turmas = math.ceil(e["num_alunos"] / e["alunos_turma"])
    encontros_mes = e["encontros_semana"] * SEMANAS_MES
    custo_encontro = e["valor_hora"] * e["horas_encontro"]
    custo_prof = turmas * encontros_mes * custo_encontro

    piso_aula = custo_encontro / e["alunos_turma"]
    piso_mes = piso_aula * encontros_mes

    custo_real = (custo_prof + e["fixos"]) / e["num_alunos"]
    preco_min = custo_real * (1 + e["margem"] / 100)
    plano_12 = arredondar_mensalidade(preco_min)
    plano_vista = round(plano_12 * 12 * (1 - DESCONTO_ANUAL_VISTA))

    hora_min = max(120, e["valor_hora"] * 1.5)
    hora_max = max(180, e["valor_hora"] * 2.25)

    return {
        "turmas": turmas,
        "custo_encontro": custo_encontro,
        "piso_aula": piso_aula,
        "piso_mes": piso_mes,
        "custo_real": custo_real,
        "preco_min": preco_min,
        "plano_12": plano_12,
        "plano_vista": plano_vista,
        "hora_min": hora_min,
        "hora_max": hora_max,
    }


def test_exemplo_piso_turma_6():
    """R$ 80/h × 1,5h ÷ 6 alunos = R$ 20/aula; 8 aulas/mês → R$ 160 piso."""
    e = {
        "num_alunos": 50,
        "alunos_turma": 6,
        "horas_encontro": 1.5,
        "encontros_semana": 2,
        "valor_hora": 80,
        "fixos": 8000,
        "margem": 20,
    }
    r = calcular_preco(e)
    assert r["custo_encontro"] == 120
    assert r["piso_aula"] == 20
    assert r["piso_mes"] == 160


def test_custo_real_inclui_fixos():
    e = {
        "num_alunos": 50,
        "alunos_turma": 6,
        "horas_encontro": 1.5,
        "encontros_semana": 2,
        "valor_hora": 80,
        "fixos": 8000,
        "margem": 20,
    }
    r = calcular_preco(e)
    turmas = math.ceil(50 / 6)
    custo_prof = turmas * 8 * 120
    assert r["custo_real"] == pytest.approx((custo_prof + 8000) / 50)
    assert r["custo_real"] > r["piso_mes"]


def test_plano_anual_vista_desconto_10():
    e = {
        "num_alunos": 50,
        "alunos_turma": 8,
        "horas_encontro": 1.5,
        "encontros_semana": 2,
        "valor_hora": 80,
        "fixos": 6500,
        "margem": 15,
    }
    r = calcular_preco(e)
    assert r["plano_vista"] == round(r["plano_12"] * 12 * 0.9)


def test_hora_recuperacao_multiplicadores():
    e = {
        "num_alunos": 30,
        "alunos_turma": 6,
        "horas_encontro": 1.5,
        "encontros_semana": 2,
        "valor_hora": 80,
        "fixos": 5000,
        "margem": 20,
    }
    r = calcular_preco(e)
    assert r["hora_min"] == 120
    assert r["hora_max"] == 180
