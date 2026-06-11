"""Testes do motor central de gestão — espelha gestao-engine.js."""

import math

import pytest

SEMANAS = 4  # não usado diretamente; custos vêm do mestre


def totais_mestre(m):
    inv = sum(m["investimento"].values())
    folha = sum(e["q"] * e["s"] for e in m["equipe"])
    fixos = sum(m["fixos"].values())
    custos = folha + fixos + m["metas"]["prolabore"]
    return inv, folha, fixos, custos


def analisar(m, n):
    folha, fixos, custos = totais_mestre(m)[1:]
    cap = m["capacidade"]
    turmas = math.ceil(n / cap["alunos_turma"])
    horas = turmas * cap["aulas_sem"] * cap["horas_aula"]
    prof = max(1, math.ceil(horas / cap["carga_prof"]))
    receita = n * m["precos"]["mensalidade"]
    lucro = receita - custos
    return {
        "turmas": turmas,
        "horas": horas,
        "prof": prof,
        "receita": receita,
        "custos": custos,
        "lucro": lucro,
    }


def mestre_exemplo():
    return {
        "investimento": {"reforma": 25000, "moveis": 15000, "outros": 40000},
        "capacidade": {
            "alunos_turma": 8,
            "aulas_sem": 2,
            "horas_aula": 1.5,
            "carga_prof": 20,
            "alunos_atuais": 50,
        },
        "precos": {"mensalidade": 700},
        "equipe": [
            {"q": 1, "s": 3500},
            {"q": 2, "s": 2500},
            {"q": 1, "s": 2500},
            {"q": 0, "s": 0},
            {"q": 1, "s": 1800},
            {"q": 1, "s": 800},
            {"q": 0, "s": 0},
            {"q": 0, "s": 0},
        ],
        "fixos": {
            "aluguel": 4500,
            "energia": 600,
            "internet": 200,
            "agua": 150,
            "material_esc": 400,
            "material_lim": 200,
            "marketing": 800,
            "sistemas": 300,
            "contabilidade": 500,
            "impostos": 600,
            "outros": 500,
        },
        "metas": {"prolabore": 3000, "margem": 20, "reserva": 5},
    }


def test_capacidade_50_alunos_exemplo():
    m = mestre_exemplo()
    r = analisar(m, 50)
    assert r["turmas"] == 7
    assert r["horas"] == pytest.approx(21)
    assert r["prof"] == 2


def test_viabilidade_50_alunos():
    m = mestre_exemplo()
    r = analisar(m, 50)
    _, _, custos = totais_mestre(m)[1:]
    assert r["receita"] == 50 * 700
    assert r["custos"] == custos
    assert r["lucro"] == r["receita"] - custos


def test_equilibrio():
    m = mestre_exemplo()
    _, _, custos = totais_mestre(m)[1:]
    n = math.ceil(custos / m["precos"]["mensalidade"])
    r = analisar(m, n)
    assert r["lucro"] >= 0


def test_roi_payback():
    m = mestre_exemplo()
    inv = sum(m["investimento"].values())
    r = analisar(m, 50)
    payback = inv / r["lucro"]
    assert payback == pytest.approx(inv / (50 * 700 - r["custos"]))
